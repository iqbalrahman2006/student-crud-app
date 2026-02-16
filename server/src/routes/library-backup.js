const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Transaction = require('../models/BorrowTransaction');
const Student = require('../models/Student');
const LibraryFineLedger = require('../models/LibraryFineLedger');
const BookReservation = require('../models/BookReservation');
const LibraryAuditLog = require('../models/LibraryAuditLog');

const ensureLibraryRole = require('../middleware/rbac');
const autoTagBook = require('../utils/tagger');
const logLibraryAction = require('../utils/libraryLogger');

// Services
const bookService = require('../services/bookService');
const analyticsService = require('../services/analyticsService');
const calculateFine = require('../utils/fineEngine'); // Still used in helpers? or moved to service?Service imports it.

// --- BOOK ROUTES ---

// --- INVENTORY SUMMARY ENDPOINT ---
router.get('/inventory/summary', async (req, res) => {
    try {
        // Aggregation to get book copies stats
        const bookStats = await Book.aggregate([
            {
                $group: {
                    _id: null,
                    totalBooksCount: { $sum: "$totalCopies" }, // This is Total Copies
                    totalAvailableCopies: { $sum: { $subtract: ["$totalCopies", "$checkedOutCount"] } }, // Recalculate to be sure
                    totalDistinctBooks: { $sum: 1 }
                }
            }
        ]);

        // Realtime Transaction check for Checked Out count
        // We trust Transaction count more than book.checkedOutCount sum if there's drift, 
        // but for now let's stick to the requested "Checked Out" = sum of active loans.
        const activeLoansCount = await Transaction.countDocuments({ status: 'BORROWED' });

        // Overdue count (Borrowed AND DueDate < Now)
        const overdueCount = await Transaction.countDocuments({
            status: 'BORROWED',
            dueDate: { $lt: new Date() }
        });

        const stats = bookStats[0] || { totalBooksCount: 0, totalAvailableCopies: 0, totalDistinctBooks: 0 };

        res.status(200).json({
            status: 'success',
            data: {
                totalDistinctBooks: stats.totalDistinctBooks,
                totalCopies: stats.totalBooksCount,
                totalAvailableCopies: stats.totalBooksCount - activeLoansCount, // Available = Total - Active Loans (Source of truth)
                totalCheckedOut: activeLoansCount,
                overdueCount: overdueCount
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- REMINDER CENTER & STATUS ---
router.get('/reminders/status', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const today = new Date();
        const sevenDaysLater = new Date(); sevenDaysLater.setDate(today.getDate() + 7);
        const twoDaysLater = new Date(); twoDaysLater.setDate(today.getDate() + 2);

        // 1. Due in 7 Days (Range: Today < Due <= Today+7)
        // Actually usually means "Due exactly 7 days from now" or "Within next 7 days". 
        // User asked: "Due in 7 Days (1-week Reminder)" and "Due in 2 days".
        // Let's grab everything in the window.

        const dueIn7Days = await Transaction.find({
            status: 'BORROWED',
            dueDate: { $gt: today, $lte: sevenDaysLater }
        }).populate('studentId', 'name email').populate('bookId', 'title department');

        const dueIn2Days = await Transaction.find({
            status: 'BORROWED',
            dueDate: { $gt: today, $lte: twoDaysLater }
        }).populate('studentId', 'name email').populate('bookId', 'title department');

        const overdue = await Transaction.find({
            status: 'BORROWED',
            dueDate: { $lt: today }
        }).populate('studentId', 'name email').populate('bookId', 'title department');

        // Helper to format
        const formatTxn = (t) => ({
            id: t._id,
            studentName: t.studentId ? t.studentId.name : 'Unknown',
            studentEmail: t.studentId ? t.studentId.email : 'No Email',
            bookTitle: t.bookId ? t.bookId.title : 'Unknown Title',
            department: t.bookId ? t.bookId.department : 'N/A',
            dueDate: t.dueDate,
            emailStatus: 'Pending' // TODO: wire up with audit / scheduler logs if needed
        });

        res.status(200).json({
            status: 'success',
            data: {
                dueIn7Days: dueIn7Days.map(formatTxn),
                dueIn2Days: dueIn2Days.map(formatTxn),
                overdue: overdue.map(formatTxn)
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- BOOK ROUTES ---

// GET All Books (Supports ?overdue=true)
router.get('/books', async (req, res) => {
    try {
        const { overdue, search } = req.query;
        let filter = {};

        if (overdue === 'true') {
            const overdueTxns = await Transaction.find({
                status: 'BORROWED',
                dueDate: { $lt: new Date() }
            }).distinct('bookId');

            filter = { _id: { $in: overdueTxns } };
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { title: searchRegex },
                { author: searchRegex },
                { isbn: searchRegex }
            ];
        }

        // Pagination Logic
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 25;
        if (limit > 200) limit = 200; // Enforce Max Limit
        const skip = (page - 1) * limit;

        const books = await Book.find(filter)
            .sort({ title: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Book.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: books.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: books
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ADD Book (RBAC: Admin/Librarian)
router.post('/books', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        // Auto Tagging
        const { title, department, isbn } = req.body;
        const tags = autoTagBook(title, department, isbn);

        // Ensure defaults
        const newBookData = {
            ...req.body,
            autoTags: tags,
            checkedOutCount: 0
        };

        const newBook = await Book.create(newBookData);

        await logLibraryAction('ADD', { bookId: newBook._id, adminId: req.user ? req.user._id : undefined, metadata: { title: newBook.title }, req });

        res.status(201).json({ status: 'success', data: newBook });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// UPDATE Book (RBAC: Admin/Librarian)
router.patch('/books/:id', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        // Find first to apply logic if needed
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ status: 'fail', message: 'Book not found' });

        // Update fields
        Object.keys(req.body).forEach(key => {
            book[key] = req.body[key];
        });

        // This will trigger pre-save hook to recalc availableCopies
        await book.save();

        await logLibraryAction('UPDATE', { bookId: book._id, adminId: req.user ? req.user._id : undefined, metadata: req.body, req });

        res.status(200).json({ status: 'success', data: book });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// DELETE Book (RBAC: Admin)
router.delete('/books/:id', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        // REFERENTIAL INTEGRITY CHECK: Prevent deletion if book has any transactions
        const hasTransactions = await Transaction.exists({ bookId: req.params.id });

        if (hasTransactions) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cannot delete book with transaction history. Please archive the book instead.'
            });
        }

        const book = await Book.findByIdAndDelete(req.params.id);
        if (book) await logLibraryAction('DELETE', { bookId: book._id, adminId: req.user ? req.user._id : undefined, req });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- TRANSACTION ROUTES ---

// ISSUE Book
router.post('/issue', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { bookId, studentId, days = 14 } = req.body;

        // REFERENTIAL INTEGRITY: Verify student exists
        const studentExists = await Student.exists({ _id: studentId });
        if (!studentExists) {
            return res.status(404).json({ status: 'fail', message: 'Student not found' });
        }

        // REFERENTIAL INTEGRITY: Verify book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ status: 'fail', message: 'Book not found' });
        }

        // DUPLICATE PREVENTION: Check for existing active transaction
        const existingTransaction = await Transaction.findOne({
            bookId: bookId,
            studentId: studentId,
            status: 'BORROWED'
        });
        if (existingTransaction) {
            return res.status(400).json({
                status: 'fail',
                message: 'Student already has an active loan for this book'
            });
        }

        // Robust check: Use derived availableCopies
        const available = book.totalCopies - book.checkedOutCount;
        if (available < 1) {
            return res.status(400).json({ status: 'fail', message: 'Book not available' });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        const transaction = await Transaction.create({
            bookId: bookId,
            studentId: studentId,
            issuedAt: Date.now(),
            dueDate: dueDate,
            status: 'BORROWED'
        });

        // Atomic update preferred, but save hook handles sync
        book.checkedOutCount += 1;
        await book.save();

        await logLibraryAction('BORROW', { bookId, studentId, adminId: req.user ? req.user._id : undefined, req });

        const populated = await Transaction.findById(transaction._id).populate('bookId').populate('studentId');
        res.status(201).json({ status: 'success', data: populated });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// RETURN Book (With Fine Engine)
router.post('/return', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { transactionId } = req.body;
        const txn = await Transaction.findById(transactionId);

        if (!txn) {
            return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
        }

        // DOUBLE-RETURN PREVENTION
        if (txn.status === 'RETURNED') {
            return res.status(400).json({
                status: 'fail',
                message: 'Book has already been returned for this transaction'
            });
        }

        if (txn.status !== 'BORROWED' && txn.status !== 'OVERDUE') {
            return res.status(400).json({ status: 'fail', message: 'Invalid transaction status for return' });
        }

        // 1. Calculate Fine
        const fine = await calculateFine(txn, true); // true = finalize

        // 2. Update Txn
        txn.returnedAt = Date.now();
        txn.status = 'RETURNED';
        txn.fineAmount = fine;
        await txn.save();

        // 3. Update Inventory
        const book = await Book.findById(txn.bookId);
        if (book) {
            // Decrement checkedOutCount carefully
            book.checkedOutCount = Math.max(0, book.checkedOutCount - 1);
            await book.save();

            // 4. Reservation Check
            // Notify/Hold for next in queue
            const nextRes = await BookReservation.findOne({ book: book._id, status: 'Active' }).sort({ queuePosition: 1 });
            if (nextRes) {
                // Logic: In real app, we'd "Hold" the copy. For now, just log and notify.
                await logLibraryAction('RETURN', { bookId: book._id, studentId: nextRes.student, metadata: { reserved: true, info: "Book Returned. Reserved for next student." } });
                // We could mark reservation as 'Notified'
            }
        }

        await logLibraryAction('RETURN', { bookId: txn.bookId, studentId: txn.studentId, adminId: req.user ? req.user._id : undefined, metadata: { fine }, req });

        res.status(200).json({ status: 'success', data: txn, fineApplied: fine });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// RENEW Book
router.post('/renew', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { transactionId, days = 7 } = req.body;
        const txn = await Transaction.findById(transactionId);

        if (!txn || txn.status !== 'BORROWED') {
            return res.status(400).json({ status: 'fail', message: 'Cannot renew this transaction' });
        }
        if (txn.renewalCount >= 2) {
            return res.status(400).json({ status: 'fail', message: 'Maximum renewals limit (2) reached.' });
        }
        if (new Date() > new Date(txn.dueDate)) {
            return res.status(400).json({ status: 'fail', message: 'Cannot renew overdue books. Please return first.' });
        }

        const currentDue = new Date(txn.dueDate);
        currentDue.setDate(currentDue.getDate() + days);

        txn.dueDate = currentDue;
        txn.renewalCount += 1;
        await txn.save();

        await logLibraryAction('RENEW', { bookId: txn.bookId, studentId: txn.studentId, adminId: req.user ? req.user._id : undefined, req });

        res.status(200).json({ status: 'success', data: txn });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// ALIAS: BORROW (Same as Issue)
router.post('/borrow', ensureLibraryRole(['ADMIN']), async (req, res) => {
    // Reuse Issue Logic - Redirect internally or copy code (Copying for strict separation/safety)
    try {
        const { bookId, studentId, days = 14 } = req.body;

        // REFERENTIAL INTEGRITY: Verify student exists
        const studentExists = await Student.exists({ _id: studentId });
        if (!studentExists) {
            return res.status(404).json({ status: 'fail', message: 'Student not found' });
        }

        // REFERENTIAL INTEGRITY: Verify book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({ status: 'fail', message: 'Book not found' });
        }

        // DUPLICATE PREVENTION: Check for existing active transaction
        const existingTransaction = await Transaction.findOne({
            bookId: bookId,
            studentId: studentId,
            status: 'BORROWED'
        });
        if (existingTransaction) {
            return res.status(400).json({
                status: 'fail',
                message: 'Student already has an active loan for this book'
            });
        }

        const available = book.totalCopies - book.checkedOutCount;
        if (available < 1) {
            return res.status(400).json({ status: 'fail', message: 'Book not available' });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        const transaction = await Transaction.create({
            bookId, studentId, issuedAt: Date.now(), dueDate, status: 'BORROWED'
        });

        book.checkedOutCount += 1;
        await book.save();

        await logLibraryAction('BORROW', { bookId, studentId, adminId: req.user?._id, req });

        // Email Engine Integration Check (Mock call if needed, but Scheduler handles reminders)

        res.status(201).json({ status: 'success', data: transaction });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// --- ANALYTICS ENHANCED ---
router.get('/analytics', async (req, res) => {
    try {
        const data = await analyticsService.getDashboardStats();
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- STUDENT LIBRARY PROFILE ---
router.get('/profile/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const activeLoans = await Transaction.find({ studentId: studentId, status: 'BORROWED' }).populate('bookId');
        const pastLoans = await Transaction.find({ studentId: studentId, status: 'RETURNED' }).sort({ returnedAt: -1 }).limit(10).populate('bookId');
        const fines = await LibraryFineLedger.find({ student: studentId }).sort({ timestamp: -1 });
        const reservations = await BookReservation.find({ student: studentId, status: 'Active' }).populate('book');
        const auditLogs = await LibraryAuditLog.find({ studentId: studentId }).sort({ timestamp: -1 }).limit(20);

        res.status(200).json({
            status: 'success',
            data: {
                activeLoans,
                pastLoans,
                fines,
                reservations,
                auditLogs
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- RESERVATIONS ---
router.post('/reserve', ensureLibraryRole(['ADMIN', 'LIBRARIAN', 'STUDENT']), async (req, res) => {
    try {
        const { bookId, studentId, reservedUntil } = req.body;
        // Basic validation
        if (!bookId || !studentId) return res.status(400).json({ status: 'fail', message: 'Missing bookId or studentId' });

        const data = await bookService.reserveBook({ bookId, studentId, reservedUntil }, req.user ? req.user._id : null, req);
        res.status(201).json({ status: 'success', data });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

router.get('/reservations', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { status } = req.query;
        const data = await bookService.getReservations({ status });
        res.status(200).json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

router.post('/reserve/action', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { reservationId, action } = req.body;
        const reservation = await BookReservation.findById(reservationId);
        if (!reservation) return res.status(404).json({ status: 'fail', message: 'Reservation not found' });

        if (action === 'CANCEL') {
            reservation.status = 'Cancelled';
            await reservation.save();
            return res.status(200).json({ status: 'success', message: 'Reservation Cancelled' });
        }

        if (action === 'FULFILL') {
            const book = await Book.findById(reservation.book);
            // Issue logic (Manual invocation or service reuse)
            // We use the Issue logic from Transaction Routes but encapsulated
            const available = book.totalCopies - book.checkedOutCount;
            if (available < 1) return res.status(400).json({ status: 'fail', message: 'Book not available for issue' });

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14); // Default 14 days

            await Transaction.create({
                bookId: reservation.book,
                studentId: reservation.student,
                issuedAt: Date.now(),
                dueDate: dueDate,
                status: 'BORROWED'
            });

            book.checkedOutCount += 1;
            await book.save();

            reservation.status = 'Fulfilled';
            reservation.fulfilledAt = Date.now();
            await reservation.save();

            await logLibraryAction('BORROW', { bookId: book._id, studentId: reservation.student, adminId: req.user?._id, metadata: { info: 'reservation fulfilled' }, req });

            return res.status(200).json({ status: 'success', message: 'Book Issued and Reservation Fulfilled' });
        }

        res.status(400).json({ status: 'fail', message: 'Invalid Action' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- IMPORT/EXPORT (Mock) ---
router.get('/export', ensureLibraryRole(['ADMIN', 'AUDITOR']), async (req, res) => {
    // In real app, generate CSV stream
    res.setHeader('Content-Type', 'text/csv');
    res.attachment('library_audit_logs.csv');
    res.send(`Timestamp,Action,Details\n${new Date().toISOString()},EXPORT_INITIATED,User downloaded logs`);
});

router.post('/import', ensureLibraryRole(['ADMIN']), async (req, res) => {
    // In real app, parse file upload
    await logLibraryAction('ADD', { adminId: req.user ? req.user._id : undefined, metadata: { source: 'BULK_IMPORT', info: "Imported books via CSV" }, req });
    res.status(200).json({ status: 'success', message: 'Import processed (Mock)' });
});

// GET Transactions
router.get('/transactions', async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};
        if (status) {
            // Support query params like 'Issued' or 'BORROWED'
            // If status is 'Issued', we might need to search for 'BORROWED' too if we standardized?
            // But existing code seems to trust the query param.
            // Let's assume the frontend sends the correct string.
            filter.status = status;
        }
        const txns = await Transaction.find(filter).populate('bookId', 'title author').populate('studentId', 'name email').sort({ issuedAt: -1 });
        res.status(200).json({ status: 'success', results: txns.length, data: txns });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// TRIGGER REMINDERS (Alias: compute-overdues)
router.post(['/trigger-reminders', '/compute-overdues'], ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { checkOverdueBooks } = require('../utils/scheduler');
        await checkOverdueBooks();
        await logLibraryAction('OVERDUE', { adminId: req.user ? req.user._id : undefined, metadata: { info: "Manual Overdue Calculation Triggered" }, req });
        res.status(200).json({ status: 'success', message: 'Overdue computation and reminders triggered.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DEBUG SAMPLE (Protected by ENV)
router.get('/debug-sample', ensureLibraryRole(['ADMIN']), async (req, res) => {
    if (process.env.LIB_ALLOW_DEBUG !== 'true') {
        return res.status(403).json({ status: 'fail', message: 'Debug mode disabled' });
    }
    try {
        // Return small sample without modifying DB
        const sampleBooks = await Book.find().limit(5);
        const sampleStudents = await Student.find().limit(5);
        res.status(200).json({
            status: 'success',
            data: {
                books: sampleBooks,
                students: sampleStudents,
                info: "Non-destructive sample fetch"
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// AUDIT LOG VIEWER
router.get('/audit-logs', ensureLibraryRole(['ADMIN', 'AUDITOR']), async (req, res) => {
    try {
        const { page = 1, limit = 20, action, start, end } = req.query;
        let query = {};

        if (action) query.action = action;
        if (start || end) {
            query.timestamp = {};
            if (start) query.timestamp.$gte = new Date(start);
            if (end) {
                const endDate = new Date(end);
                // Fix: Set to END of the day to capture all records for that date
                endDate.setHours(23, 59, 59, 999);
                query.timestamp.$lte = endDate;
            }
        }

        const logs = await LibraryAuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('bookId', 'title')
            .populate('studentId', 'name email')
            .populate('adminId', 'name'); // Assuming admin/user model has 'name'

        const total = await LibraryAuditLog.countDocuments(query);

        // Transform for frontend - LAYER 11: DBMS Integrity Validation
        const items = logs.map(log => {
            const logObj = log.toObject();

            // Validate populated references - log errors for orphans
            if (!log.bookId && log.action !== 'OVERDUE' && log.action !== 'EMAIL_SENT') {
                console.error(`DBMS INTEGRITY ERROR: AuditLog ${log._id} has invalid bookId reference`);
            }
            if (!log.studentId && log.action !== 'ADD' && log.action !== 'DELETE' && log.action !== 'UPDATE') {
                console.error(`DBMS INTEGRITY ERROR: AuditLog ${log._id} has invalid studentId reference`);
            }

            return {
                ...logObj,
                bookId: log.bookId ? log.bookId._id : null,
                studentId: log.studentId ? log.studentId._id : null,
                adminId: log.adminId ? log.adminId._id : null,
                // Use N/A only for legitimate system actions, not for orphans
                bookTitle: log.bookId ? log.bookId.title : 'N/A',
                studentName: log.studentId ? log.studentId.name : 'N/A',
                adminName: log.adminId ? log.adminId.name : 'System'
            };
        });

        res.status(200).json({
            status: 'success',
            data: { items, total }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- DEBUG / SEED ROUTES (Dev Only) ---

router.post('/debug/seed-overdue', async (req, res) => {
    try {
        const book = await Book.findOne();
        const student = await Student.findOne();
        if (!book || !student) return res.status(400).json({ status: 'fail', message: 'Need 1 book and 1 student to seed.' });

        // Overdue by 5 days
        const issueDate = new Date();
        issueDate.setDate(issueDate.getDate() - 20); // Issued 20 days ago
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - 5); // Due 5 days ago

        await Transaction.create({
            bookId: book._id,
            studentId: student._id,
            issuedAt: issueDate,
            dueDate: dueDate,
            status: 'BORROWED'
        });

        // Also log it
        await logLibraryAction('OVERDUE', { bookId: book._id, studentId: student._id, metadata: { info: "Manual Debug Seed" } });

        res.json({ status: 'success', message: 'Seeded Overdue Transaction' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/debug/seed-logs', async (req, res) => {
    try {
        const book = await Book.findOne();
        const student = await Student.findOne();
        const userId = req.user ? req.user._id : (await Student.findOne())._id; // Fallback

        // Create 3 logs for today
        await logLibraryAction('BORROW', { bookId: book?._id, studentId: student?._id, adminId: userId, metadata: { title: "Debug Book" } });
        await logLibraryAction('RETURN', { bookId: book?._id, studentId: student?._id, adminId: userId, metadata: { fine: 5 } });
        await logLibraryAction('EMAIL_SENT', { studentId: student?._id, metadata: { subject: "Overdue Notice" } });

        res.json({ status: 'success', message: 'Seeded Audit Logs' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
