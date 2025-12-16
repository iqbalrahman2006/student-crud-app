const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const BookReservation = require('../models/BookReservation');
const LibraryAuditLog = require('../models/LibraryAuditLog');
const Transaction = require('../models/BorrowTransaction');
// Register referenced models
require('../models/Student');
require('../models/Book');

const cleanData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Cleanup");

        // 1. Remove Reservations with Unknown Students
        // (Iterate and check populate to catch broken references)
        const reservations = await BookReservation.find().populate('student');
        let deletedReservations = 0;
        for (const res of reservations) {
            if (!res.student) {
                // Orphan
                await BookReservation.findByIdAndDelete(res._id);
                deletedReservations++;
            }
        }
        console.log(`Deleted ${deletedReservations} orphan reservations.`);

        // 2. Clear Audit Logs Older than Dec 1st, 2025
        const cutoffDate = new Date('2025-12-01T00:00:00.000Z');
        const deleteLogRes = await LibraryAuditLog.deleteMany({
            timestamp: { $lt: cutoffDate }
        });
        console.log(`Deleted ${deleteLogRes.deletedCount} old audit logs (Pre-Dec 1, 2025).`);

        // 3. Remove Orphan Transactions (Fixes Reminder Error)
        // Schema uses 'studentId' or 'student'? Need to match schema.
        // Assuming studentId based on error.
        const transactions = await Transaction.find().populate('studentId');
        let deletedTxns = 0;
        for (const txn of transactions) {
            if (!txn.studentId) {
                await Transaction.findByIdAndDelete(txn._id);
                deletedTxns++;
            }
        }
        console.log(`Deleted ${deletedTxns} orphan transactions.`);

        console.log("Cleanup Complete.");
        process.exit(0);
    } catch (e) {
        console.error("Cleanup Failed", e);
        process.exit(1);
    }
};

cleanData();
