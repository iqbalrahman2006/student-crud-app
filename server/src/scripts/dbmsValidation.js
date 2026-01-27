/**
 * LAYER 10: DBMS Validation Tooling
 * 
 * Creates:
 * 1. Integrity Validator Script - Full DB scan
 * 2. Consistency Auditor - Inventory vs transactions
 * 3. Health Report Generator - DB state report
 */

const mongoose = require('mongoose');

/**
 * TOOL 1: Integrity Validator
 * Performs full database scan for referential integrity
 */
async function validateIntegrity() {
    try {
        console.log('\n=== INTEGRITY VALIDATOR ===\n');

        const report = {
            timestamp: new Date(),
            checks: {
                studentCount: 0,
                bookCount: 0,
                borrowTransactionCount: 0,
                reservationCount: 0,
                transactionCount: 0,
                auditLogCount: 0,
                fineLedgerCount: 0
            },
            validReferences: {
                borrowTransactions: 0,
                reservations: 0,
                transactions: 0,
                auditLogs: 0,
                fineLedgers: 0
            },
            brokenReferences: {
                borrowTransactions: 0,
                reservations: 0,
                transactions: 0,
                auditLogs: 0,
                fineLedgers: 0
            },
            issues: []
        };

        // Count documents
        report.checks.studentCount = await mongoose.model('Student').countDocuments();
        report.checks.bookCount = await mongoose.model('Book').countDocuments();
        report.checks.borrowTransactionCount = await mongoose.model('BorrowTransaction').countDocuments();
        report.checks.reservationCount = await mongoose.model('BookReservation').countDocuments();
        report.checks.transactionCount = await mongoose.model('Transaction').countDocuments();
        report.checks.auditLogCount = await mongoose.model('LibraryAuditLog').countDocuments();
        report.checks.fineLedgerCount = await mongoose.model('LibraryFineLedger').countDocuments();

        console.log('📊 Document Counts:');
        console.log(`  Students: ${report.checks.studentCount}`);
        console.log(`  Books: ${report.checks.bookCount}`);
        console.log(`  BorrowTransactions: ${report.checks.borrowTransactionCount}`);
        console.log(`  BookReservations: ${report.checks.reservationCount}`);
        console.log(`  Transactions: ${report.checks.transactionCount}`);
        console.log(`  AuditLogs: ${report.checks.auditLogCount}`);
        console.log(`  FineLedgers: ${report.checks.fineLedgerCount}`);

        // Validate BorrowTransactions
        console.log('\n🔍 Validating BorrowTransactions...');
        const borrowTransactions = await mongoose.model('BorrowTransaction').find().lean();
        for (const txn of borrowTransactions) {
            const studentExists = await mongoose.model('Student').findById(txn.studentId);
            const bookExists = await mongoose.model('Book').findById(txn.bookId);

            if (studentExists && bookExists) {
                report.validReferences.borrowTransactions++;
            } else {
                report.brokenReferences.borrowTransactions++;
                report.issues.push(`❌ BorrowTransaction ${txn._id}: ${!studentExists ? 'Invalid student' : 'Invalid book'}`);
            }
        }
        console.log(`  Valid: ${report.validReferences.borrowTransactions}`);
        console.log(`  Broken: ${report.brokenReferences.borrowTransactions}`);

        // Validate BookReservations
        console.log('\n🔍 Validating BookReservations...');
        const reservations = await mongoose.model('BookReservation').find().lean();
        for (const res of reservations) {
            const studentExists = await mongoose.model('Student').findById(res.student);
            const bookExists = await mongoose.model('Book').findById(res.book);

            if (studentExists && bookExists) {
                report.validReferences.reservations++;
            } else {
                report.brokenReferences.reservations++;
                report.issues.push(`❌ BookReservation ${res._id}: ${!studentExists ? 'Invalid student' : 'Invalid book'}`);
            }
        }
        console.log(`  Valid: ${report.validReferences.reservations}`);
        console.log(`  Broken: ${report.brokenReferences.reservations}`);

        // Validate Transactions
        console.log('\n🔍 Validating Transactions...');
        const transactions = await mongoose.model('Transaction').find().lean();
        for (const txn of transactions) {
            const studentExists = await mongoose.model('Student').findById(txn.student);
            const bookExists = await mongoose.model('Book').findById(txn.book);

            if (studentExists && bookExists) {
                report.validReferences.transactions++;
            } else {
                report.brokenReferences.transactions++;
                report.issues.push(`❌ Transaction ${txn._id}: ${!studentExists ? 'Invalid student' : 'Invalid book'}`);
            }
        }
        console.log(`  Valid: ${report.validReferences.transactions}`);
        console.log(`  Broken: ${report.brokenReferences.transactions}`);

        // Validate AuditLogs
        console.log('\n🔍 Validating LibraryAuditLogs...');
        const auditLogs = await mongoose.model('LibraryAuditLog').find().lean();
        for (const log of auditLogs) {
            let isValid = true;
            if (log.bookId) {
                const bookExists = await mongoose.model('Book').findById(log.bookId);
                if (!bookExists) isValid = false;
            }
            if (log.studentId) {
                const studentExists = await mongoose.model('Student').findById(log.studentId);
                if (!studentExists) isValid = false;
            }

            if (isValid) {
                report.validReferences.auditLogs++;
            } else {
                report.brokenReferences.auditLogs++;
                report.issues.push(`⚠️  AuditLog ${log._id}: Broken reference`);
            }
        }
        console.log(`  Valid: ${report.validReferences.auditLogs}`);
        console.log(`  Broken: ${report.brokenReferences.auditLogs}`);

        // Validate FineLedgers
        console.log('\n🔍 Validating FineLedgers...');
        const fines = await mongoose.model('LibraryFineLedger').find().lean();
        for (const fine of fines) {
            const studentExists = await mongoose.model('Student').findById(fine.student);
            if (studentExists) {
                report.validReferences.fineLedgers++;
            } else {
                report.brokenReferences.fineLedgers++;
                report.issues.push(`❌ FineLedger ${fine._id}: Invalid student`);
            }
        }
        console.log(`  Valid: ${report.validReferences.fineLedgers}`);
        console.log(`  Broken: ${report.brokenReferences.fineLedgers}`);

        // Summary
        const totalIssues = Object.values(report.brokenReferences).reduce((a, b) => a + b, 0);
        console.log(`\n=== INTEGRITY VALIDATION COMPLETE ===`);
        console.log(`Total Issues Found: ${totalIssues}`);
        if (totalIssues === 0) {
            console.log('✅ DATABASE IS INTEGRITY CLEAN');
        } else {
            console.log('❌ DATABASE HAS INTEGRITY ISSUES');
        }

        return report;

    } catch (err) {
        console.error('❌ Error during integrity validation:', err.message);
        throw err;
    }
}

