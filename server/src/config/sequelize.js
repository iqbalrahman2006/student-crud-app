/**
 * MIGRATION STRATEGY (NO-REGRESSION MODE):
 * ========================================================
 * This file implements Sequelize initialization for MySQL migration.
 * - Preserves MongoDB-compatible field names and response shapes
 * - Uses CHAR(24) for _id PKs to store MongoDB ObjectId hex strings
 * - Enforces strict foreign key constraints (ON DELETE RESTRICT)
 * - Wraps multi-entity operations in explicit transactions
 * 
 * CRITICAL: Controllers and routes must NOT be modified.
 * Data access abstraction delegated to repositories (DAL layer).
 * ========================================================
 */

const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// MySQL connection configuration
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'studentdb',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
        timestamps: true, // createdAt, updatedAt
        underscored: false, // preserve camelCase from MongoDB
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
    },
    pool: {
        max: 10,
        min: 2,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        decimalNumbers: true
    }
});

/**
 * Model Registration
 * Import and register all Sequelize models from models/ directory
 */
const registerModels = (sequelizeInstance) => {
    const models = {};
    
    // Load all model files from models directory
    const modelFiles = [
        'Student',
        'Book',
        'BorrowTransaction',
        'BookReservation',
        'LibraryAuditLog',
        'User',
        'Transaction'
    ];

    modelFiles.forEach(modelName => {
        try {
            const modelPath = path.join(__dirname, '../models/sequelize', `${modelName}.js`);
            const modelFactory = require(modelPath);
            const model = modelFactory(sequelizeInstance, require('sequelize').DataTypes);
            models[modelName] = model;
        } catch (err) {
            // Models will be loaded progressively
            console.warn(`[Sequelize] Warning: Could not load model ${modelName}: ${err.message}`);
        }
    });

    return models;
};

/**
 * Association Setup (Foreign Key Relationships)
 * Must be called after all models are registered
 */
const setupAssociations = (models) => {
    if (!models.Student || !models.Book) return; // Wait for models

    // BorrowTransaction associations
    if (models.BorrowTransaction) {
        models.BorrowTransaction.belongsTo(models.Student, {
            foreignKey: 'studentId',
            as: 'student',
            onDelete: 'RESTRICT'
        });
        models.BorrowTransaction.belongsTo(models.Book, {
            foreignKey: 'bookId',
            as: 'book',
            onDelete: 'RESTRICT'
        });
    }

    // Transaction associations
    if (models.Transaction) {
        models.Transaction.belongsTo(models.Student, {
            foreignKey: 'student',
            as: 'studentRef',
            onDelete: 'RESTRICT'
        });
        models.Transaction.belongsTo(models.Book, {
            foreignKey: 'book',
            as: 'bookRef',
            onDelete: 'RESTRICT'
        });
    }

    // BookReservation associations
    if (models.BookReservation) {
        models.BookReservation.belongsTo(models.Student, {
            foreignKey: 'student',
            as: 'studentRes',
            onDelete: 'RESTRICT'
        });
        models.BookReservation.belongsTo(models.Book, {
            foreignKey: 'book',
            as: 'bookRes',
            onDelete: 'RESTRICT'
        });
    }

    // LibraryAuditLog associations (all nullable)
    if (models.LibraryAuditLog) {
        if (models.Book) {
            models.LibraryAuditLog.belongsTo(models.Book, {
                foreignKey: 'bookId',
                as: 'bookAudit',
                onDelete: 'SET NULL',
                allowNull: true
            });
        }
        if (models.Student) {
            models.LibraryAuditLog.belongsTo(models.Student, {
                foreignKey: 'studentId',
                as: 'studentAudit',
                onDelete: 'SET NULL',
                allowNull: true
            });
        }
        if (models.User) {
            models.LibraryAuditLog.belongsTo(models.User, {
                foreignKey: 'adminId',
                as: 'adminAudit',
                onDelete: 'SET NULL',
                allowNull: true
            });
        }
    }

    // Reverse associations
    if (models.Student && models.BorrowTransaction) {
        models.Student.hasMany(models.BorrowTransaction, {
            foreignKey: 'studentId',
            as: 'borrowTransactions'
        });
    }
    if (models.Book && models.BorrowTransaction) {
        models.Book.hasMany(models.BorrowTransaction, {
            foreignKey: 'bookId',
            as: 'borrowTransactions'
        });
    }
};

/**
 * Initialize Sequelize and sync schema
 */
const initializeDatabase = async () => {
    try {
        console.log('[Sequelize] Testing MySQL connection...');
        await sequelize.authenticate();
        console.log('[Sequelize] MySQL connection established successfully');

        // Register all models
        const models = registerModels(sequelize);
        sequelize.models = models;

        // Set up associations
        setupAssociations(models);

        // Sync schema (create tables if they don't exist)
        // IMPORTANT: use { alter: false } in production to avoid unwanted drops
        if (process.env.NODE_ENV === 'development') {
            await sequelize.sync({ alter: false }); // Set to true only for safe changes
        }

        console.log('[Sequelize] Database schema synchronized');
        return sequelize;
    } catch (err) {
        console.error('[Sequelize] Database initialization failed:', err.message);
        throw err;
    }
};

module.exports = {
    sequelize,
    initializeDatabase,
    registerModels
};
