#!/usr/bin/env node
/**
 * LAYER 4: Orphan Cleanup Script
 * 
 * Standalone script to remove orphaned records from the database.
 * This script will DELETE invalid records that reference non-existent entities.
 * 
 * Usage:
 *   node scripts/orphan-cleanup.js           # Dry run (shows what would be deleted)
 *   node scripts/orphan-cleanup.js --execute # Actually delete orphans
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dbIntegrityService = require('../src/services/dbIntegrityService');

// Load models
require('../src/models/Student');
require('../src/models/Book');
require('../src/models/BookReservation');
require('../src/models/BorrowTransaction');
require('../src/models/Transaction');
require('../src/models/LibraryAuditLog');
require('../src/models/LibraryFineLedger');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';

async function cleanupOrphans() {
    try {
        // Check for --execute flag
        const executeMode = process.argv.includes('--execute');
        const dryRun = !executeMode;

        console.log('\n=== ORPHAN CLEANUP ===\n');
        console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'EXECUTE (orphans will be deleted)'}\n`);

        if (dryRun) {
            console.log('⚠️  This is a DRY RUN. No data will be deleted.');
            console.log('   To actually delete orphans, run: node scripts/orphan-cleanup.js --execute\n');
        } else {
            console.log('⚠️  WARNING: This will DELETE orphaned records from the database!');
            console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('Running cleanup...\n');
        const results = await dbIntegrityService.cleanupOrphans({ dryRun });

        // Display results
        console.log('\n=== CLEANUP RESULTS ===\n');

        const totalDeleted = Object.values(results.deleted).reduce((sum, count) => sum + count, 0);

        if (results.deleted.bookReservations > 0) {
            console.log(`${dryRun ? '📊' : '✅'} BookReservations: ${results.deleted.bookReservations} ${dryRun ? 'would be' : ''} deleted`);
        }

        if (results.deleted.borrowTransactions > 0) {
            console.log(`${dryRun ? '📊' : '✅'} BorrowTransactions: ${results.deleted.borrowTransactions} ${dryRun ? 'would be' : ''} deleted`);
        }

        if (results.deleted.transactions > 0) {
            console.log(`${dryRun ? '📊' : '✅'} Transactions: ${results.deleted.transactions} ${dryRun ? 'would be' : ''} deleted`);
        }

        if (results.deleted.auditLogs > 0) {
            console.log(`${dryRun ? '📊' : '✅'} AuditLogs: ${results.deleted.auditLogs} ${dryRun ? 'would be' : ''} deleted`);
        }

        if (results.deleted.fineLedgers > 0) {
            console.log(`${dryRun ? '📊' : '✅'} FineLedgers: ${results.deleted.fineLedgers} ${dryRun ? 'would be' : ''} deleted`);
        }

        console.log('\n=== SUMMARY ===');
        console.log(`Total Records ${dryRun ? 'That Would Be' : ''} Deleted: ${totalDeleted}`);

        if (results.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            results.errors.forEach(err => console.log(`   - ${err}`));
        }

        if (dryRun && totalDeleted > 0) {
            console.log('\n💡 To actually delete these orphans, run:');
            console.log('   node scripts/orphan-cleanup.js --execute');
        } else if (!dryRun && totalDeleted > 0) {
            console.log('\n✅ Cleanup completed successfully!');
        } else {
            console.log('\n✅ No orphans found - database is clean!');
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error during cleanup:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

cleanupOrphans();
