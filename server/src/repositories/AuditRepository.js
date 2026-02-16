/**
 * MIGRATION: AuditRepository (DAL for LibraryAuditLog model)
 * ========================================================
 * Immutable audit ledger: records all operations.
 * Enforces immutability at repository layer (in addition to DB triggers).
 * ========================================================
 */

const BaseRepository = require('./BaseRepository');
const { Op } = require('sequelize');

class AuditRepository extends BaseRepository {
    constructor(auditLogModel, sequelize) {
        super(auditLogModel, sequelize);
    }

    /**
     * Create an audit log entry (immutable after creation)
     * All AUDIT operations are single-step (no multi-entity logic)
     */
    async createLog(action, { studentId, bookId, adminId, metadata, ipAddress, userAgent }) {
        try {
            const validActions = ['BORROW', 'RETURN', 'RENEW', 'ADD', 'UPDATE', 'DELETE', 'OVERDUE', 'RESERVE', 'EMAIL_SENT'];
            if (!validActions.includes(action)) {
                const error = new Error(`Invalid audit action: ${action}`);
                error.statusCode = 400;
                throw error;
            }

            const log = await this.model.create({
                _id: require('crypto').randomBytes(12).toString('hex'),
                action,
                studentId: studentId || null,
                bookId: bookId || null,
                adminId: adminId || null,
                timestamp: new Date(),
                metadata: metadata || {},
                ipAddress: ipAddress || null,
                userAgent: userAgent || null
            });

            return log.get({ plain: true });
        } catch (err) {
            this._handleError(err);
        }
    }

    /**
     * Get audit logs with filters (action, studentId, bookId, date range)
     */
    async getLogs(filters = {}, options = { limit: 500, offset: 0 }) {
        try {
            const where = {};
            if (filters.action) where.action = filters.action;
            if (filters.studentId) where.studentId = filters.studentId;
            if (filters.bookId) where.bookId = filters.bookId;
            if (filters.adminId) where.adminId = filters.adminId;

            if (filters.dateFrom || filters.dateTo) {
                where.timestamp = {};
                if (filters.dateFrom) where.timestamp[Op.gte] = new Date(filters.dateFrom);
                if (filters.dateTo) where.timestamp[Op.lte] = new Date(filters.dateTo);
            }

            const { count, rows } = await this.model.findAndCountAll({
                where,
                limit: options.limit,
                offset: options.offset,
                order: [['timestamp', 'DESC']],
                raw: true
            });

            return {
                data: rows,
                total: count,
                limit: options.limit,
                offset: options.offset
            };
        } catch (err) {
            const error = new Error(`Database error in getLogs: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Attempt to update: throws immediately (immutable)
     */
    findByIdAndUpdate(id, data) {
        const error = new Error('DBMS INTEGRITY: Audit logs are immutable and cannot be updated');
        error.statusCode = 403;
        throw error;
    }

    /**
     * Attempt to delete: throws immediately (immutable)
     */
    findByIdAndDelete(id) {
        const error = new Error('DBMS INTEGRITY: Audit logs are immutable and cannot be deleted');
        error.statusCode = 403;
        throw error;
    }

    /**
     * Get audit trail for a specific student-book transaction
     * (resolve full history of a transaction to catch "unknown" references)
     */
    async getTransactionAuditTrail(studentId, bookId, action = null) {
        try {
            const where = { studentId, bookId };
            if (action) where.action = action;

            return await this.model.findAll({
                where,
                order: [['timestamp', 'ASC']],
                raw: true
            });
        } catch (err) {
            const error = new Error(`Database error in getTransactionAuditTrail: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }
}

module.exports = AuditRepository;
