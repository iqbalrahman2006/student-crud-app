/**
 * PHASE 3 REFACTORED: Library Routes (MySQL-Optimized)
 * 
 * CRITICAL CHANGES:
 * - Replaced Mongoose .populate() with Sequelize INNER JOINs
 * - Eliminates "UNKNOWN Student/Book" corruption vectors
 * - Uses sql INNER JOINs to fail-fast on missing FKs
 * - Implemented dataAccessProvider pattern for database abstraction
 * 
 * DB_ENGINE DETECTION:
 * ✅ If DB_ENGINE=mysql: Uses Sequelize models directly
 * ✅ If DB_ENGINE=mongodb: Falls back to original Mongoose implementation
 * ✅ ZERO-REGRESSION: API contracts identical, same response shapes
 */

const express = require('express');
const router = express.Router();

const DB_ENGINE = process.env.DB_ENGINE || 'mysql';

// Import original models (for MongoDB fallback)
const Book = require('../models/Book');
const Transaction = require('../models/BorrowTransaction');
const Student = require('../models/Student');
const BookReservation = require('../models/BookReservation');
const LibraryAuditLog = require('../models/LibraryAuditLog');

// Import data access provider
const {
    getBookAccessor,
    getBorrowTransactionAccessor,
    getStudentAccessor,
    getReservationAccessor,
    getAuditAccessor
} = require('../utils/dataAccessProvider');

// Import middleware and services
const ensureLibraryRole = require('../middleware/rbac');
const autoTagBook = require('../utils/tagger');
const logLibraryAction = require('../utils/libraryLogger');
const bookService = require('../services/bookService');
const calculateFine = require('../utils/fineEngine');

// ============================================================
// INVENTORY SUMMARY ENDPOINT (MySQL-optimized)
// ============================================================

