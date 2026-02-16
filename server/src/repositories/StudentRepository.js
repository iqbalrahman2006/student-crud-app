/**
 * MIGRATION: StudentRepository (DAL for Student model)
 * ========================================================
 * Mirrors Mongoose studentService API but uses Sequelize backend.
 * Aggregations (like borrowedBooksCount, hasOverdue) computed in repository.
 * ========================================================
 */

const BaseRepository = require('./BaseRepository');
const { Op } = require('sequelize');

class StudentRepository extends BaseRepository {
    constructor(studentModel, borrowTransactionModel, sequelize) {
        super(studentModel, sequelize);
        this.borrowTransactionModel = borrowTransactionModel;
    }

    /**
     * Get all students with aggregated data (borrowedBooksCount, hasOverdue, etc.)
     * Mirrors studentService.getAll() with similar response shape
     */
    async getAll({ page = 1, limit = 200, sort = { createdAt: -1 }, filter = {} } = {}) {
        try {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 200;
            const offset = (pageNum - 1) * limitNum;

            // Build WHERE clause for search and filters
            const where = {};
            if (filter.search) {
                where[Op.or] = [
                    { name: { [Op.like]: `%${filter.search}%` } },
                    { email: { [Op.like]: `%${filter.search}%` } }
                ];
            }
            if (filter.status) where.status = filter.status;
            if (filter.course) where.course = filter.course;

            // Fetch students
            const { count, rows } = await this.model.findAndCountAll({
                where,
                limit: limitNum,
                offset,
                raw: false,
                order: [['createdAt', 'DESC']]
            });

            // Enrich each student with borrow transaction data
            const enriched = await Promise.all(
                rows.map(async (student) => {
                    const borrowTxns = await this.borrowTransactionModel.findAll({
                        where: { studentId: student._id },
                        raw: true
                    });

                    const borrowedCount = borrowTxns.filter(t => t.status === 'BORROWED').length;
                    const overdueCount = borrowTxns.filter(
                        t => t.status === 'BORROWED' && new Date(t.dueDate) < new Date()
                    ).length;

                    return {
                        ...student.get({ plain: true }),
                        borrowedBooksCount: borrowedCount,
                        hasOverdue: overdueCount > 0,
                        lastBorrowDate: borrowTxns.length > 0 ? Math.max(...borrowTxns.map(t => new Date(t.issuedAt))) : null
                    };
                })
            );

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
     * Build WHERE clause: handle search, status, course filters
     */
    _buildWhereClause(filters) {
        const where = {};
        if (filters.search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${filters.search}%` } },
                { email: { [Op.like]: `%${filters.search}%` } }
            ];
        }
        if (filters.status) where.status = filters.status;
        if (filters.course) where.course = filters.course;
        return where;
    }
}

module.exports = StudentRepository;
