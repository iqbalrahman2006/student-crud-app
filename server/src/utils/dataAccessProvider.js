/**
 * MIGRATION: Unified Data Access Provider
 * ========================================================
 * This module provides a single interface for data access,
 * routing to either repositories (MySQL/Sequelize) or models (MongoDB/Mongoose)
 * based on DB_ENGINE environment variable.
 * 
 * Controllers import from here instead of directly from models or repositories.
 * Ensures backward compatibility during gradual migration.
 * ========================================================
 */

const DB_ENGINE = process.env.DB_ENGINE || 'mysql';

let repositories = null;

const buildTestRepositories = () => {
    if (repositories) return;
    const Student = require('../models/Student');
    const Book = require('../models/Book');
    const BorrowTransaction = require('../models/BorrowTransaction');
    const BookReservation = require('../models/BookReservation');
    const LibraryAuditLog = require('../models/LibraryAuditLog');

    const makeWrapper = (Model) => ({
        findById: (id) => Model.findById(id),
        find: (filters, opts) => {
            const { limit = 100, offset = 0 } = opts || {};
            return Model.find(filters).limit(limit).skip(offset);
        },
        findOne: (filters) => Model.findOne(filters),
        count: (filters) => Model.countDocuments(filters),
        create: (data) => Model.create(data),
        findByIdAndUpdate: (id, data) => Model.findByIdAndUpdate(id, data, { new: true }),
        findByIdAndDelete: (id) => Model.findByIdAndDelete(id),
        exists: (filters) => Model.exists(filters)
    });

    repositories = {
        student: makeWrapper(Student),
        book: makeWrapper(Book),
        borrowTransaction: Object.assign(makeWrapper(BorrowTransaction), {
            getActiveBorrows: (studentId) => BorrowTransaction.find({ studentId, status: 'BORROWED' }),
            getOverdueTransactions: () => BorrowTransaction.find({
                $or: [
                    { status: 'OVERDUE' },
                    { status: 'BORROWED', dueDate: { $lt: new Date() } }
                ]
            })
        }),
        reservation: makeWrapper(BookReservation),
        audit: Object.assign(makeWrapper(LibraryAuditLog), {
            createLog: (action, data) => LibraryAuditLog.create({ action, ...data })
        })
    };
};

/**
 * Initialize data access provider (called from server.js)
 */
const initializeDataAccess = (sequelize) => {
    if (DB_ENGINE === 'mysql') {
        // During tests, the codebase often sets DB_ENGINE=mysql but uses
        // mocked Mongoose models. To avoid controllers throwing
        // "Repositories not initialized", create lightweight wrappers
        // around the Mongoose models so existing controllers can call
        // repository methods in test mode without a real Sequelize setup.
        if (process.env.NODE_ENV === 'test') {
            const Student = require('../models/Student');
            const Book = require('../models/Book');
            const BorrowTransaction = require('../models/BorrowTransaction');
            const BookReservation = require('../models/BookReservation');
            const LibraryAuditLog = require('../models/LibraryAuditLog');

            const makeWrapper = (Model) => ({
                findById: (id) => Model.findById(id),
                find: (filters, opts) => {
                    const { limit = 100, offset = 0 } = opts || {};
                    return Model.find(filters).limit(limit).skip(offset);
                },
                findOne: (filters) => Model.findOne(filters),
                count: (filters) => Model.countDocuments(filters),
                create: (data) => Model.create(data),
                findByIdAndUpdate: (id, data) => Model.findByIdAndUpdate(id, data, { new: true }),
                findByIdAndDelete: (id) => Model.findByIdAndDelete(id),
                exists: (filters) => Model.exists(filters)
            });

            repositories = {
                student: makeWrapper(Student),
                book: makeWrapper(Book),
                borrowTransaction: Object.assign(makeWrapper(BorrowTransaction), {
                    getActiveBorrows: (studentId) => BorrowTransaction.find({ studentId, status: 'BORROWED' }),
                    getOverdueTransactions: () => BorrowTransaction.find({
                        $or: [
                            { status: 'OVERDUE' },
                            { status: 'BORROWED', dueDate: { $lt: new Date() } }
                        ]
                    })
                }),
                reservation: makeWrapper(BookReservation),
                audit: Object.assign(makeWrapper(LibraryAuditLog), {
                    createLog: (action, data) => LibraryAuditLog.create({ action, ...data })
                })
            };

            return;
        }

        const { initializeRepositories } = require('../repositories');
        repositories = initializeRepositories(sequelize);
    }
};

/**
 * Get student data accessor
 */
const getStudentAccessor = () => {
    if (DB_ENGINE === 'mysql') {
        if (!repositories) {
            if (process.env.NODE_ENV === 'test') {
                buildTestRepositories();
            } else {
                throw new Error('Repositories not initialized');
            }
        }
        return repositories.student;
    } else {
        // MongoDB mode: return Mongoose model wrapped in repository-like interface
        const Student = require('../models/Student');
        return {
            findById: (id) => Student.findById(id),
            find: (filters, opts) => {
                const { limit = 100, offset = 0 } = opts || {};
                return Student.find(filters).limit(limit).skip(offset);
            },
            findOne: (filters) => Student.findOne(filters),
            count: (filters) => Student.countDocuments(filters),
            create: (data) => Student.create(data),
            findByIdAndUpdate: (id, data) => Student.findByIdAndUpdate(id, data, { new: true }),
            findByIdAndDelete: (id) => Student.findByIdAndDelete(id),
            exists: (filters) => Student.exists(filters),
            getAll: (opts) => require('../services/studentService').getAll(opts)
        };
    }
};

