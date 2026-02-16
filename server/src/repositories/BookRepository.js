/**
 * MIGRATION: BookRepository (DAL for Book model)
 * ========================================================
 * Handles book inventory logic: checkout, check-in, availability.
 * Enforces constraint: checkedOutCount <= totalCopies
 * ========================================================
 */

const BaseRepository = require('./BaseRepository');
const { Op } = require('sequelize');

class BookRepository extends BaseRepository {
    constructor(bookModel, sequelize) {
        super(bookModel, sequelize);
    }

    /**
     * Get all books with computed availability
     */
    async getAll({ page = 1, limit = 100, filter = {} } = {}) {
        try {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 100;
            const offset = (pageNum - 1) * limitNum;

            const where = {};
            if (filter.search) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${filter.search}%` } },
                    { author: { [Op.like]: `%${filter.search}%` } },
                    { isbn: { [Op.like]: `%${filter.search}%` } }
                ];
            }
            if (filter.status) where.status = filter.status;
            if (filter.department) where.department = filter.department;

            const { count, rows } = await this.model.findAndCountAll({
                where,
                limit: limitNum,
                offset,
                raw: true,
                order: [['createdAt', 'DESC']]
            });

            // Ensure availableCopies is computed (not stored)
            const enriched = rows.map(book => ({
                ...book,
                availableCopies: Math.max(0, book.totalCopies - book.checkedOutCount)
            }));

            return {
                data: enriched,
                meta: {
                    total: count,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(count / limitNum)
                }
            };
        } catch (err) {
            const error = new Error(`Database error in getAll: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Override findById to include computed availableCopies
     */
    async findById(id) {
        try {
            const record = await this.model.findByPk(id, { raw: true });
            if (!record) return null;

            return {
                ...record,
                availableCopies: Math.max(0, record.totalCopies - record.checkedOutCount)
            };
        } catch (err) {
            const error = new Error(`Database error in findById: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Book checkout: increment checkedOutCount (TRANSACTIONAL)
     * CRITICAL: Must verify availability first
     */
    async checkoutBook(bookId, count = 1) {
        const transaction = await this.sequelize.transaction();
        try {
            const book = await this.model.findByPk(bookId, { transaction });
            if (!book) {
                await transaction.rollback();
                const error = new Error('Book not found');
                error.statusCode = 404;
                throw error;
            }

            const availableCopies = Math.max(0, book.totalCopies - book.checkedOutCount);
            if (availableCopies < count) {
                await transaction.rollback();
                const error = new Error('Insufficient copies available');
                error.statusCode = 400;
                throw error;
            }

            book.checkedOutCount += count;
            if (book.checkedOutCount > book.totalCopies) {
                book.checkedOutCount = book.totalCopies;
            }
            book.status = book.checkedOutCount >= book.totalCopies ? 'Out of Stock' : 'Available';
            book.lastAvailabilityUpdatedAt = new Date();

            await book.save({ transaction });
            await transaction.commit();

            return book.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Book check-in: decrement checkedOutCount (TRANSACTIONAL)
     */
    async checkinBook(bookId, count = 1) {
        const transaction = await this.sequelize.transaction();
        try {
            const book = await this.model.findByPk(bookId, { transaction });
            if (!book) {
                await transaction.rollback();
                const error = new Error('Book not found');
                error.statusCode = 404;
                throw error;
            }

            book.checkedOutCount = Math.max(0, book.checkedOutCount - count);
            book.status = book.checkedOutCount >= book.totalCopies ? 'Out of Stock' : 'Available';
            book.lastAvailabilityUpdatedAt = new Date();

            await book.save({ transaction });
            await transaction.commit();

            return book.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }
}

module.exports = BookRepository;
