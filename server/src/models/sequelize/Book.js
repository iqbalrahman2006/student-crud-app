/**
 * MIGRATION: MongoDB Book → MySQL Book (Sequelize)
 * ========================================================
 * Book inventory with tracking of checked-out copies.
 * availableCopies is computed (NOT stored) to avoid inconsistency.
 * ========================================================
 */

module.exports = (sequelize, DataTypes) => {
    const Book = sequelize.define('Book', {
        _id: {
            type: DataTypes.CHAR(24),
            primaryKey: true,
            allowNull: false
        },
        title: {
            type: DataTypes.STRING(512),
            allowNull: false,
            validate: {
                len: [2, 512]
            }
        },
        author: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                len: [2, 255]
            }
        },
        isbn: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true
        },
        genre: {
            type: DataTypes.STRING(128),
            allowNull: true
        },
        department: {
            type: DataTypes.ENUM(
                'Computer Science',
                'Electrical',
                'Mechanical',
                'Civil',
                'General',
                'Business',
                'Fiction',
                'Philosophy',
                'Science',
                'History',
                'Management',
                'Mathematics',
                'AI / ML'
            ),
            allowNull: false,
            defaultValue: 'General'
        },
        totalCopies: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 0,
                isInt: true
            }
        },
        checkedOutCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
                isInt: true
            }
        },
        lastAvailabilityUpdatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        overdueFlag: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        // availableCopies is COMPUTED on read (never stored)
        // SQL: MAX(0, totalCopies - checkedOutCount)
        status: {
            type: DataTypes.ENUM('Available', 'Out of Stock'),
            allowNull: false,
            defaultValue: 'Available'
        },
        shelfLocation: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        addedDate: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        autoTags: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        }
    }, {
        tableName: 'Books',
        timestamps: true,
        underscored: false,
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
            { fields: ['isbn'], unique: true },
            { fields: ['department'] },
            { fields: ['status'] },
            { fields: ['createdAt'] }
        ]
    });

    /**
     * LAYER 1: DBMS Hardening - Enforce inventory constraints
     * checkedOutCount must never exceed totalCopies
     */
    Book.beforeSave((instance, options) => {
        // Clamp checkedOutCount to valid range
        if (instance.checkedOutCount < 0) {
            instance.checkedOutCount = 0;
        }
        if (instance.checkedOutCount > instance.totalCopies) {
            const error = new Error(
                `Checked out count (${instance.checkedOutCount}) cannot exceed total copies (${instance.totalCopies})`
            );
            error.statusCode = 400;
            throw error;
        }

        // Auto-calculate status based on availability
        const availableCopies = Math.max(0, instance.totalCopies - instance.checkedOutCount);
        instance.status = availableCopies <= 0 ? 'Out of Stock' : 'Available';
        instance.lastAvailabilityUpdatedAt = new Date();
    });

    /**
     * LAYER 1: Prevent invalid department or status
     */
    Book.beforeUpdate((instance, options) => {
        const validDepts = [
            'Computer Science',
            'Electrical',
            'Mechanical',
            'Civil',
            'General',
            'Business',
            'Fiction',
            'Philosophy',
            'Science',
            'History',
            'Management',
            'Mathematics',
            'AI / ML'
        ];
        if (instance.department && !validDepts.includes(instance.department)) {
            const error = new Error(`Invalid department: ${instance.department}`);
            error.statusCode = 400;
            throw error;
        }

        const validStatuses = ['Available', 'Out of Stock'];
        if (instance.status && !validStatuses.includes(instance.status)) {
            const error = new Error(`Invalid status: ${instance.status}`);
            error.statusCode = 400;
            throw error;
        }

        // Prevent ISBN change (ISBN is immutable)
        const previousValues = instance._previousDataValues || {};
        if (previousValues.isbn && previousValues.isbn !== instance.isbn) {
            const error = new Error('DBMS INTEGRITY: ISBN is immutable and cannot be changed');
            error.statusCode = 403;
            throw error;
        }
    });

    return Book;
};
