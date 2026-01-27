/**
 * LAYER 2: Database Integrity Service
 * 
 * Provides comprehensive database integrity validation, orphan detection,
 * and automated cleanup capabilities.
 * 
 * Functions:
 * - detectOrphans(): Scans all collections for broken references
 * - cleanupOrphans(): Removes invalid records safely
 * - validateIntegrity(): Full database integrity check
 * - generateHealthReport(): Returns DB health metrics
 */

const mongoose = require('mongoose');

/**
 * Detect orphaned records across all collections
 * @returns {Promise<Object>} Object containing arrays of orphan records by collection
 */
async function detectOrphans() {
    const orphans = {
        bookReservations: [],
        borrowTransactions: [],
        transactions: [],
        auditLogs: [],
        fineLedgers: []
    };

    try {
        // Get all valid IDs for reference checking
        const Student = mongoose.model('Student');
        const Book = mongoose.model('Book');
        const validStudentIds = await Student.distinct('_id');
        const validBookIds = await Book.distinct('_id');

        // Convert to strings for comparison
        const validStudentIdStrings = validStudentIds.map(id => id.toString());
        const validBookIdStrings = validBookIds.map(id => id.toString());

        // Check BookReservations
        const BookReservation = mongoose.model('BookReservation');
        const reservations = await BookReservation.find({});
        for (const res of reservations) {
            const hasInvalidStudent = res.student && !validStudentIdStrings.includes(res.student.toString());
            const hasInvalidBook = res.book && !validBookIdStrings.includes(res.book.toString());

            if (hasInvalidStudent || hasInvalidBook) {
                orphans.bookReservations.push({
                    _id: res._id,
                    reason: hasInvalidStudent ? 'Invalid student reference' : 'Invalid book reference',
                    studentId: res.student,
                    bookId: res.book
                });
            }
        }

        // Check BorrowTransactions
        const BorrowTransaction = mongoose.model('BorrowTransaction');
        const borrowTxns = await BorrowTransaction.find({});
        for (const txn of borrowTxns) {
            const hasInvalidStudent = txn.studentId && !validStudentIdStrings.includes(txn.studentId.toString());
            const hasInvalidBook = txn.bookId && !validBookIdStrings.includes(txn.bookId.toString());

            if (hasInvalidStudent || hasInvalidBook) {
                orphans.borrowTransactions.push({
                    _id: txn._id,
                    reason: hasInvalidStudent ? 'Invalid student reference' : 'Invalid book reference',
                    studentId: txn.studentId,
                    bookId: txn.bookId
                });
            }
        }

        // Check Transactions
        const Transaction = mongoose.model('Transaction');
        const transactions = await Transaction.find({});
        for (const txn of transactions) {
            const hasInvalidStudent = txn.student && !validStudentIdStrings.includes(txn.student.toString());
            const hasInvalidBook = txn.book && !validBookIdStrings.includes(txn.book.toString());

            if (hasInvalidStudent || hasInvalidBook) {
                orphans.transactions.push({
                    _id: txn._id,
                    reason: hasInvalidStudent ? 'Invalid student reference' : 'Invalid book reference',
                    studentId: txn.student,
                    bookId: txn.book
                });
            }
        }

        // Check LibraryAuditLogs (only check if references exist)
        const LibraryAuditLog = mongoose.model('LibraryAuditLog');
        const auditLogs = await LibraryAuditLog.find({});
        for (const log of auditLogs) {
            const hasInvalidStudent = log.studentId && !validStudentIdStrings.includes(log.studentId.toString());
            const hasInvalidBook = log.bookId && !validBookIdStrings.includes(log.bookId.toString());

            if (hasInvalidStudent || hasInvalidBook) {
                orphans.auditLogs.push({
                    _id: log._id,
                    reason: hasInvalidStudent ? 'Invalid student reference' : 'Invalid book reference',
                    studentId: log.studentId,
                    bookId: log.bookId,
                    action: log.action
                });
            }
        }

        // Check LibraryFineLedgers
        try {
            const LibraryFineLedger = mongoose.model('LibraryFineLedger');
            const fines = await LibraryFineLedger.find({});
            for (const fine of fines) {
                const hasInvalidStudent = fine.student && !validStudentIdStrings.includes(fine.student.toString());

                if (hasInvalidStudent) {
                    orphans.fineLedgers.push({
                        _id: fine._id,
                        reason: 'Invalid student reference',
                        studentId: fine.student
                    });
                }
            }
        } catch (err) {
            // FineLedger model might not exist, skip
            console.log('LibraryFineLedger model not found, skipping...');
        }

        return orphans;

    } catch (err) {
        console.error('Error detecting orphans:', err);
        throw err;
    }
}

