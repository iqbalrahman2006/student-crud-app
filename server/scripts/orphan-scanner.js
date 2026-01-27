#!/usr/bin/env node
/**
 * LAYER 4: Orphan Scanner Script
 * 
 * Standalone script to scan the database for orphaned records.
 * Run this to detect data integrity issues without making any changes.
 * 
 * Usage:
 *   node scripts/orphan-scanner.js
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

async function scanForOrphans() {
    try {
        console.log('\n=== ORPHAN SCANNER ===\n');
        console.log('Connecting to MongoDB...');

        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('Scanning for orphaned records...\n');
        const orphans = await dbIntegrityService.detectOrphans();

        // Display results
        console.log('=== SCAN RESULTS ===\n');

        let totalOrphans = 0;

        if (orphans.bookReservations.length > 0) {
            console.log(`❌ BookReservations: ${orphans.bookReservations.length} orphans`);
            orphans.bookReservations.forEach(o => {
                console.log(`   - ID: ${o._id}, Reason: ${o.reason}`);
            });
            totalOrphans += orphans.bookReservations.length;
        } else {
            console.log('✅ BookReservations: No orphans');
        }

        if (orphans.borrowTransactions.length > 0) {
            console.log(`❌ BorrowTransactions: ${orphans.borrowTransactions.length} orphans`);
            orphans.borrowTransactions.forEach(o => {
                console.log(`   - ID: ${o._id}, Reason: ${o.reason}`);
            });
            totalOrphans += orphans.borrowTransactions.length;
        } else {
            console.log('✅ BorrowTransactions: No orphans');
        }

        if (orphans.transactions.length > 0) {
            console.log(`❌ Transactions: ${orphans.transactions.length} orphans`);
            orphans.transactions.forEach(o => {
                console.log(`   - ID: ${o._id}, Reason: ${o.reason}`);
            });
            totalOrphans += orphans.transactions.length;
        } else {
            console.log('✅ Transactions: No orphans');
        }

        if (orphans.auditLogs.length > 0) {
            console.log(`❌ AuditLogs: ${orphans.auditLogs.length} orphans`);
            orphans.auditLogs.forEach(o => {
                console.log(`   - ID: ${o._id}, Action: ${o.action}, Reason: ${o.reason}`);
            });
            totalOrphans += orphans.auditLogs.length;
        } else {
            console.log('✅ AuditLogs: No orphans');
        }

        if (orphans.fineLedgers.length > 0) {
            console.log(`❌ FineLedgers: ${orphans.fineLedgers.length} orphans`);
            orphans.fineLedgers.forEach(o => {
                console.log(`   - ID: ${o._id}, Reason: ${o.reason}`);
            });
            totalOrphans += orphans.fineLedgers.length;
        } else {
            console.log('✅ FineLedgers: No orphans');
        }

        console.log('\n=== SUMMARY ===');
        console.log(`Total Orphans Found: ${totalOrphans}`);

        if (totalOrphans > 0) {
            console.log('\n⚠️  Database has integrity issues!');
            console.log('Run orphan-cleanup.js to remove orphaned records.');
        } else {
            console.log('\n✅ Database integrity is healthy!');
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(totalOrphans > 0 ? 1 : 0);

    } catch (err) {
        console.error('❌ Error during scan:', err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

scanForOrphans();
