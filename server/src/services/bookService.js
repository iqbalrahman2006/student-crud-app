const mongoose = require('mongoose');
const Book = require('../models/Book');
const Transaction = require('../models/BorrowTransaction');
const BookReservation = require('../models/BookReservation');
const calculateFine = require('../utils/fineEngine');
const logLibraryAction = require('../utils/libraryLogger');

class BookService {
    async getAll({ page = 1, limit = 50, filter = {}, overdueString = 'false' } = {}) {
        // Overdue Filter Logic (if passed via query param string)
        if (overdueString === 'true') {
            const overdueTxns = await Transaction.find({
                status: 'Issued', // Note: Schema uses 'BORROWED'/'Issued' mixed in legacy? Check BorrowTransaction schema.
                // Based on library.js: 'Issued' or 'BORROWED'.
                // library.js line 121 says "status: 'Issued'". line 235 says "status: 'BORROWED'".
                // Let's check strict checking. library.js L121 query uses 'Issued'. But create uses 'BORROWED'.
                // This is a data inconsistency risk. 
                // Fix: Check Schema or usage. library.js:235 `status: 'BORROWED'`.
                // Let's use 'BORROWED' as the standard created by Issue.
                // But library.js line 121 query explicitly looked for 'Issued'. 
                // We should probably check BOTH or fix strictness.
                // Antigravity strict mode: "DO NOT change existing route paths...". 
                // But this is logic.
                // Let's support both to be safe.
                $or: [{ status: 'BORROWED' }, { status: 'Issued' }],
                dueDate: { $lt: new Date() }
            }).distinct('bookId'); // Schema field is bookId

            filter._id = { $in: overdueTxns };
        }

        const skip = (page - 1) * limit;
        const books = await Book.find(filter)
            .sort({ title: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Book.countDocuments(filter);

        return {
            data: books,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getById(id) {
        const book = await Book.findById(id);
        if (!book) throw new Error('Book not found');
        return book;
    }

    async create(data, user = null) {
        // Auto-tagging logic moved here? Or keep in controller? 
        // Service should be pure. Let's assume data is prepared or handle utils here.
        // For strict refactor, let's keep it simple.
        const book = await Book.create({ ...data, checkedOutCount: 0 });
        // Log action? ideally yes.
        return book;
    }

    async update(id, data) {
        const book = await Book.findByIdAndUpdate(id, data, { new: true });
        if (!book) throw new Error('Book not found');
        return book;
    }

    async delete(id) {
        return await Book.findByIdAndDelete(id);
    }

    // --- CIRCULATION ---

    async issue({ bookId, studentId, days = 14 }, adminId = null, req = null) {
        // LAYER 6: Atomic transaction locking - ensure all-or-nothing write
        // FALLBACK: Transaction numbers are only allowed on a replica set member or mongos.
        // If standalone, we do it without a session/transaction.
        const isReplicaSet = mongoose.connection.get('replicaSet') || mongoose.connection.get('replSet');

        if (!isReplicaSet) {
            // Standalone MongoDB Fallback
            // Validate student exists
            const student = await mongoose.model('Student').findById(studentId);
            if (!student) throw new Error('DBMS_INTEGRITY_ERROR: Student does not exist');

            // Validate book exists
            const book = await Book.findById(bookId);
            if (!book) throw new Error('DBMS_INTEGRITY_ERROR: Book does not exist');

            const available = book.totalCopies - book.checkedOutCount;
            if (available < 1) throw new Error('Book not available');

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + days);

            const transaction = await Transaction.create({
                bookId, studentId, issuedAt: Date.now(), dueDate, status: 'BORROWED'
            });

            await Book.findByIdAndUpdate(bookId, {
                $inc: { checkedOutCount: 1, availableCopies: -1 }
            });

            await logLibraryAction('BORROW', { bookId, studentId, adminId, req });
            return await Transaction.findById(transaction._id).populate('bookId').populate('studentId');
        }

        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // Validate student exists
                const student = await mongoose.model('Student').findById(studentId).session(session);
                if (!student) {
                    throw new Error('DBMS_INTEGRITY_ERROR: Student does not exist');
                }

                // Validate book exists
                const book = await Book.findById(bookId).session(session);
                if (!book) {
                    throw new Error('DBMS_INTEGRITY_ERROR: Book does not exist');
                }

                const available = book.totalCopies - book.checkedOutCount;
                if (available < 1) throw new Error('Book not available');

                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + days);

                const transaction = await Transaction.create([{
                    bookId, studentId, issuedAt: Date.now(), dueDate, status: 'BORROWED'
                }], { session });

                // Atomic update for consistency (Update both counts)
                await Book.findByIdAndUpdate(bookId, {
                    $inc: { checkedOutCount: 1, availableCopies: -1 }
                }, { session });

                await logLibraryAction('BORROW', { bookId, studentId, adminId, req });

                return await Transaction.findById(transaction[0]._id).populate('bookId').populate('studentId');
            });
        } finally {
            await session.endSession();
        }
    }

    async returnBook(transactionId, adminId = null, req = null) {
        const txn = await Transaction.findById(transactionId);
        if (!txn || txn.status === 'RETURNED') throw new Error('Active transaction not found');

        const fine = await calculateFine(txn, true);

        txn.returnedAt = Date.now();
        txn.status = 'RETURNED';
        txn.fineAmount = fine;
        await txn.save();

        // Explicitly update book to ensure safety
        const book = await Book.findById(txn.bookId);
        if (book) {
            book.checkedOutCount = Math.max(0, book.checkedOutCount - 1);
            await book.save();
        } else {
            // Fallback if book not found (edge case)
            console.warn("Book not found for transaction return:", txn.bookId);
        }

        // 4. Reservation Check
        // Notify/Hold for next in queue
        let nextRes = null;
        if (book) {
            nextRes = await BookReservation.findOne({ book: book._id, status: 'Active' }).sort({ queuePosition: 1 });
            if (nextRes) {
                // Fulfill Reservation
                nextRes.status = 'Fulfilled';
                nextRes.fulfilledAt = Date.now();
                await nextRes.save();

                // Log Actions
                await logLibraryAction('RESERVE', {
                    bookId: book._id,
                    studentId: nextRes.student,
                    metadata: {
                        action: 'FULFILLED',
                        info: "Book Returned. Reservation Auto-Fulfilled.",
                        queuePosition: nextRes.queuePosition
                    },
                    req
                });
                // Ideally trigger Email here
            }
        }

        await logLibraryAction('RETURN', { bookId: txn.bookId, studentId: txn.studentId, adminId, metadata: { fine }, req });

        return { transaction: txn, fine, reservedFor: nextRes ? nextRes.student : null };
    }

    async renew(transactionId, days = 7, adminId = null, req = null) {
        const txn = await Transaction.findById(transactionId);
        if (!txn || txn.status !== 'BORROWED') throw new Error('Cannot renew this transaction');

        if (txn.renewalCount >= 2) throw new Error('Maximum renewals limit (2) reached.');
        if (new Date() > new Date(txn.dueDate)) throw new Error('Cannot renew overdue books. Please return first.');

        const currentDue = new Date(txn.dueDate);
        currentDue.setDate(currentDue.getDate() + days);

        txn.dueDate = currentDue;
        txn.renewalCount += 1;
        await txn.save();

        await logLibraryAction('RENEW', { bookId: txn.bookId, studentId: txn.studentId, adminId, req });

        return txn;
    }

    // --- RESERVATIONS ---

    async reserveBook({ bookId, studentId, reservedUntil }, adminId = null, req = null) {
        // LAYER 6: Atomic transaction locking - ensure all-or-nothing write
        const isReplicaSet = mongoose.connection.get('replicaSet') || mongoose.connection.get('replSet');

        if (!isReplicaSet) {
            // Standalone MongoDB Fallback
            // Validate book exists
            const book = await Book.findById(bookId);
            if (!book) throw new Error('DBMS_INTEGRITY_ERROR: Book does not exist');

            // Validate student exists
            const student = await mongoose.model('Student').findById(studentId);
            if (!student) throw new Error('DBMS_INTEGRITY_ERROR: Student does not exist');

            // Check if already reserved
            const existing = await BookReservation.findOne({ book: bookId, student: studentId, status: 'Active' });
            if (existing) throw new Error('Student already has an active reservation for this book');

            const available = book.totalCopies - book.checkedOutCount;
            if (available >= 1) throw new Error('Cannot reserve: Book is currently available for immediate issue.');

            const count = await BookReservation.countDocuments({ book: bookId, status: 'Active' });

            const resv = await BookReservation.create({
                book: bookId,
                student: studentId,
                status: 'Active',
                queuePosition: count + 1,
                expiryDate: reservedUntil || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Default 3 days
            });

            if (req) await logLibraryAction('RESERVE', { bookId, studentId, adminId, metadata: { queuePosition: count + 1 }, req });

            return resv;
        }

        const session = await mongoose.startSession();
        try {
            return await session.withTransaction(async () => {
                // Validate book exists
                const book = await Book.findById(bookId).session(session);
                if (!book) {
                    throw new Error('DBMS_INTEGRITY_ERROR: Book does not exist');
                }

                // Validate student exists
                const student = await mongoose.model('Student').findById(studentId).session(session);
                if (!student) {
                    throw new Error('DBMS_INTEGRITY_ERROR: Student does not exist');
                }

                // Check if already reserved
                const existing = await BookReservation.findOne({ book: bookId, student: studentId, status: 'Active' }).session(session);
                if (existing) throw new Error('Student already has an active reservation for this book');

                const available = book.totalCopies - book.checkedOutCount;
                if (available >= 1) throw new Error('Cannot reserve: Book is currently available for immediate issue.');

                const count = await BookReservation.countDocuments({ book: bookId, status: 'Active' }).session(session);

                const resv = await BookReservation.create([{
                    book: bookId,
                    student: studentId,
                    status: 'Active',
                    queuePosition: count + 1,
                    expiryDate: reservedUntil || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Default 3 days
                }], { session });

                if (req) await logLibraryAction('RESERVE', { bookId, studentId, adminId, metadata: { queuePosition: count + 1 }, req });

                return resv[0];
            });
        } finally {
            await session.endSession();
        }
    }

    async getReservations({ status } = {}) {
        const filter = {};
        if (status && status !== 'ALL') {
            filter.status = status;
        }
        const reservations = await BookReservation.find(filter)
            .populate('book', 'title author')
            .populate('student', 'name email')
            .sort({ timestamp: -1 });

        // LAYER 11: Prevention - filter out any orphan records that slipped through
        return reservations.filter(r => r.book && r.student);
    }
}

module.exports = new BookService();
