/**
 * LAYER 4: Orphan Cleanup System
 * 
 * Safely removes orphan records while:
 * - Preserving valid historical data
 * - Logging cleanup actions
 * - Never cascade-deleting valid entities
 * - Never breaking history integrity
 * - Never removing valid transactions
 */

const mongoose = require('mongoose');

async function cleanupAllOrphans(dryRun = true) {
    try {
        console.log(`\n=== LAYER 4: ORPHAN CLEANUP SYSTEM (DRY RUN: ${dryRun ? 'YES' : 'NO'}) ===\n`);

        const results = {
            deleted: {
                borrowTransactions: 0,
                reservations: 0,
                transactions: 0,
                auditLogs: 0,
                fineLedgers: 0
            },
            preserved: {
                borrowTransactions: 0,
                reservations: 0,
                transactions: 0,
                auditLogs: 0,
                fineLedgers: 0
            },
            errors: [],
            timestamp: new Date(),
            dryRun
        };

        // 1. Cleanup BorrowTransaction Orphans
        console.log('🧹 Cleaning BorrowTransaction orphans...');
        try {
            const borrowTransactions = await mongoose.model('BorrowTransaction').find().lean();
            for (const txn of borrowTransactions) {
                const studentExists = await mongoose.model('Student').findById(txn.studentId);
                const bookExists = await mongoose.model('Book').findById(txn.bookId);

                if (!studentExists || !bookExists) {
                    if (!dryRun) {
                        await mongoose.model('BorrowTransaction').findByIdAndDelete(txn._id);
                    }
                    results.deleted.borrowTransactions++;
                    console.log(`  ❌ Would delete BorrowTransaction ${txn._id}: ${!studentExists ? 'Invalid student' : 'Invalid book'}`);
                } else {
                    results.preserved.borrowTransactions++;
                }
            }
        } catch (err) {
            results.errors.push(`BorrowTransaction cleanup failed: ${err.message}`);
            console.error(`  ❌ Error: ${err.message}`);
        }

        // 2. Cleanup BookReservation Orphans
        console.log('\n🧹 Cleaning BookReservation orphans...');
        try {
            const reservations = await mongoose.model('BookReservation').find().lean();
            for (const res of reservations) {
                const studentExists = await mongoose.model('Student').findById(res.student);
                const bookExists = await mongoose.model('Book').findById(res.book);

                if (!studentExists || !bookExists) {
                    if (!dryRun) {
                        await mongoose.model('BookReservation').findByIdAndDelete(res._id);
                    }
                    results.deleted.reservations++;
                    console.log(`  ❌ Would delete BookReservation ${res._id}: ${!studentExists ? 'Invalid student' : 'Invalid book'}`);
                } else {
                    results.preserved.reservations++;
                }
            }
        } catch (err) {
            results.errors.push(`BookReservation cleanup failed: ${err.message}`);
            console.error(`  ❌ Error: ${err.message}`);
        }

        // 3. Cleanup Transaction Orphans
        console.log('\n🧹 Cleaning Transaction orphans...');
        try {
            const transactions = await mongoose.model('Transaction').find().lean();
            for (const txn of transactions) {
                const studentExists = await mongoose.model('Student').findById(txn.student);
                const bookExists = await mongoose.model('Book').findById(txn.book);

                if (!studentExists || !bookExists) {
                    if (!dryRun) {
                        await mongoose.model('Transaction').findByIdAndDelete(txn._id);
                    }
                    results.deleted.transactions++;
                    console.log(`  ❌ Would delete Transaction ${txn._id}: ${!studentExists ? 'Invalid student' : 'Invalid book'}`);
                } else {
                    results.preserved.transactions++;
                }
            }
        } catch (err) {
            results.errors.push(`Transaction cleanup failed: ${err.message}`);
            console.error(`  ❌ Error: ${err.message}`);
        }

        // 4. Cleanup LibraryAuditLog Orphans (Only if ALL references are broken)
        console.log('\n🧹 Cleaning LibraryAuditLog orphans...');
        try {
            const auditLogs = await mongoose.model('LibraryAuditLog').find().lean();
            for (const log of auditLogs) {
                let hasValidReference = true;

                if (log.bookId) {
                    const bookExists = await mongoose.model('Book').findById(log.bookId);
                    if (!bookExists) hasValidReference = false;
                }
                if (log.studentId) {
                    const studentExists = await mongoose.model('Student').findById(log.studentId);
                    if (!studentExists) hasValidReference = false;
                }

                // Don't delete if adminId is missing (User model might not exist)
                // Only delete if it has broken references to Books/Students

                if (!hasValidReference && !log.bookId && !log.studentId) {
                    // Only delete if completely unreferenced
                    if (!dryRun) {
                        await mongoose.model('LibraryAuditLog').findByIdAndDelete(log._id);
                    }
                    results.deleted.auditLogs++;
                    console.log(`  ❌ Would delete AuditLog ${log._id}: No valid references`);
                } else {
                    results.preserved.auditLogs++;
                }
            }
        } catch (err) {
            results.errors.push(`LibraryAuditLog cleanup failed: ${err.message}`);
            console.error(`  ❌ Error: ${err.message}`);
        }

        // 5. Cleanup LibraryFineLedger Orphans
        console.log('\n🧹 Cleaning LibraryFineLedger orphans...');
        try {
            const fines = await mongoose.model('LibraryFineLedger').find().lean();
            for (const fine of fines) {
                const studentExists = await mongoose.model('Student').findById(fine.student);

                if (!studentExists) {
                    // Only delete if student reference is broken
                    if (!dryRun) {
                        await mongoose.model('LibraryFineLedger').findByIdAndDelete(fine._id);
                    }
                    results.deleted.fineLedgers++;
                    console.log(`  ❌ Would delete FineLedger ${fine._id}: Invalid student`);
                } else {
                    results.preserved.fineLedgers++;
                }
            }
        } catch (err) {
            results.errors.push(`LibraryFineLedger cleanup failed: ${err.message}`);
            console.error(`  ❌ Error: ${err.message}`);
        }

        // Summary
        console.log('\n=== CLEANUP SUMMARY ===');
        console.log(`Deleted: ${Object.values(results.deleted).reduce((a, b) => a + b, 0)}`);
        console.log(`Preserved: ${Object.values(results.preserved).reduce((a, b) => a + b, 0)}`);
        console.log(`Errors: ${results.errors.length}`);
        console.log(`Dry Run: ${results.dryRun}`);

        return results;

    } catch (err) {
        console.error('❌ Error during orphan cleanup:', err.message);
        throw err;
    }
}

/**
 * Run cleanup in dry-run mode (no deletions, just reporting)
 */
async function cleanupDryRun() {
    return cleanupAllOrphans(true);
}

/**
 * Run cleanup in live mode (actual deletions)
 */
async function cleanupLive() {
    console.log('🚨 RUNNING CLEANUP IN LIVE MODE - ORPHANS WILL BE DELETED 🚨');
    return cleanupAllOrphans(false);
}

module.exports = {
    cleanupAllOrphans,
    cleanupDryRun,
    cleanupLive
};
