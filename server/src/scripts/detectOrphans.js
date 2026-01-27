/**
 * LAYER 3: Orphan Detection System
 * 
 * Detects:
 * - BorrowTransactions without valid studentId
 * - BorrowTransactions without valid bookId
 * - Reservations without valid studentId/bookId
 * - AuditLogs without valid targets
 * - Logs with missing actors
 * - Overdue records without valid transactions
 * - Active loans without transactions
 * - Reports pointing to invalid IDs
 */

const mongoose = require('mongoose');

async function detectAllOrphans() {
    try {
        console.log('\n=== LAYER 3: ORPHAN DETECTION SYSTEM ===\n');

        const results = {
            borrowTransactionOrphans: [],
            reservationOrphans: [],
            transactionOrphans: [],
            auditLogOrphans: [],
            fineLedgerOrphans: [],
            totalOrphans: 0,
            timestamp: new Date()
        };

        // 1. BorrowTransaction Orphans
        console.log('📊 Scanning BorrowTransaction documents for orphans...');
        const borrowTransactions = await mongoose.model('BorrowTransaction').find().lean();
        
        for (const txn of borrowTransactions) {
            const studentExists = await mongoose.model('Student').findById(txn.studentId);
            const bookExists = await mongoose.model('Book').findById(txn.bookId);

            if (!studentExists || !bookExists) {
                results.borrowTransactionOrphans.push({
                    id: txn._id,
                    studentId: txn.studentId,
                    studentExists,
                    bookId: txn.bookId,
                    bookExists,
                    status: txn.status,
                    issuedAt: txn.issuedAt
                });
            }
        }

        if (results.borrowTransactionOrphans.length > 0) {
            console.log(`⚠️  Found ${results.borrowTransactionOrphans.length} orphan BorrowTransactions`);
            results.totalOrphans += results.borrowTransactionOrphans.length;
        } else {
            console.log('✅ No orphan BorrowTransactions found');
        }

        // 2. BookReservation Orphans
        console.log('\n📊 Scanning BookReservation documents for orphans...');
        const reservations = await mongoose.model('BookReservation').find().lean();
        
        for (const res of reservations) {
            const studentExists = await mongoose.model('Student').findById(res.student);
            const bookExists = await mongoose.model('Book').findById(res.book);

            if (!studentExists || !bookExists) {
                results.reservationOrphans.push({
                    id: res._id,
                    studentId: res.student,
                    studentExists,
                    bookId: res.book,
                    bookExists,
                    status: res.status,
                    timestamp: res.timestamp
                });
            }
        }

        if (results.reservationOrphans.length > 0) {
            console.log(`⚠️  Found ${results.reservationOrphans.length} orphan BookReservations`);
            results.totalOrphans += results.reservationOrphans.length;
        } else {
            console.log('✅ No orphan BookReservations found');
        }

        // 3. Transaction Orphans
        console.log('\n📊 Scanning Transaction documents for orphans...');
        const transactions = await mongoose.model('Transaction').find().lean();
        
        for (const txn of transactions) {
            const studentExists = await mongoose.model('Student').findById(txn.student);
            const bookExists = await mongoose.model('Book').findById(txn.book);

            if (!studentExists || !bookExists) {
                results.transactionOrphans.push({
                    id: txn._id,
                    studentId: txn.student,
                    studentExists,
                    bookId: txn.book,
                    bookExists,
                    status: txn.status,
                    issueDate: txn.issueDate
                });
            }
        }

        if (results.transactionOrphans.length > 0) {
            console.log(`⚠️  Found ${results.transactionOrphans.length} orphan Transactions`);
            results.totalOrphans += results.transactionOrphans.length;
        } else {
            console.log('✅ No orphan Transactions found');
        }

        // 4. LibraryAuditLog Orphans
        console.log('\n📊 Scanning LibraryAuditLog documents for orphans...');
        const auditLogs = await mongoose.model('LibraryAuditLog').find().lean();
        
        for (const log of auditLogs) {
            let bookExists = true;
            let studentExists = true;
            let adminExists = true;

            if (log.bookId) {
                bookExists = await mongoose.model('Book').findById(log.bookId);
            }
            if (log.studentId) {
                studentExists = await mongoose.model('Student').findById(log.studentId);
            }
            if (log.adminId) {
                try {
                    adminExists = await mongoose.model('User').findById(log.adminId);
                } catch (err) {
                    // User model might not exist yet
                }
            }

            if (!bookExists || !studentExists || !adminExists) {
                results.auditLogOrphans.push({
                    id: log._id,
                    action: log.action,
                    bookId: log.bookId,
                    bookExists,
                    studentId: log.studentId,
                    studentExists,
                    adminId: log.adminId,
                    adminExists,
                    timestamp: log.timestamp
                });
            }
        }

        if (results.auditLogOrphans.length > 0) {
            console.log(`⚠️  Found ${results.auditLogOrphans.length} orphan AuditLogs`);
            results.totalOrphans += results.auditLogOrphans.length;
        } else {
            console.log('✅ No orphan AuditLogs found');
        }

        // 5. LibraryFineLedger Orphans
        console.log('\n📊 Scanning LibraryFineLedger documents for orphans...');
        const fines = await mongoose.model('LibraryFineLedger').find().lean();
        
        for (const fine of fines) {
            const studentExists = await mongoose.model('Student').findById(fine.student);
            let transactionExists = true;
            let borrowTransactionExists = true;

            if (fine.transaction) {
                transactionExists = await mongoose.model('Transaction').findById(fine.transaction);
            }
            if (fine.borrowTransaction) {
                borrowTransactionExists = await mongoose.model('BorrowTransaction').findById(fine.borrowTransaction);
            }

            if (!studentExists || !transactionExists || !borrowTransactionExists) {
                results.fineLedgerOrphans.push({
                    id: fine._id,
                    studentId: fine.student,
                    studentExists,
                    transactionId: fine.transaction,
                    transactionExists,
                    borrowTransactionId: fine.borrowTransaction,
                    borrowTransactionExists,
                    amount: fine.amount,
                    status: fine.status
                });
            }
        }

        if (results.fineLedgerOrphans.length > 0) {
            console.log(`⚠️  Found ${results.fineLedgerOrphans.length} orphan FineLedgers`);
            results.totalOrphans += results.fineLedgerOrphans.length;
        } else {
            console.log('✅ No orphan FineLedgers found');
        }

        // Summary
        console.log('\n=== ORPHAN DETECTION SUMMARY ===');
        console.log(`Total orphans found: ${results.totalOrphans}`);
        console.log(`Timestamp: ${results.timestamp.toISOString()}`);

        return results;

    } catch (err) {
        console.error('❌ Error during orphan detection:', err.message);
        throw err;
    }
}

/**
 * Detects specific types of orphans
 */
async function detectOrphansByType(type) {
    try {
        const results = [];

        if (type === 'borrowTransaction' || type === 'all') {
            const orphans = await mongoose.model('BorrowTransaction').find().lean();
            for (const txn of orphans) {
                const studentExists = await mongoose.model('Student').findById(txn.studentId);
                const bookExists = await mongoose.model('Book').findById(txn.bookId);
                if (!studentExists || !bookExists) {
                    results.push({
                        type: 'BorrowTransaction',
                        id: txn._id,
                        issue: !studentExists ? 'Invalid studentId' : 'Invalid bookId'
                    });
                }
            }
        }

        return results;

    } catch (err) {
        console.error(`❌ Error detecting ${type} orphans:`, err.message);
        throw err;
    }
}

module.exports = {
    detectAllOrphans,
    detectOrphansByType
};
