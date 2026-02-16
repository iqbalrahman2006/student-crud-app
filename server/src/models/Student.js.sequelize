/**
 * MIGRATION: MongoDB Student → MySQL Student (Sequelize)
 * ========================================================
 * Preserves exact field names and types from Mongoose schema.
 * Uses CHAR(24) for _id to store MongoDB ObjectId hex strings.
 * Immutable fields enforced via beforeUpdate hook.
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const Student = sequelize.define('Student', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [2, 255]
            }
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        phone: {
            type: DataTypes.STRING(50),
            allowNull: true
        },
        course: {
            type: DataTypes.STRING(128),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Graduated'),
            allowNull: false,
            defaultValue: 'Active'
        },
        enrollmentDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        gpa: {
            type: DataTypes.DECIMAL(4, 2),
            allowNull: true,
            validate: {
                min: 0,
                max: 10.0
            }
        },
        city: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        country: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        zipCode: {
            type: DataTypes.STRING(20),
            allowNull: true
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        guardianName: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        emergencyContact: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        studentCategory: {
            type: DataTypes.STRING(128),
            allowNull: true
        },
        scholarshipStatus: {
            type: DataTypes.STRING(128),
            allowNull: true
        },
        bloodGroup: {
            type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''),
            allowNull: true
        },
        hostelRequired: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        transportMode: {
            type: DataTypes.STRING(64),
            allowNull: true
        }
    }, {
        tableName: 'Students',
        timestamps: true,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['email'], unique: true },
            { fields: ['status'] },
            { fields: ['createdAt'] }
        ]
    });

    /**
     * LAYER 1: DBMS Hardening - Enforce immutable fields
     * Email and enrollmentDate cannot be modified after creation
     */
    Student.beforeUpdate((instance, options) => {
        const previousValues = instance._previousDataValues || {};
        
        if (previousValues.email && previousValues.email !== instance.email) {
            const error = new Error('DBMS INTEGRITY: Email is immutable and cannot be changed');
            error.statusCode = 403;
            throw error;
        }

        if (previousValues.enrollmentDate && previousValues.enrollmentDate !== instance.enrollmentDate) {
            const error = new Error('DBMS INTEGRITY: enrollmentDate is immutable and cannot be changed');
            error.statusCode = 403;
            throw error;
        }
    });

    /**
     * LAYER 1: Validate status transitions
     */
    Student.beforeSave((instance, options) => {
        const validStatuses = ['Active', 'Inactive', 'Suspended', 'Graduated'];
        if (!validStatuses.includes(instance.status)) {
            const error = new Error(`Invalid status: ${instance.status}. Must be one of: ${validStatuses.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }
    });

    return Student;
};