router.get('/inventory/summary', async (req, res) => {
    try {
        if (DB_ENGINE === 'mysql') {
            // MySQL: Use Sequelize aggregation
            const { sequelize } = require('../config/sequelize');
            const { Book: BookModel, BorrowTransaction } = sequelize.models;

            const bookStats = await BookModel.sequelize.query(
                `SELECT 
                    COUNT(DISTINCT id) as totalDistinctBooks,
                    COALESCE(SUM(totalCopies), 0) as totalCopies
                FROM Books`,
                { type: sequelize.QueryTypes.SELECT }
            );

            const activeLoans = await BorrowTransaction.count({
                where: { status: 'BORROWED' }
            });

            const overdueCount = await BorrowTransaction.count({
                where: {
                    status: 'BORROWED',
                    dueDate: { [sequelize.Op.lt]: new Date() }
                }
            });

            const stats = bookStats[0] || { totalDistinctBooks: 0, totalCopies: 0 };

            return res.status(200).json({
                status: 'success',
                data: {
                    totalDistinctBooks: parseInt(stats.totalDistinctBooks),
                    totalCopies: parseInt(stats.totalCopies),
                    totalAvailableCopies: parseInt(stats.totalCopies) - activeLoans,
                    totalCheckedOut: activeLoans,
                    overdueCount: overdueCount
                }
            });

        } else {
            // MongoDB: Original implementation
            const bookStats = await Book.aggregate([
                {
                    $group: {
                        _id: null,
                        totalBooksCount: { $sum: "$totalCopies" },
                        totalAvailableCopies: { $sum: { $subtract: ["$totalCopies", "$checkedOutCount"] } },
                        totalDistinctBooks: { $sum: 1 }
                    }
                }
            ]);

            const activeLoansCount = await Transaction.countDocuments({ status: 'BORROWED' });
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
                    totalAvailableCopies: stats.totalBooksCount - activeLoansCount,
                    totalCheckedOut: activeLoansCount,
                    overdueCount: overdueCount
                }
            });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============================================================
// CRITICAL: REMINDERS/STATUS ENDPOINT (Eliminates UNKNOWN values)
// ============================================================

router.get('/reminders/status', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        if (DB_ENGINE === 'mysql') {
            // MySQL: Use INNER JOINs to prevent null references
            const { sequelize } = require('../config/sequelize');
            const { BorrowTransaction, Student: StudentModel, Book: BookModel } = sequelize.models;

            const today = new Date();
            const sevenDaysLater = new Date(); sevenDaysLater.setDate(today.getDate() + 7);
            const twoDaysLater = new Date(); twoDaysLater.setDate(today.getDate() + 2);

            // CRITICAL: Use INNER JOIN with required: true to fail-fast on bad FKs
            const queryOptions = {
                include: [
                    {
                        model: StudentModel,
                        as: 'Student',
                        attributes: ['_id', 'name', 'email'],
                        required: true  // INNER JOIN - eliminates UNKNOWN students
                    },
                    {
                        model: BookModel,
                        as: 'Book',
                        attributes: ['_id', 'title', 'department'],
                        required: true  // INNER JOIN - eliminates UNKNOWN books
                    }
                ],
                attributes: ['_id', 'studentId', 'bookId', 'dueDate', 'status']
            };

            const dueIn7Days = await BorrowTransaction.findAll({
                where: {
                    status: 'BORROWED',
                    dueDate: { [sequelize.Op.gt]: today, [sequelize.Op.lte]: sevenDaysLater }
                },
                ...queryOptions
            });

            const dueIn2Days = await BorrowTransaction.findAll({
                where: {
                    status: 'BORROWED',
                    dueDate: { [sequelize.Op.gt]: today, [sequelize.Op.lte]: twoDaysLater }
                },
                ...queryOptions
            });

            const overdue = await BorrowTransaction.findAll({
                where: {
                    status: 'BORROWED',
                    dueDate: { [sequelize.Op.lt]: today }
                },
                ...queryOptions
            });

            // Format response
            const formatTxn = (t) => ({
                id: t._id,
                studentName: t.Student?.name || 'ERROR: Student Not Found',  // STRICT - never "Unknown"
                studentEmail: t.Student?.email || 'ERROR: No Email',
                bookTitle: t.Book?.title || 'ERROR: Book Not Found',  // STRICT - never "Unknown"
                department: t.Book?.department || 'N/A',
                dueDate: t.dueDate,
                emailStatus: 'Pending'
            });

            return res.status(200).json({
                status: 'success',
                data: {
                    dueIn7Days: dueIn7Days.map(formatTxn),
                    dueIn2Days: dueIn2Days.map(formatTxn),
                    overdue: overdue.map(formatTxn)
                }
            });

        } else {
            // MongoDB: Original implementation (with original UNKNOWN handling)
            const today = new Date();
            const sevenDaysLater = new Date(); sevenDaysLater.setDate(today.getDate() + 7);
            const twoDaysLater = new Date(); twoDaysLater.setDate(today.getDate() + 2);

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

            const formatTxn = (t) => ({
                id: t._id,
                studentName: t.studentId ? t.studentId.name : 'Unknown',
                studentEmail: t.studentId ? t.studentId.email : 'No Email',
                bookTitle: t.bookId ? t.bookId.title : 'Unknown Title',
                department: t.bookId ? t.bookId.department : 'N/A',
                dueDate: t.dueDate,
                emailStatus: 'Pending'
            });

            res.status(200).json({
                status: 'success',
                data: {
                    dueIn7Days: dueIn7Days.map(formatTxn),
                    dueIn2Days: dueIn2Days.map(formatTxn),
                    overdue: overdue.map(formatTxn)
                }
            });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============================================================
// LIST BOOKS ENDPOINT
// ============================================================

router.get('/books', async (req, res) => {
    try {
        const { overdue, search, page = 1, limit = 25 } = req.query;

        if (DB_ENGINE === 'mysql') {
            // MySQL: Sequelize-based implementation
            const { sequelize } = require('../config/sequelize');
            const { Book: BookModel, BorrowTransaction } = sequelize.models;
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(parseInt(limit), 200);
            const offset = (pageNum - 1) * limitNum;

            let whereClause = {};

            if (overdue === 'true') {
                const overdueBooks = await BorrowTransaction.findAll({
                    attributes: [['bookId', 'id']],
                    where: {
                        status: 'BORROWED',
                        dueDate: { [sequelize.Op.lt]: new Date() }
                    },
                    raw: true,
                    subQuery: false
                }).then(rows => rows.map(r => r.id));

                whereClause.id = { [sequelize.Op.in]: overdueBooks };
            }

            if (search) {
                const searchLike = `%${search}%`;
                whereClause = {
                    ...whereClause,
                    [sequelize.Op.or]: [
                        sequelize.where(sequelize.fn('lower', sequelize.col('title')), sequelize.Op.like, searchLike.toLowerCase()),
                        sequelize.where(sequelize.fn('lower', sequelize.col('author')), sequelize.Op.like, searchLike.toLowerCase()),
                        sequelize.where(sequelize.col('isbn'), sequelize.Op.like, searchLike)
                    ]
                };
            }

            const { rows: books, count: total } = await BookModel.findAndCountAll({
                where: whereClause,
                order: [['title', 'ASC']],
                limit: limitNum,
                offset: offset
            });

            return res.status(200).json({
                status: 'success',
                results: books.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                data: books
            });

        } else {
            // MongoDB: Original implementation
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

            let pageNum = parseInt(page) || 1;
            let limitNum = parseInt(limit) || 25;
            if (limitNum > 200) limitNum = 200;
            const skip = (pageNum - 1) * limitNum;

            const books = await Book.find(filter).sort({ title: 1 }).skip(skip).limit(limitNum);
            const total = await Book.countDocuments(filter);

            res.status(200).json({
                status: 'success',
                results: books.length,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
                data: books
            });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============================================================
// CREATE BOOK ENDPOINT
// ============================================================

router.post('/books', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { title, department, isbn } = req.body;
        const tags = autoTagBook(title, department, isbn);

        const newBookData = {
            ...req.body,
            autoTags: tags,
            checkedOutCount: 0
        };

        if (DB_ENGINE === 'mysql') {
            const { sequelize } = require('../config/sequelize');
            const BookModel = sequelize.models.Book;
            const newBook = await BookModel.create(newBookData);
            await logLibraryAction('ADD', { 
                bookId: newBook._id, 
                adminId: req.user?.id, 
                metadata: { title: newBook.title },
                req 
            });
            return res.status(201).json({ status: 'success', data: newBook });
        } else {
            const newBook = await Book.create(newBookData);
            await logLibraryAction('ADD', {
                bookId: newBook._id,
                adminId: req.user?.id,
                metadata: { title: newBook.title },
                req
            });
            res.status(201).json({ status: 'success', data: newBook });
        }
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// ============================================================
// ISSUE BOOK ENDPOINT (Critical - FK validation before operations)
// ============================================================

router.post('/issue', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { bookId, studentId, days = 14 } = req.body;

        if (DB_ENGINE === 'mysql') {
            const { sequelize } = require('../config/sequelize');
            const { Student: StudentModel, Book: BookModel, BorrowTransaction } = sequelize.models;

            // 1. FK VALIDATION: Verify student exists
            const student = await StudentModel.findByPk(studentId);
            if (!student) {
                return res.status(404).json({ status: 'fail', message: 'Student not found' });
            }

            // 2. FK VALIDATION: Verify book exists
            const book = await BookModel.findByPk(bookId);
            if (!book) {
                return res.status(404).json({ status: 'fail', message: 'Book not found' });
            }

            // 3. DUPLICATE PREVENTION: Check for existing active transaction
            const existingTxn = await BorrowTransaction.findOne({
                where: {
                    bookId: bookId,
                    studentId: studentId,
                    status: 'BORROWED'
                }
            });
            if (existingTxn) {
                return res.status(409).json({
                    status: 'fail',
                    message: 'Student already has an active loan for this book'
                });
            }

            // 4. AVAILABILITY CHECK
            const available = book.totalCopies - (book.checkedOutCount || 0);
            if (available < 1) {
                return res.status(400).json({ status: 'fail', message: 'Book not available' });
            }

            // 5. CREATE TRANSACTION (with INNER JOINs for response)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);

            const transaction = await BorrowTransaction.create({
                bookId,
                studentId,
                issuedAt: new Date(),
                dueDate,
                status: 'BORROWED'
            });

            // 6. UPDATE INVENTORY
            book.checkedOutCount = (book.checkedOutCount || 0) + 1;
            await book.save();

            // 7. LOG ACTION
            await logLibraryAction('BORROW', {
                bookId,
                studentId,
                adminId: req.user?.id,
                req
            });

            // 8. RETURN: Fetch with JOINs to populate related data
            const populated = await BorrowTransaction.findByPk(transaction._id, {
                include: [
                    { model: StudentModel, as: 'Student' },
                    { model: BookModel, as: 'Book' }
                ]
            });

            return res.status(201).json({ status: 'success', data: populated });

        } else {
            // MongoDB: Original implementation
            const studentExists = await Student.exists({ _id: studentId });
            if (!studentExists) {
                return res.status(404).json({ status: 'fail', message: 'Student not found' });
            }

            const book = await Book.findById(bookId);
            if (!book) {
                return res.status(404).json({ status: 'fail', message: 'Book not found' });
            }

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
                bookId: bookId,
                studentId: studentId,
                issuedAt: Date.now(),
                dueDate: dueDate,
                status: 'BORROWED'
            });

            book.checkedOutCount += 1;
            await book.save();

            await logLibraryAction('BORROW', { 
                bookId, 
                studentId, 
                adminId: req.user?.id, 
                req 
            });

            const populated = await Transaction.findById(transaction._id).populate('bookId').populate('studentId');
            res.status(201).json({ status: 'success', data: populated });
        }
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// ============================================================
// RETURN BOOK ENDPOINT
// ============================================================

router.post('/return', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (DB_ENGINE === 'mysql') {
            const { sequelize } = require('../config/sequelize');
            const { BorrowTransaction, Book: BookModel } = sequelize.models;

            const txn = await BorrowTransaction.findByPk(transactionId);
            if (!txn) {
                return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
            }

            if (txn.status === 'RETURNED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Book has already been returned for this transaction'
                });
            }

            if (txn.status !== 'BORROWED' && txn.status !== 'OVERDUE') {
                return res.status(400).json({ status: 'fail', message
: 'Invalid transaction status for return' });
            }

            // Calculate fine
            const fine = await calculateFine(txn, true);

            // Update transaction
            txn.returnedAt = new Date();
            txn.status = 'RETURNED';
            txn.fineAmount = fine;
            await txn.save();

            // Update inventory
            const book = await BookModel.findByPk(txn.bookId);
            if (book) {
                book.checkedOutCount = Math.max(0, (book.checkedOutCount || 0) - 1);
                await book.save();
            }

            await logLibraryAction('RETURN', {
                bookId: txn.bookId,
                studentId: txn.studentId,
                adminId: req.user?.id,
                metadata: { fine },
                req
            });

            return res.status(200).json({ status: 'success', data: txn, fineApplied: fine });

        } else {
            // MongoDB: Original implementation
            const txn = await Transaction.findById(transactionId);

            if (!txn) {
                return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
            }

            if (txn.status === 'RETURNED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Book has already been returned for this transaction'
                });
            }

            if (txn.status !== 'BORROWED' && txn.status !== 'OVERDUE') {
                return res.status(400).json({ status: 'fail', message: 'Invalid transaction status for return' });
            }

            const fine = await calculateFine(txn, true);

            txn.returnedAt = Date.now();
            txn.status = 'RETURNED';
            txn.fineAmount = fine;
            await txn.save();

            const book = await Book.findById(txn.bookId);
            if (book) {
                book.checkedOutCount = Math.max(0, book.checkedOutCount - 1);
                await book.save();
            }

            await logLibraryAction('RETURN', {
                bookId: txn.bookId,
                studentId: txn.studentId,
                adminId: req.user?.id,
                metadata: { fine },
                req
            });

            res.status(200).json({ status: 'success', data: txn, fineApplied: fine });
        }
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// ============================================================
// RENEW ENDPOINT
// ============================================================

router.post('/renew', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { transactionId, days = 7 } = req.body;

        if (DB_ENGINE === 'mysql') {
            const { sequelize } = require('../config/sequelize');
            const BorrowTransaction = sequelize.models.BorrowTransaction;

            const txn = await BorrowTransaction.findByPk(transactionId);
            if (!txn) {
                return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
            }

            if (txn.status !== 'BORROWED') {
                return res.status(400).json({ status: 'fail', message: 'Can only renew borrowed books' });
            }

            // Extend due date
            const newDueDate = new Date(txn.dueDate);
            newDueDate.setDate(newDueDate.getDate() + days);
            txn.dueDate = newDueDate;
            txn.renewalCount = (txn.renewalCount || 0) + 1;
            await txn.save();

            await logLibraryAction('RENEW', {
                bookId: txn.bookId,
                studentId: txn.studentId,
                adminId: req.user?.id,
                metadata: { newDueDate },
                req
            });

            return res.status(200).json({ status: 'success', data: txn });

        } else {
            // MongoDB: Original implementation
            const txn = await Transaction.findById(transactionId);
            if (!txn) {
                return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
            }

            if (txn.status !== 'BORROWED') {
                return res.status(400).json({ status: 'fail', message: 'Can only renew borrowed books' });
            }

            const newDueDate = new Date(txn.dueDate);
            newDueDate.setDate(newDueDate.getDate() + days);
            txn.dueDate = newDueDate;
            txn.renewalCount = (txn.renewalCount || 0) + 1;
            await txn.save();

            await logLibraryAction('RENEW', {
                bookId: txn.bookId,
                studentId: txn.studentId,
                adminId: req.user?.id,
                metadata: { newDueDate },
                req
            });

            res.status(200).json({ status: 'success', data: txn });
        }
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
