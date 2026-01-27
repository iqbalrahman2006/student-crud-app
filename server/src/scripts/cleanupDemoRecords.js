#!/usr/bin/env node

/**
 * LAYER 4: ORPHAN CLEANUP - Remove Demo Records
 * Safely deletes records with demo flag or missing references
 */

const mongoose = require('mongoose');
const Student = require('../models/Student');
const Book = require('../models/Book');
const BorrowTransaction = require('../models/BorrowTransaction');
const BookReservation = require('../models/BookReservation');
const LibraryAuditLog = require('../models/LibraryAuditLog');
const LibraryFineLedger = require('../models/LibraryFineLedger');

async function cleanupDemo() {
    try {
        console.log('🧹 Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/studentDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected');

        // Delete all demo reservations (old test data with demo flag)
        const deletedDemo = await BookReservation.deleteMany({ demo: { $exists: true } });
        console.log(`🗑️  Deleted demo reservations: ${deletedDemo.deletedCount}`);

        // Verify no orphans remain
        const orphanReservations = await BookReservation.find()
            .lean()
            .exec();

        console.log(`📊 Total reservations remaining: ${orphanReservations.length}`);

        // Find any without valid student/book
        let orphanCount = 0;
        for (const res of orphanReservations) {
            const studentExists = await Student.exists({ _id: res.student });
            const bookExists = await Book.exists({ _id: res.book });
            if (!studentExists || !bookExists) {
                orphanCount++;
                console.log(`⚠️  Orphan found: Reservation ${res._id}, Student: ${res.student}, Book: ${res.book}`);
            }
        }

        if (orphanCount > 0) {
            console.log(`\n❌ WARNING: Found ${orphanCount} orphan reservations`);
        } else {
            console.log('\n✅ All reservations have valid references!');
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected');
        process.exit(0);
    } catch (err) {
        console.error('❌ ERROR:', err.message);
        process.exit(1);
    }
}

cleanupDemo();
