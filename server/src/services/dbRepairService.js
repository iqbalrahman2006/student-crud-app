/**
 * LAYER 5: DBMS REPAIR SERVICE
 * Automatic orphan detection and removal
 * Runs on: server boot, reseed, nightly cron
 */

const mongoose = require('mongoose');

// Lazy load models to avoid circular dependencies
const getModels = () => ({
    Student: mongoose.model('Student'),
    Book: mongoose.model('Book'),
    BookReservation: mongoose.model('BookReservation'),
    BorrowTransaction: mongoose.model('BorrowTransaction'),
    Transaction: mongoose.model('Transaction'),
    LibraryAuditLog: mongoose.model('LibraryAuditLog'),
    LibraryFineLedger: mongoose.model('LibraryFineLedger')
});

/**
 * Clean orphan reservations (missing student or book)
 */
async function cleanOrphanReservations() {
    try {
        const { Student, Book, BookReservation } = getModels();
        
        // Get all valid student and book IDs
        const validStudents = await Student.distinct('_id');
        const validBooks = await Book.distinct('_id');
        
        // Find and delete reservations with invalid references
        const orphanReservations = await BookReservation.deleteMany({
            $or: [
                { student: { $nin: validStudents } },
                { book: { $nin: validBooks } }
            ]
        });
        
        if (orphanReservations.deletedCount > 0) {
            console.log(`✅ Cleaned ${orphanReservations.deletedCount} orphan reservations`);
        }
        
        return orphanReservations.deletedCount;
    } catch (err) {
        console.error('❌ Error cleaning orphan reservations:', err.message);
        return 0;
    }
}

/**
 * Clean orphan borrow transactions (missing student or book)
 */
async function cleanOrphanBorrowTransactions() {
    try {
        const { Student, Book, BorrowTransaction } = getModels();
        
        const validStudents = await Student.distinct('_id');
        const validBooks = await Book.distinct('_id');
        
        const orphanTransactions = await BorrowTransaction.deleteMany({
            $or: [
                { studentId: { $nin: validStudents } },
                { bookId: { $nin: validBooks } }
            ]
        });
        
        if (orphanTransactions.deletedCount > 0) {
            console.log(`✅ Cleaned ${orphanTransactions.deletedCount} orphan borrow transactions`);
        }
        
        return orphanTransactions.deletedCount;
    } catch (err) {
        console.error('❌ Error cleaning orphan borrow transactions:', err.message);
        return 0;
    }
}

/**
 * Clean orphan transactions (missing student or book)
 */
async function cleanOrphanTransactions() {
    try {
        const { Student, Book, Transaction } = getModels();
        
        const validStudents = await Student.distinct('_id');
        const validBooks = await Book.distinct('_id');
        
        const orphanTransactions = await Transaction.deleteMany({
            $or: [
                { student: { $nin: validStudents } },
                { book: { $nin: validBooks } }
            ]
        });
        
        if (orphanTransactions.deletedCount > 0) {
            console.log(`✅ Cleaned ${orphanTransactions.deletedCount} orphan transactions`);
        }
        
        return orphanTransactions.deletedCount;
    } catch (err) {
        console.error('❌ Error cleaning orphan transactions:', err.message);
        return 0;
    }
}

/**
 * Clean orphan audit logs (invalid actor references)
 */
async function cleanOrphanAuditLogs() {
    try {
        const { Student, LibraryAuditLog } = getModels();
        
        const validStudents = await Student.distinct('_id');
        
        // Only clean if studentId is provided but invalid
        // Don't delete logs where studentId is null (system logs are valid)
        const orphanLogs = await LibraryAuditLog.deleteMany({
            studentId: {
                $ne: null,
                $nin: validStudents
            }
        });
        
        if (orphanLogs.deletedCount > 0) {
            console.log(`✅ Cleaned ${orphanLogs.deletedCount} orphan audit logs`);
        }
        
        return orphanLogs.deletedCount;
    } catch (err) {
        console.error('❌ Error cleaning orphan audit logs:', err.message);
        return 0;
    }
}

/**
 * Clean orphan fine ledgers (missing student)
 */
async function cleanOrphanFineLedgers() {
    try {
        const { Student, LibraryFineLedger } = getModels();
        
        const validStudents = await Student.distinct('_id');
        
        const orphanLedgers = await LibraryFineLedger.deleteMany({
            student: { $nin: validStudents }
        });
        
        if (orphanLedgers.deletedCount > 0) {
            console.log(`✅ Cleaned ${orphanLedgers.deletedCount} orphan fine ledgers`);
        }
        
        return orphanLedgers.deletedCount;
    } catch (err) {
        console.error('❌ Error cleaning orphan fine ledgers:', err.message);
        return 0;
    }
}

/**
 * Run full DBMS repair
 */
async function runFullRepair() {
    try {
        console.log('🔧 Starting DBMS Repair Service...');
        
        const results = {
            reservations: await cleanOrphanReservations(),
            borrowTransactions: await cleanOrphanBorrowTransactions(),
            transactions: await cleanOrphanTransactions(),
            auditLogs: await cleanOrphanAuditLogs(),
            fineLedgers: await cleanOrphanFineLedgers()
        };
        
        const totalOrphans = Object.values(results).reduce((a, b) => a + b, 0);
        
        if (totalOrphans === 0) {
            console.log('✅ DBMS is clean - no orphan records found');
        } else {
            console.log(`⚠️  DBMS repaired - removed ${totalOrphans} total orphan records`);
        }
        
        return results;
    } catch (err) {
        console.error('❌ DBMS Repair failed:', err.message);
        throw err;
    }
}

/**
 * Validate DBMS integrity (count check only, non-destructive)
 */
async function validateIntegrity() {
    try {
        const { Student, Book, BookReservation, BorrowTransaction, Transaction, LibraryAuditLog, LibraryFineLedger } = getModels();
        
        const validStudents = await Student.distinct('_id');
        const validBooks = await Book.distinct('_id');
        
        const results = {
            orphanReservations: await BookReservation.countDocuments({
                $or: [
                    { student: { $nin: validStudents } },
                    { book: { $nin: validBooks } }
                ]
            }),
            orphanBorrowTransactions: await BorrowTransaction.countDocuments({
                $or: [
                    { studentId: { $nin: validStudents } },
                    { bookId: { $nin: validBooks } }
                ]
            }),
            orphanTransactions: await Transaction.countDocuments({
                $or: [
                    { student: { $nin: validStudents } },
                    { book: { $nin: validBooks } }
                ]
            }),
            orphanAuditLogs: await LibraryAuditLog.countDocuments({
                studentId: {
                    $ne: null,
                    $nin: validStudents
                }
            }),
            orphanFineLedgers: await LibraryFineLedger.countDocuments({
                student: { $nin: validStudents }
            })
        };
        
        return results;
    } catch (err) {
        console.error('❌ DBMS validation failed:', err.message);
        throw err;
    }
}

module.exports = {
    runFullRepair,
    validateIntegrity,
    cleanOrphanReservations,
    cleanOrphanBorrowTransactions,
    cleanOrphanTransactions,
    cleanOrphanAuditLogs,
    cleanOrphanFineLedgers
};
