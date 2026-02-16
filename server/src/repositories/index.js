/**
 * MIGRATION: Repository Factory
 * ========================================================
 * Initializes all repository instances with proper models and Sequelize instance.
 * Controllers import repositories from here (singleton pattern).
 * ========================================================
 */

let repositories = null;

const initializeRepositories = (sequelize) => {
    const models = sequelize.models || {};

    const StudentRepository = require('./StudentRepository');
    const BookRepository = require('./BookRepository');
    const BorrowTransactionRepository = require('./BorrowTransactionRepository');
    const BookReservationRepository = require('./BookReservationRepository');
    const AuditRepository = require('./AuditRepository');

    repositories = {
        student: new StudentRepository(models.Student, models.BorrowTransaction, sequelize),
        book: new BookRepository(models.Book, sequelize),
        borrowTransaction: new BorrowTransactionRepository(
            models.BorrowTransaction,
            models.Student,
            models.Book,
            models.LibraryAuditLog,
            sequelize
        ),
        reservation: new BookReservationRepository(models.BookReservation, sequelize),
        audit: new AuditRepository(models.LibraryAuditLog, sequelize)
    };

    return repositories;
};

const getRepositories = () => {
    if (!repositories) {
        throw new Error('Repositories not initialized. Call initializeRepositories(sequelize) first.');
    }
    return repositories;
};

module.exports = {
    initializeRepositories,
    getRepositories
};
