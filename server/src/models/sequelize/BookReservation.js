/**
 * MIGRATION: MongoDB BookReservation → MySQL BookReservation (Sequelize)
 * ========================================================
 * Reservation queue for books: tracks student hold on a book.
 * Status: Active, Fulfilled, Expired, Cancelled
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const BookReservation = sequelize.define('BookReservation', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
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
        status: {
            type: DataTypes.ENUM('Active', 'Fulfilled', 'Expired', 'Cancelled'),
            allowNull: false,
            defaultValue: 'Active'
        },
        queuePosition: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        fulfilledAt: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                isAfterOrEqual(value) {
                    if (value && value < this.timestamp) {
                        throw new Error('Fulfilled date must be on or after creation timestamp');
                    }
                }
            }
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'BookReservations',
        timestamps: true,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['book', 'status'] },
            { fields: ['student', 'status'] },
            { fields: ['status'] },
            { fields: ['timestamp'] }
        ]
    });

    /**
     * LAYER 1: DBMS Hardening - Enforce status/fulfilledAt consistency
     */
    BookReservation.beforeSave((instance, options) => {
        const validStatuses = ['Active', 'Fulfilled', 'Expired', 'Cancelled'];
        if (!validStatuses.includes(instance.status)) {
            const error = new Error(`Invalid status: ${instance.status}`);
            error.statusCode = 400;
            throw error;
        }

        if (instance.status === 'Fulfilled' && !instance.fulfilledAt) {
            const error = new Error('Fulfilled status requires fulfilledAt date');
            error.statusCode = 400;
            throw error;
        }
    });

    /**
     * LAYER 1: Prevent updating timestamp (immutable)
     */
    BookReservation.beforeUpdate((instance, options) => {
        if (instance._previousDataValues && instance._previousDataValues.timestamp !== instance.timestamp) {
            const error = new Error('DBMS INTEGRITY: timestamp is immutable');
            error.statusCode = 403;
            throw error;
        }
    });

    return BookReservation;
};