/**
 * Clean up orphaned records
 * @param {Object} options - Cleanup options
 * @param {boolean} options.dryRun - If true, only report what would be deleted
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupOrphans(options = { dryRun: false }) {
    const { dryRun = false } = options;
    const results = {
        deleted: {
            bookReservations: 0,
            borrowTransactions: 0,
            transactions: 0,
            auditLogs: 0,
            fineLedgers: 0
        },
        errors: []
    };

    try {
        const orphans = await detectOrphans();

        // Delete orphaned BookReservations
        if (orphans.bookReservations.length > 0) {
            const ids = orphans.bookReservations.map(o => o._id);
            if (!dryRun) {
                const BookReservation = mongoose.model('BookReservation');
                const deleteResult = await BookReservation.deleteMany({ _id: { $in: ids } });
                results.deleted.bookReservations = deleteResult.deletedCount;
                console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned BookReservations`);
            } else {
                results.deleted.bookReservations = ids.length;
                console.log(`📊 Would delete ${ids.length} orphaned BookReservations`);
            }
        }

        // Delete orphaned BorrowTransactions
        if (orphans.borrowTransactions.length > 0) {
            const ids = orphans.borrowTransactions.map(o => o._id);
            if (!dryRun) {
                const BorrowTransaction = mongoose.model('BorrowTransaction');
                const deleteResult = await BorrowTransaction.deleteMany({ _id: { $in: ids } });
                results.deleted.borrowTransactions = deleteResult.deletedCount;
                console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned BorrowTransactions`);
            } else {
                results.deleted.borrowTransactions = ids.length;
                console.log(`📊 Would delete ${ids.length} orphaned BorrowTransactions`);
            }
        }

        // Delete orphaned Transactions
        if (orphans.transactions.length > 0) {
            const ids = orphans.transactions.map(o => o._id);
            if (!dryRun) {
                const Transaction = mongoose.model('Transaction');
                const deleteResult = await Transaction.deleteMany({ _id: { $in: ids } });
                results.deleted.transactions = deleteResult.deletedCount;
                console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned Transactions`);
            } else {
                results.deleted.transactions = ids.length;
                console.log(`📊 Would delete ${ids.length} orphaned Transactions`);
            }
        }

        // Delete orphaned AuditLogs
        if (orphans.auditLogs.length > 0) {
            const ids = orphans.auditLogs.map(o => o._id);
            if (!dryRun) {
                const LibraryAuditLog = mongoose.model('LibraryAuditLog');
                const deleteResult = await LibraryAuditLog.deleteMany({ _id: { $in: ids } });
                results.deleted.auditLogs = deleteResult.deletedCount;
                console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned AuditLogs`);
            } else {
                results.deleted.auditLogs = ids.length;
                console.log(`📊 Would delete ${ids.length} orphaned AuditLogs`);
            }
        }

        // Delete orphaned FineLedgers
        if (orphans.fineLedgers.length > 0) {
            const ids = orphans.fineLedgers.map(o => o._id);
            if (!dryRun) {
                try {
                    const LibraryFineLedger = mongoose.model('LibraryFineLedger');
                    const deleteResult = await LibraryFineLedger.deleteMany({ _id: { $in: ids } });
                    results.deleted.fineLedgers = deleteResult.deletedCount;
                    console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned FineLedgers`);
                } catch (err) {
                    console.log('LibraryFineLedger model not found, skipping...');
                }
            } else {
                results.deleted.fineLedgers = ids.length;
                console.log(`📊 Would delete ${ids.length} orphaned FineLedgers`);
            }
        }

        return results;

    } catch (err) {
        console.error('Error cleaning up orphans:', err);
        results.errors.push(err.message);
        throw err;
    }
}

/**
 * Validate database integrity
 * @returns {Promise<Object>} Validation report
 */
async function validateIntegrity() {
    const report = {
        timestamp: new Date(),
        status: 'HEALTHY',
        orphanCount: 0,
        orphans: {},
        errors: []
    };

    try {
        const orphans = await detectOrphans();

        // Count total orphans
        report.orphanCount =
            orphans.bookReservations.length +
            orphans.borrowTransactions.length +
            orphans.transactions.length +
            orphans.auditLogs.length +
            orphans.fineLedgers.length;

        report.orphans = orphans;

        if (report.orphanCount > 0) {
            report.status = 'CORRUPTED';
        }

        return report;

    } catch (err) {
        report.status = 'ERROR';
        report.errors.push(err.message);
        return report;
    }
}

/**
 * Generate comprehensive health report
 * @returns {Promise<Object>} Health report with metrics
 */
async function generateHealthReport() {
    const report = {
        timestamp: new Date(),
        collections: {},
        integrity: {},
        summary: {
            totalRecords: 0,
            orphanCount: 0,
            healthScore: 100
        }
    };

    try {
        // Count documents in each collection
        const Student = mongoose.model('Student');
        const Book = mongoose.model('Book');
        const BookReservation = mongoose.model('BookReservation');
        const BorrowTransaction = mongoose.model('BorrowTransaction');
        const Transaction = mongoose.model('Transaction');
        const LibraryAuditLog = mongoose.model('LibraryAuditLog');

        report.collections.students = await Student.countDocuments();
        report.collections.books = await Book.countDocuments();
        report.collections.bookReservations = await BookReservation.countDocuments();
        report.collections.borrowTransactions = await BorrowTransaction.countDocuments();
        report.collections.transactions = await Transaction.countDocuments();
        report.collections.auditLogs = await LibraryAuditLog.countDocuments();

        try {
            const LibraryFineLedger = mongoose.model('LibraryFineLedger');
            report.collections.fineLedgers = await LibraryFineLedger.countDocuments();
        } catch (err) {
            report.collections.fineLedgers = 0;
        }

        // Calculate total records
        report.summary.totalRecords = Object.values(report.collections).reduce((sum, count) => sum + count, 0);

        // Run integrity check
        const integrityReport = await validateIntegrity();
        report.integrity = integrityReport;
        report.summary.orphanCount = integrityReport.orphanCount;

        // Calculate health score (100 - percentage of orphans)
        if (report.summary.totalRecords > 0) {
            const orphanPercentage = (report.summary.orphanCount / report.summary.totalRecords) * 100;
            report.summary.healthScore = Math.max(0, 100 - orphanPercentage);
        }

        return report;

    } catch (err) {
        console.error('Error generating health report:', err);
        throw err;
    }
}

module.exports = {
    detectOrphans,
    cleanupOrphans,
    validateIntegrity,
    generateHealthReport
};
