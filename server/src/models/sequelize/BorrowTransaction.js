/**
 * MIGRATION: MongoDB BorrowTransaction → MySQL BorrowTransaction (Sequelize)
 * ========================================================
 * Core transaction ledger: tracks book issues, returns, overdues, fines, renewals.
 * Foreign keys enforced: studentId → Students._id, bookId → Books._id
 * Status transitions must be consistent with returnedAt field.
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const BorrowTransaction = sequelize.define('BorrowTransaction', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
        },
        studentId: {
            type: DataTypes.CHAR(24),
            allowNull: false,
            references: {
                model: 'Students',
                key: '_id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        },
        bookId: {
            type: DataTypes.CHAR(24),
            allowNull: false,
            references: {
                model: 'Books',
                key: '_id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        },
        issuedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfterOrEqual(value) {
                    if (value < this.issuedAt) {
                        throw new Error('Due date must be on or after issue date');
                    }
                }
            }
        },
        returnedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterOrEqual(value) {
                    if (value && value < this.issuedAt) {
                        throw new Error('Return date must be on or after issue date');
                    }
                }
            }
        },
        fineAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        },
        status: {
            type: DataTypes.ENUM('BORROWED', 'RETURNED', 'OVERDUE'),
            allowNull: false,
            defaultValue: 'BORROWED'
        },
        renewalCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                max: 5
            }
        },
        demo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        studentName: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        bookTitle: {
            type: DataTypes.STRING(512),
            allowNull: true
        }
    }, {
        tableName: 'BorrowTransactions',
        timestamps: true,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['studentId', 'status'] },
            { fields: ['bookId', 'status'] },
            { fields: ['issuedAt'] },
            { fields: ['dueDate', 'status'] }
        ]
    });

    /**
     * LAYER 1: DBMS Hardening - Enforce status/returnedAt consistency
     * - RETURNED status requires returnedAt date
     * - BORROWED/OVERDUE status requires returnedAt = null
     */
    BorrowTransaction.beforeSave((instance, options) => {
        const validStatuses = ['BORROWED', 'RETURNED', 'OVERDUE'];
        if (!validStatuses.includes(instance.status)) {
            const error = new Error(`Invalid status: ${instance.status}. Must be one of: ${validStatuses.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        // Consistency check: status must match returnedAt
        if (instance.status === 'RETURNED' && !instance.returnedAt) {
            const error = new Error('Status RETURNED requires returnedAt date');
            error.statusCode = 400;
            throw error;
        }
        if ((instance.status === 'BORROWED' || instance.status === 'OVERDUE') && instance.returnedAt) {
            const error = new Error(`Status ${instance.status} requires returnedAt to be null`);
            error.statusCode = 400;
            throw error;
        }

        // Prevent updating issuedAt (immutable)
        if (instance.isNew === false && instance._previousDataValues && instance._previousDataValues.issuedAt !== instance.issuedAt) {
            const error = new Error('DBMS INTEGRITY: issuedAt is immutable');
            error.statusCode = 403;
            throw error;
        }
    });

    /**
     * LAYER 1: Validate renewalCount max
     */
    BorrowTransaction.beforeUpdate((instance, options) => {
        if (instance.renewalCount > 5) {
            const error = new Error('Maximum 5 renewals allowed');
            error.statusCode = 400;
            throw error;
        }
    });

    return BorrowTransaction;
};
