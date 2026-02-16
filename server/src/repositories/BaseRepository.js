/**
 * MIGRATION: Abstract Data Access Layer (Repositories)
 * ========================================================
 * BaseRepository provides common read operations and transaction wrapper.
 * All multi-entity operations must be wrapped in sequelize.transaction().
 * 
 * CRITICAL: Controllers call repositories, not models directly.
 * Repositories ensure parity with Mongoose API while using Sequelize backend.
 * ========================================================
 */

class BaseRepository {
    constructor(model, sequelize) {
        this.model = model;
        this.sequelize = sequelize;
    }

    /**
     * Find by primary key (_id)
     */
    async findById(id) {
        try {
            const record = await this.model.findByPk(id);
            return record ? record.get({ plain: true }) : null;
        } catch (err) {
            const error = new Error(`Database error in findById: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Find all records with optional filters and pagination
     */
    async find(filters = {}, options = {}) {
        try {
            const { limit = 100, offset = 0, order = [['createdAt', 'DESC']] } = options;
            const where = this._buildWhereClause(filters);

            const { count, rows } = await this.model.findAndCountAll({
                where,
                limit,
                offset,
                order,
                raw: true
            });

            return {
                data: rows,
                total: count,
                limit,
                offset
            };
        } catch (err) {
            const error = new Error(`Database error in find: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Find one record matching filters
     */
    async findOne(filters = {}) {
        try {
            const where = this._buildWhereClause(filters);
            const record = await this.model.findOne({ where });
            return record ? record.get({ plain: true }) : null;
        } catch (err) {
            const error = new Error(`Database error in findOne: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Count matching records
     */
    async count(filters = {}) {
        try {
            const where = this._buildWhereClause(filters);
            return await this.model.count({ where });
        } catch (err) {
            const error = new Error(`Database error in count: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Create a new record
     * WRAPPED IN TRANSACTION to ensure atomicity
     */
    async create(data) {
        // Ensure Sequelize models with non-null primary key `_id` get a value
        if (this.model && this.model.rawAttributes && this.model.rawAttributes._id && !data._id) {
            data._id = Date.now().toString(16) + Math.floor(Math.random() * 0xffffff).toString(16);
        }

        const transaction = await this.sequelize.transaction();
        try {
            const record = await this.model.create(data, { transaction });
            await transaction.commit();
            return record.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Update a record by primary key
     * WRAPPED IN TRANSACTION
     */
    async findByIdAndUpdate(id, data) {
        const transaction = await this.sequelize.transaction();
        try {
            const record = await this.model.findByPk(id, { transaction });
            if (!record) {
                await transaction.rollback();
                const error = new Error('Record not found');
                error.statusCode = 404;
                throw error;
            }

            await record.update(data, { transaction, validate: true });
            await transaction.commit();
            return record.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Delete a record by primary key
     * WRAPPED IN TRANSACTION
     */
    async findByIdAndDelete(id) {
        const transaction = await this.sequelize.transaction();
        try {
            const record = await this.model.findByPk(id, { transaction });
            if (!record) {
                await transaction.rollback();
                const error = new Error('Record not found');
                error.statusCode = 404;
                throw error;
            }

            await record.destroy({ transaction });
            await transaction.commit();
            return { message: 'Record deleted successfully' };
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Check if record exists
     */
    async exists(filters = {}) {
        try {
            const where = this._buildWhereClause(filters);
            const count = await this.model.count({ where });
            return count > 0;
        } catch (err) {
            const error = new Error(`Database error in exists: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Helper: Build WHERE clause from filters
     * Subclasses can override for custom filter logic
     */
    _buildWhereClause(filters) {
        const where = { ...filters };
        return Object.keys(where).length === 0 ? {} : where;
    }

    /**
     * Helper: Handle errors from Sequelize
     * Maps Sequelize errors to HTTP-friendly errors
     */
    _handleError(err) {
        if (err.name === 'SequelizeValidationError') {
            const error = new Error(err.message);
            error.statusCode = 400;
            throw error;
        }
        if (err.name === 'SequelizeUniqueConstraintError') {
            const error = new Error('Duplicate field value entered');
            error.statusCode = 400;
            throw error;
        }
        if (err.name === 'SequelizeForeignKeyConstraintError') {
            const error = new Error('Foreign key constraint violation');
            error.statusCode = 400;
            throw error;
        }
        if (err.statusCode) {
            throw err; // Already has statusCode
        }
        const error = new Error(err.message);
        error.statusCode = 500;
        throw error;
    }

    /**
     * Run a callback inside a transaction
     * Used for multi-step operations
     */
    async runInTransaction(callback) {
        const transaction = await this.sequelize.transaction();
        try {
            const result = await callback(transaction);
            await transaction.commit();
            return result;
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }
}

module.exports = BaseRepository;
