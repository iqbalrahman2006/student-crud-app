/**
 * MIGRATION: MongoDB User → MySQL User (Sequelize)
 * ========================================================
 * User/Admin credentials with role-based access control.
 * Roles: ADMIN, LIBRARIAN, AUDITOR, STUDENT
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        role: {
            type: DataTypes.ENUM('ADMIN', 'LIBRARIAN', 'AUDITOR', 'STUDENT'),
            allowNull: false,
            defaultValue: 'STUDENT'
        }
    }, {
        tableName: 'Users',
        timestamps: true,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['email'], unique: true }
        ]
    });

    /**
     * LAYER 1: DBMS Hardening - Validate role enum
     */
    User.beforeSave((instance, options) => {
        const validRoles = ['ADMIN', 'LIBRARIAN', 'AUDITOR', 'STUDENT'];
        if (!validRoles.includes(instance.role)) {
            const error = new Error(`Invalid role: ${instance.role}. Must be one of: ${validRoles.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }
    });

    return User;
};