/**
 * TOOL 2: Consistency Auditor
 * Checks data consistency across related collections
 */
async function auditConsistency() {
    try {
        console.log('\n=== CONSISTENCY AUDITOR ===\n');

        const report = {
            timestamp: new Date(),
            checks: {},
            issues: []
        };

        // Check 1: Book inventory consistency
        console.log('📊 Checking Book Inventory Consistency...');
        const books = await mongoose.model('Book').find().lean();
        for (const book of books) {
            const calculatedAvailable = book.totalCopies - book.checkedOutCount;
            if (book.availableCopies !== calculatedAvailable) {
                report.issues.push(`⚠️  Book ${book._id}: Available copies inconsistent (recorded: ${book.availableCopies}, calculated: ${calculatedAvailable})`);
            }
        }
        report.checks.bookInventory = books.length;
        console.log(`  Books checked: ${books.length}`);

        // Check 2: Transaction status consistency
        console.log('\n📊 Checking Transaction Status Consistency...');
        const transactions = await mongoose.model('Transaction').find().lean();
        for (const txn of transactions) {
            if (txn.status === 'Returned' && !txn.returnDate) {
                report.issues.push(`⚠️  Transaction ${txn._id}: Returned status but no returnDate`);
            }
            if ((txn.status === 'Issued' || txn.status === 'Overdue') && txn.returnDate) {
                report.issues.push(`⚠️  Transaction ${txn._id}: ${txn.status} status but has returnDate`);
            }
        }
        report.checks.transactionStatus = transactions.length;
        console.log(`  Transactions checked: ${transactions.length}`);

        // Check 3: BorrowTransaction status consistency
        console.log('\n📊 Checking BorrowTransaction Status Consistency...');
        const borrowTxns = await mongoose.model('BorrowTransaction').find().lean();
        for (const txn of borrowTxns) {
            if (txn.status === 'RETURNED' && !txn.returnedAt) {
                report.issues.push(`⚠️  BorrowTransaction ${txn._id}: RETURNED status but no returnedAt`);
            }
            if ((txn.status === 'BORROWED' || txn.status === 'OVERDUE') && txn.returnedAt) {
                report.issues.push(`⚠️  BorrowTransaction ${txn._id}: ${txn.status} status but has returnedAt`);
            }
        }
        report.checks.borrowTransactionStatus = borrowTxns.length;
        console.log(`  BorrowTransactions checked: ${borrowTxns.length}`);

        // Check 4: Fine ledger consistency
        console.log('\n📊 Checking FineLedger Consistency...');
        const fines = await mongoose.model('LibraryFineLedger').find().lean();
        for (const fine of fines) {
            if (fine.status === 'Paid' && !fine.paidDate) {
                report.issues.push(`⚠️  FineLedger ${fine._id}: Paid status but no paidDate`);
            }
            if (fine.amount <= 0) {
                report.issues.push(`⚠️  FineLedger ${fine._id}: Invalid amount: ${fine.amount}`);
            }
        }
        report.checks.fineLedger = fines.length;
        console.log(`  FineLedgers checked: ${fines.length}`);

        // Summary
        console.log(`\n=== CONSISTENCY AUDIT COMPLETE ===`);
        console.log(`Consistency Issues Found: ${report.issues.length}`);
        if (report.issues.length === 0) {
            console.log('✅ DATABASE IS CONSISTENT');
        } else {
            console.log('⚠️  DATABASE HAS CONSISTENCY ISSUES');
            report.issues.slice(0, 10).forEach(issue => console.log(`  ${issue}`));
            if (report.issues.length > 10) {
                console.log(`  ... and ${report.issues.length - 10} more issues`);
            }
        }

        return report;

    } catch (err) {
        console.error('❌ Error during consistency audit:', err.message);
        throw err;
    }
}

