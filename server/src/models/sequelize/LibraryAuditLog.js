/**
 * MIGRATION: MongoDB LibraryAuditLog → MySQL LibraryAuditLog (Sequelize)
 * ========================================================
 * Immutable audit ledger: records all library operations.
 * Foreign keys are NULLABLE (soft references for deleted entities).
 * CRITICAL: Prevent UPDATE/DELETE via database triggers + application hooks.
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const LibraryAuditLog = sequelize.define('LibraryAuditLog', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
        },
        action: {
            type: DataTypes.ENUM(
                'BORROW',
                'RETURN',
                'RENEW',
                'ADD',
                'UPDATE',
                'DELETE',
                'OVERDUE',
                'RESERVE',
                'EMAIL_SENT'
            ),
            allowNull: false
        },
        bookId: {
            type: DataTypes.CHAR(24),
            allowNull: true,
            references: {
                model: 'Books',
                key: '_id'
            },
            onDelete: 'SET NULL'
        },
        studentId: {
            type: DataTypes.CHAR(24),
            allowNull: true,
            references: {
                model: 'Students',
                key: '_id'
            },
            onDelete: 'SET NULL'
        },
        adminId: {
            type: DataTypes.CHAR(24),
            allowNull: true,
            references: {
                model: 'Users',
                key: '_id'
            },
            onDelete: 'SET NULL'
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: {}
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'LibraryAuditLogs',
        timestamps: false, // Use explicit timestamp field
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['action', 'timestamp'] },
            { fields: ['studentId', 'timestamp'] },
            { fields: ['bookId', 'timestamp'] },
            { fields: ['timestamp'] },
            { fields: ['action'] }
        ]
    });

    /**
     * LAYER 7: DBMS Integrity - Audit logs are IMMUTABLE
     * Prevent UPDATE operations entirely
     */
    LibraryAuditLog.beforeBulkUpdate((options) => {
        const error = new Error('DBMS INTEGRITY: Audit logs are immutable and cannot be updated');
        error.statusCode = 403;
        throw error;
    });

    LibraryAuditLog.beforeUpdate((instance, options) => {
        const error = new Error('DBMS INTEGRITY: Audit logs are immutable and cannot be updated');
        error.statusCode = 403;
        throw error;
    });

    /**
     * LAYER 7: Prevent DELETE operations on audit logs
     */
    LibraryAuditLog.beforeDestroy((instance, options) => {
        const error = new Error('DBMS INTEGRITY: Audit logs are immutable and cannot be deleted');
        error.statusCode = 403;
        throw error;
    });

    /**
     * LAYER 1: Validate action enum and log structure
     */
    LibraryAuditLog.beforeCreate((instance, options) => {
        const validActions = ['BORROW', 'RETURN', 'RENEW', 'ADD', 'UPDATE', 'DELETE', 'OVERDUE', 'RESERVE', 'EMAIL_SENT'];
        if (!validActions.includes(instance.action)) {
            const error = new Error(`Invalid action: ${instance.action}`);
            error.statusCode = 400;
            throw error;
        }
    });

    return LibraryAuditLog;
};