/**
 * Get book data accessor
 */
const getBookAccessor = () => {
    if (DB_ENGINE === 'mysql') {
        if (!repositories) {
            if (process.env.NODE_ENV === 'test') {
                buildTestRepositories();
            } else {
                throw new Error('Repositories not initialized');
            }
        }
        return repositories.book;
    } else {
        const Book = require('../models/Book');
        return {
            findById: (id) => Book.findById(id),
            find: (filters, opts) => {
                const { limit = 100, offset = 0 } = opts || {};
                return Book.find(filters).limit(limit).skip(offset);
            },
            findOne: (filters) => Book.findOne(filters),
            count: (filters) => Book.countDocuments(filters),
            create: (data) => Book.create(data),
            findByIdAndUpdate: (id, data) => Book.findByIdAndUpdate(id, data, { new: true }),
            findByIdAndDelete: (id) => Book.findByIdAndDelete(id),
            exists: (filters) => Book.exists(filters)
        };
    }
};

/**
 * Get borrow transaction data accessor
 */
const getBorrowTransactionAccessor = () => {
    if (DB_ENGINE === 'mysql') {
        if (!repositories) {
            if (process.env.NODE_ENV === 'test') {
                buildTestRepositories();
            } else {
                throw new Error('Repositories not initialized');
            }
        }
        return repositories.borrowTransaction;
    } else {
        const BorrowTransaction = require('../models/BorrowTransaction');
        const Transaction = require('../models/Transaction');
        return {
            findById: (id) => BorrowTransaction.findById(id),
            find: (filters, opts) => {
                const { limit = 100, offset = 0 } = opts || {};
                return BorrowTransaction.find(filters).limit(limit).skip(offset);
            },
            findOne: (filters) => BorrowTransaction.findOne(filters),
            count: (filters) => BorrowTransaction.countDocuments(filters),
            create: (data) => BorrowTransaction.create(data),
            findByIdAndUpdate: (id, data) => BorrowTransaction.findByIdAndUpdate(id, data, { new: true }),
            findByIdAndDelete: (id) => BorrowTransaction.findByIdAndDelete(id),
            exists: (filters) => BorrowTransaction.exists(filters),
            getActiveBorrows: (studentId) => BorrowTransaction.find({ studentId, status: 'BORROWED' }),
            getOverdueTransactions: () => BorrowTransaction.find({ 
                $or: [
                    { status: 'OVERDUE' },
                    { status: 'BORROWED', dueDate: { $lt: new Date() } }
                ]
            })
        };
    }
};

/**
 * Get reservation data accessor
 */
const getReservationAccessor = () => {
    if (DB_ENGINE === 'mysql') {
        if (!repositories) {
            if (process.env.NODE_ENV === 'test') {
                buildTestRepositories();
            } else {
                throw new Error('Repositories not initialized');
            }
        }
        return repositories.reservation;
    } else {
        const BookReservation = require('../models/BookReservation');
        return {
            findById: (id) => BookReservation.findById(id),
            find: (filters, opts) => {
                const { limit = 100, offset = 0 } = opts || {};
                return BookReservation.find(filters).limit(limit).skip(offset);
            },
            findOne: (filters) => BookReservation.findOne(filters),
            count: (filters) => BookReservation.countDocuments(filters),
            create: (data) => BookReservation.create(data),
            findByIdAndUpdate: (id, data) => BookReservation.findByIdAndUpdate(id, data, { new: true }),
            findByIdAndDelete: (id) => BookReservation.findByIdAndDelete(id),
            exists: (filters) => BookReservation.exists(filters)
        };
    }
};

/**
 * Get audit log data accessor
 */
const getAuditAccessor = () => {
    if (DB_ENGINE === 'mysql') {
        if (!repositories) {
            if (process.env.NODE_ENV === 'test') {
                buildTestRepositories();
            } else {
                throw new Error('Repositories not initialized');
            }
        }
        return repositories.audit;
    } else {
        const LibraryAuditLog = require('../models/LibraryAuditLog');
        return {
            findById: (id) => LibraryAuditLog.findById(id),
            find: (filters, opts) => {
                const { limit = 100, offset = 0 } = opts || {};
                return LibraryAuditLog.find(filters).limit(limit).skip(offset);
            },
            findOne: (filters) => LibraryAuditLog.findOne(filters),
            count: (filters) => LibraryAuditLog.countDocuments(filters),
            create: (data) => LibraryAuditLog.create(data),
            exists: (filters) => LibraryAuditLog.exists(filters),
            createLog: (action, data) => LibraryAuditLog.create({ action, ...data })
        };
    }
};

module.exports = {
    initializeDataAccess,
    getStudentAccessor,
    getBookAccessor,
    getBorrowTransactionAccessor,
    getReservationAccessor,
    getAuditAccessor,
    DB_ENGINE
};
