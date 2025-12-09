const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student');
const LibraryFineLedger = require('../models/LibraryFineLedger');
const BookReservation = require('../models/BookReservation');
const LibraryAuditLog = require('../models/LibraryAuditLog');

const ensureLibraryRole = require('../middleware/rbac');
const calculateFine = require('../utils/fineEngine');
const autoTagBook = require('../utils/tagger');
const logLibraryAction = require('../utils/libraryLogger'); // Replacing old auditLogger

// --- BOOK ROUTES ---

// GET All Books (Supports ?overdue=true)
router.get('/books', async (req, res) => {
    try {
        const { overdue } = req.query;
        let filter = {};

        if (overdue === 'true') {
            // This requires checking Transactions, not just Books directly if we want "Overdue Books" which are usually active loans
            // BUT the requirement says: "return only overdue loans/books (not returned, dueDate < now)"
            // This logic usually belongs in /transactions?filter=overdue or needs a join here.
            // However requirement says "GET /api/library/books... return only overdue loans/books".
            // This implies we might return BOOK objects that are currently overdue.
            // Let's implement logic: Find overdue transactions -> get book IDs -> find Books.

            const overdueTxns = await Transaction.find({
                status: 'Issued',
                dueDate: { $lt: new Date() }
            }).distinct('book');

            filter = { _id: { $in: overdueTxns } };
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
router.post('/books', ensureLibraryRole(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        // Auto Tagging
        const { title, department, isbn } = req.body;
        const tags = autoTagBook(title, department, isbn);

        const newBook = await Book.create({ ...req.body, autoTags: tags });

        await logLibraryAction('ADD', { bookId: newBook._id, adminId: req.user ? req.user._id : undefined, metadata: { title: newBook.title }, req });

        res.status(201).json({ status: 'success', data: newBook });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// UPDATE Book (RBAC: Admin/Librarian)
router.patch('/books/:id', ensureLibraryRole(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!book) return res.status(404).json({ status: 'fail', message: 'Book not found' });

        await logLibraryAction('UPDATE', { bookId: book._id, adminId: req.user ? req.user._id : undefined, metadata: req.body, req });

        res.status(200).json({ status: 'success', data: book });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// DELETE Book (RBAC: Admin)
router.delete('/books/:id', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const book = await Book.findByIdAndDelete(req.params.id);
        if (book) await logLibraryAction('DELETE', { bookId: book._id, adminId: req.user ? req.user._id : undefined, req });
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- TRANSACTION ROUTES ---

// ISSUE Book
router.post('/issue', ensureLibraryRole(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        const { bookId, studentId, days = 14 } = req.body;

        const book = await Book.findById(bookId);
        if (!book || book.availableCopies < 1) {
            return res.status(400).json({ status: 'fail', message: 'Book not available' });
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        const transaction = await Transaction.create({
            book: bookId,
            student: studentId,
            issueDate: Date.now(),
            dueDate: dueDate,
            status: 'Issued'
        });

        book.availableCopies -= 1;
        await book.save();

        await book.save();

        await logLibraryAction('BORROW', { bookId, studentId, adminId: req.user ? req.user._id : undefined, req });

        const populated = await Transaction.findById(transaction._id).populate('book').populate('student');
        res.status(201).json({ status: 'success', data: populated });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// RETURN Book (With Fine Engine)
router.post('/return', ensureLibraryRole(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        const { transactionId } = req.body;
        const txn = await Transaction.findById(transactionId);
        if (!txn || txn.status === 'Returned') {
            return res.status(404).json({ status: 'fail', message: 'Active transaction not found' });
        }

        // 1. Calculate Fine
        const fine = await calculateFine(txn, true); // true = finalize

        // 2. Update Txn
        txn.returnDate = Date.now();
        txn.status = 'Returned';
        txn.fine = fine;
        await txn.save();

        // 3. Update Inventory
        const book = await Book.findById(txn.book);
        if (book) {
            book.availableCopies += 1;
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

        await logLibraryAction('RETURN', { bookId: txn.book, studentId: txn.student, adminId: req.user ? req.user._id : undefined, metadata: { fine }, req });

        res.status(200).json({ status: 'success', data: txn, fineApplied: fine });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// RENEW Book
router.post('/renew', ensureLibraryRole(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        const { transactionId, days = 7 } = req.body;
        const txn = await Transaction.findById(transactionId);

        if (!txn || txn.status !== 'Issued') {
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

        await logLibraryAction('RENEW', { bookId: txn.book, studentId: txn.student, adminId: req.user ? req.user._id : undefined, req });

        res.status(200).json({ status: 'success', data: txn });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// --- ANALYTICS ENHANCED ---
router.get('/analytics', async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

        const borrowedToday = await Transaction.countDocuments({ status: 'Issued', issueDate: { $gte: startOfDay } });
        const overdueCount = await Transaction.countDocuments({ status: 'Issued', dueDate: { $lt: new Date() } });

        const popularBooks = await Transaction.aggregate([
            { $group: { _id: "$book", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'bookDetails' } },
            { $unwind: "$bookDetails" },
            { $project: { title: "$bookDetails.title", count: 1 } }
        ]);

        const deptDist = await Book.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);

        // New Metrics
        const fineRevenue = await LibraryFineLedger.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        const totalFine = fineRevenue.length > 0 ? fineRevenue[0].total : 0;

        const reservationQueue = await BookReservation.countDocuments({ status: 'Active' });

        res.status(200).json({
            status: 'success',
            data: {
                totalBooks,
                borrowedToday,
                overdueCount,
                popularBooks,
                deptDist,
                totalFine,
                reservationQueue
            }
        });

    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- STUDENT LIBRARY PROFILE ---
router.get('/profile/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        const activeLoans = await Transaction.find({ student: studentId, status: 'Issued' }).populate('book');
        const pastLoans = await Transaction.find({ student: studentId, status: 'Returned' }).sort({ returnDate: -1 }).limit(10).populate('book');
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
        const { bookId, studentId } = req.body;
        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        // Check if already reserved
        const existing = await BookReservation.findOne({ book: bookId, student: studentId, status: 'Active' });
        if (existing) return res.status(400).json({ message: 'Already reserved' });

        const count = await BookReservation.countDocuments({ book: bookId, status: 'Active' });

        const resv = await BookReservation.create({
            book: bookId,
            student: studentId,
            queuePosition: count + 1
        });

        await logLibraryAction('RESERVE', { bookId, studentId, metadata: { queuePosition: count + 1 } });
        res.status(201).json({ status: 'success', data: resv });
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        const filter = status ? { status } : {};
        const txns = await Transaction.find(filter).populate('book', 'title author').populate('student', 'name email').sort({ issueDate: -1 });
        res.status(200).json({ status: 'success', results: txns.length, data: txns });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// TRIGGER REMINDERS
router.post('/trigger-reminders', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { checkOverdueBooks } = require('../utils/scheduler');
        await checkOverdueBooks();
        res.status(200).json({ status: 'success', message: 'Reminders triggered successfully.' });
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
            if (end) query.timestamp.$lte = new Date(end);
        }

        const logs = await LibraryAuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('bookId', 'title')
            .populate('studentId', 'name email')
            .populate('adminId', 'name'); // Assuming admin/user model has 'name'

        const total = await LibraryAuditLog.countDocuments(query);

        // Transform for frontend
        const items = logs.map(log => ({
            ...log.toObject(),
            bookTitle: log.bookId ? log.bookId.title : 'N/A',
            studentName: log.studentId ? log.studentId.name : 'N/A',
            adminName: log.adminId ? log.adminId.name : 'System'
        }));

        res.status(200).json({
            status: 'success',
            data: { items, total }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