/**
 * TOOL 3: Health Report Generator
 * Generates comprehensive DB health report
 */
async function generateHealthReport() {
    try {
        console.log('\n=== HEALTH REPORT GENERATOR ===\n');

        const integrityReport = await validateIntegrity();
        const consistencyReport = await auditConsistency();

        const healthReport = {
            timestamp: new Date(),
            integrityScore: 100,
            consistencyScore: 100,
            overallHealth: 'HEALTHY',
            integrityReport,
            consistencyReport,
            recommendations: []
        };

        // Calculate integrity score
        const totalBrokenReferences = Object.values(integrityReport.brokenReferences).reduce((a, b) => a + b, 0);
        const totalReferences = Object.values(integrityReport.validReferences).reduce((a, b) => a + b, 0);
        healthReport.integrityScore = totalReferences > 0 ? Math.floor((totalReferences / (totalReferences + totalBrokenReferences)) * 100) : 100;

        // Calculate consistency score
        healthReport.consistencyScore = Math.max(0, 100 - (consistencyReport.issues.length * 5));

        // Overall health
        const avgScore = (healthReport.integrityScore + healthReport.consistencyScore) / 2;
        if (avgScore >= 95) {
            healthReport.overallHealth = 'HEALTHY';
        } else if (avgScore >= 80) {
            healthReport.overallHealth = 'DEGRADED';
            healthReport.recommendations.push('Database has minor issues. Consider running cleanup.');
        } else if (avgScore >= 60) {
            healthReport.overallHealth = 'COMPROMISED';
            healthReport.recommendations.push('Database has significant issues. Run cleanup immediately.');
        } else {
            healthReport.overallHealth = 'CRITICAL';
            healthReport.recommendations.push('Database integrity is critical. Run cleanup and reseed if necessary.');
        }

        // Print report
        console.log('\n=== HEALTH REPORT ===');
        console.log(`Overall Health: ${healthReport.overallHealth}`);
        console.log(`Integrity Score: ${healthReport.integrityScore}%`);
        console.log(`Consistency Score: ${healthReport.consistencyScore}%`);
        
        if (healthReport.recommendations.length > 0) {
            console.log('\nRecommendations:');
            healthReport.recommendations.forEach(rec => console.log(`  - ${rec}`));
        }

        return healthReport;

    } catch (err) {
        console.error('❌ Error generating health report:', err.message);
        throw err;
    }
}

module.exports = {
    validateIntegrity,
    auditConsistency,
    generateHealthReport
};
