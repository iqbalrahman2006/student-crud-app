/**
 * MIGRATION: MongoDB Transaction → MySQL Transaction (Sequelize)
 * ========================================================
 * Legacy transaction model (alternative to BorrowTransaction).
 * Uses different field names: student, book, issueDate, returnDate, fine (not fineAmount).
 * Kept for backward compatibility; may be deprecated post-migration.
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define('Transaction', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
        },
        student: {
            type: DataTypes.CHAR(24),
            allowNull: false,
            references: {
                model: 'Students',
                key: '_id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        },
        book: {
            type: DataTypes.CHAR(24),
            allowNull: false,
            references: {
                model: 'Books',
                key: '_id'
            },
            onDelete: 'RESTRICT',
            onUpdate: 'CASCADE'
        },
        studentName: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        bookTitle: {
            type: DataTypes.STRING(512),
            allowNull: true
        },
        issueDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        dueDate: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfterOrEqual(value) {
                    if (value < this.issueDate) {
                        throw new Error('Due date must be on or after issue date');
                    }
                }
            }
        },
        returnDate: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterOrEqual(value) {
                    if (value && value < this.issueDate) {
                        throw new Error('Return date must be on or after issue date');
                    }
                }
            }
        },
        status: {
            type: DataTypes.ENUM('Issued', 'Returned', 'Overdue'),
            allowNull: false,
            defaultValue: 'Issued'
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
        fine: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0
            }
        }
    }, {
        tableName: 'Transactions',
        timestamps: true,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['student'] },
            { fields: ['book'] },
            { fields: ['status', 'dueDate'] },
            { fields: ['issueDate'] },
            { fields: ['status'] }
        ]
    });

    /**
     * LAYER 1: DBMS Hardening - Enforce status/returnDate consistency
     */
    Transaction.beforeSave((instance, options) => {
        const validStatuses = ['Issued', 'Returned', 'Overdue'];
        if (!validStatuses.includes(instance.status)) {
            const error = new Error(`Invalid status: ${instance.status}. Must be one of: ${validStatuses.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        // Consistency check: status must match returnDate
        if (instance.status === 'Returned' && !instance.returnDate) {
            const error = new Error('Status Returned requires returnDate');
            error.statusCode = 400;
            throw error;
        }
        if ((instance.status === 'Issued' || instance.status === 'Overdue') && instance.returnDate) {
            const error = new Error(`Status ${instance.status} requires returnDate to be null`);
            error.statusCode = 400;
            throw error;
        }

        // Prevent updating issueDate (immutable)
        if (instance.isNew === false && instance._previousDataValues && instance._previousDataValues.issueDate !== instance.issueDate) {
            const error = new Error('DBMS INTEGRITY: issueDate is immutable');
            error.statusCode = 403;
            throw error;
        }
    });

    /**
     * LAYER 1: Validate renewalCount max
     */
    Transaction.beforeUpdate((instance, options) => {
        if (instance.renewalCount > 5) {
            const error = new Error('Maximum 5 renewals allowed');
            error.statusCode = 400;
            throw error;
        }
    });

    return Transaction;
};
