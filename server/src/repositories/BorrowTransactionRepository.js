/**
 * MIGRATION: BorrowTransactionRepository (DAL for BorrowTransaction model)
 * ========================================================
 * Handles core library workflows: borrow, return, renew.
 * All multi-step operations wrapped in explicit SQL transactions.
 * ========================================================
 */

const BaseRepository = require('./BaseRepository');
const { Op } = require('sequelize');

class BorrowTransactionRepository extends BaseRepository {
    constructor(borrowTransactionModel, studentModel, bookModel, auditLogModel, sequelize) {
        super(borrowTransactionModel, sequelize);
        this.studentModel = studentModel;
        this.bookModel = bookModel;
        this.auditLogModel = auditLogModel;
    }

    /**
     * Borrow a book (TRANSACTIONAL)
     * Step 1: Validate student exists
     * Step 2: Validate book availability
     * Step 3: Insert BorrowTransaction
     * Step 4: Update Book.checkedOutCount
     * Step 5: Insert AuditLog
     * ROLLBACK on any error
     */
    async createBorrow(studentId, bookId, dueDate, metadata = {}) {
        const transaction = await this.sequelize.transaction();
        try {
            // Step 1: Validate student
            const student = await this.studentModel.findByPk(studentId, { transaction });
            if (!student) {
                await transaction.rollback();
                const error = new Error('Student not found');
                error.statusCode = 404;
                throw error;
            }

            // Step 2: Validate book and availability
            const book = await this.bookModel.findByPk(bookId, { transaction });
            if (!book) {
                await transaction.rollback();
                const error = new Error('Book not found');
                error.statusCode = 404;
                throw error;
            }

            const availableCopies = Math.max(0, book.totalCopies - book.checkedOutCount);
            if (availableCopies <= 0) {
                await transaction.rollback();
                const error = new Error('Book not available (out of stock)');
                error.statusCode = 400;
                throw error;
            }

            // Step 3: Insert BorrowTransaction
            const borrowTxn = await this.model.create(
                {
                    _id: require('crypto').randomBytes(12).toString('hex'),
                    studentId,
                    bookId,
                    issuedAt: new Date(),
                    dueDate,
                    status: 'BORROWED',
                    fineAmount: 0,
                    renewalCount: 0,
                    studentName: student.name,
                    bookTitle: book.title
                },
                { transaction, validate: true }
            );

            // Step 4: Update Book inventory
            book.checkedOutCount += 1;
            book.status = book.checkedOutCount >= book.totalCopies ? 'Out of Stock' : 'Available';
            book.lastAvailabilityUpdatedAt = new Date();
            await book.save({ transaction });

            // Step 5: Insert AuditLog
            await this.auditLogModel.create(
                {
                    _id: require('crypto').randomBytes(12).toString('hex'),
                    action: 'BORROW',
                    studentId,
                    bookId,
                    timestamp: new Date(),
                    metadata: {
                        studentName: student.name,
                        bookTitle: book.title,
                        dueDate: dueDate.toISOString(),
                        ...metadata
                    }
                },
                { transaction }
            );

            await transaction.commit();
            return borrowTxn.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Return a book (TRANSACTIONAL)
     * Step 1: Validate transaction exists and status is BORROWED
     * Step 2: Update transaction status to RETURNED
     * Step 3: Update Book.checkedOutCount
     * Step 4: Insert AuditLog
     */
    async returnBook(transactionId, fineAmount = 0, metadata = {}) {
        const transaction = await this.sequelize.transaction();
        try {
            // Step 1: Validate transaction
            const borrowTxn = await this.model.findByPk(transactionId, { transaction });
            if (!borrowTxn) {
                await transaction.rollback();
                const error = new Error('BorrowTransaction not found');
                error.statusCode = 404;
                throw error;
            }

            if (borrowTxn.status !== 'BORROWED') {
                await transaction.rollback();
                const error = new Error(`Cannot return book with status: ${borrowTxn.status}`);
                error.statusCode = 400;
                throw error;
            }

            // Step 2: Update transaction
            borrowTxn.status = 'RETURNED';
            borrowTxn.returnedAt = new Date();
            borrowTxn.fineAmount = fineAmount;
            await borrowTxn.save({ transaction });

            // Step 3: Update Book inventory
            const book = await this.bookModel.findByPk(borrowTxn.bookId, { transaction });
            if (book) {
                book.checkedOutCount = Math.max(0, book.checkedOutCount - 1);
                book.status = book.checkedOutCount >= book.totalCopies ? 'Out of Stock' : 'Available';
                book.lastAvailabilityUpdatedAt = new Date();
                await book.save({ transaction });
            }

            // Step 4: Insert AuditLog
            await this.auditLogModel.create(
                {
                    _id: require('crypto').randomBytes(12).toString('hex'),
                    action: 'RETURN',
                    studentId: borrowTxn.studentId,
                    bookId: borrowTxn.bookId,
                    timestamp: new Date(),
                    metadata: {
                        transactionId,
                        fineAmount,
                        ...metadata
                    }
                },
                { transaction }
            );

            await transaction.commit();
            return borrowTxn.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Get active (BORROWED) transactions for a student
     */
    async getActiveBorrows(studentId) {
        try {
            return await this.model.findAll({
                where: { studentId, status: 'BORROWED' },
                raw: true,
                order: [['issuedAt', 'DESC']]
            });
        } catch (err) {
            const error = new Error(`Database error in getActiveBorrows: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Get overdue (status=OVERDUE or BORROWED with dueDate < now) transactions
     */
    async getOverdueTransactions() {
        try {
            return await this.model.findAll({
                where: {
                    [Op.or]: [
                        { status: 'OVERDUE' },
                        { status: 'BORROWED', dueDate: { [Op.lt]: new Date() } }
                    ]
                },
                raw: true,
                order: [['dueDate', 'ASC']]
            });
        } catch (err) {
            const error = new Error(`Database error in getOverdueTransactions: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }
}

module.exports = BorrowTransactionRepository;
