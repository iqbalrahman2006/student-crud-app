/**
 * REAL DATA EXTRACTOR FOR DBMS DOCUMENTATION
 * Extracts actual data from MongoDB for documentation purposes
 */

const mongoose = require('./server/node_modules/mongoose');
const fs = require('fs');
const path = require('path');

// Import models
const Student = require('./server/src/models/Student');
const Book = require('./server/src/models/Book');
const BorrowTransaction = require('./server/src/models/BorrowTransaction');
const BookReservation = require('./server/src/models/BookReservation');
const LibraryAuditLog = require('./server/src/models/LibraryAuditLog');
const LibraryFineLedger = require('./server/src/models/LibraryFineLedger');
const Transaction = require('./server/src/models/Transaction');
const User = require('./server/src/models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentdb';

async function extractRealData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        const data = {};

        // Extract Students (50 or all if less)
        console.log('Extracting Students...');
        const students = await Student.find().limit(50).lean();
        data.students = students;
        console.log(`✓ Extracted ${students.length} students\n`);

        // Extract Books (50 or all if less)
        console.log('Extracting Books...');
        const books = await Book.find().limit(50).lean();
        data.books = books;
        console.log(`✓ Extracted ${books.length} books\n`);

        // Extract BorrowTransactions (50 or all if less)
        console.log('Extracting BorrowTransactions...');
        const borrowTransactions = await BorrowTransaction.find()
            .populate('studentId', 'name email')
            .populate('bookId', 'title author isbn')
            .limit(50)
            .lean();
        data.borrowTransactions = borrowTransactions;
        console.log(`✓ Extracted ${borrowTransactions.length} borrow transactions\n`);

        // Extract BookReservations (50 or all if less)
        console.log('Extracting BookReservations...');
        const reservations = await BookReservation.find()
            .populate('student', 'name email')
            .populate('book', 'title author isbn')
            .limit(50)
            .lean();
        data.reservations = reservations;
        console.log(`✓ Extracted ${reservations.length} reservations\n`);

        // Extract LibraryAuditLogs (50 or all if less)
        console.log('Extracting LibraryAuditLogs...');
        const auditLogs = await LibraryAuditLog.find()
            .limit(50)
            .sort({ timestamp: -1 })
            .lean();
        data.auditLogs = auditLogs;
        console.log(`✓ Extracted ${auditLogs.length} audit logs\n`);

        // Extract LibraryFineLedger
        console.log('Extracting LibraryFineLedger...');
        const fines = await LibraryFineLedger.find()
            .populate('student', 'name email')
            .limit(50)
            .lean();
        data.fines = fines;
        console.log(`✓ Extracted ${fines.length} fine records\n`);

        // Extract Transactions (legacy)
        console.log('Extracting Transactions...');
        const transactions = await Transaction.find()
            .populate('student', 'name email')
            .populate('book', 'title author')
            .limit(50)
            .lean();
        data.transactions = transactions;
        console.log(`✓ Extracted ${transactions.length} transactions\n`);

        // Extract Users
        console.log('Extracting Users...');
        const users = await User.find().lean();
        data.users = users;
        console.log(`✓ Extracted ${users.length} users\n`);

        // Generate statistics
        const stats = {
            totalStudents: await Student.countDocuments(),
            totalBooks: await Book.countDocuments(),
            totalBorrowTransactions: await BorrowTransaction.countDocuments(),
            totalReservations: await BookReservation.countDocuments(),
            totalAuditLogs: await LibraryAuditLog.countDocuments(),
            totalFines: await LibraryFineLedger.countDocuments(),
            totalTransactions: await Transaction.countDocuments(),
            totalUsers: await User.countDocuments(),

            // Status breakdowns
            activeStudents: await Student.countDocuments({ status: 'Active' }),
            availableBooks: await Book.countDocuments({ status: 'Available' }),
            activeBorrows: await BorrowTransaction.countDocuments({ status: 'BORROWED' }),
            activeReservations: await BookReservation.countDocuments({ status: 'Active' }),
            unpaidFines: await LibraryFineLedger.countDocuments({ status: 'Unpaid' })
        };
        data.stats = stats;

        // Save to JSON file
        const outputPath = path.join(__dirname, 'real_database_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
        console.log(`\n${'='.repeat(60)}`);
        console.log('✓ Data extraction complete!');
        console.log(`${'='.repeat(60)}`);
        console.log(`Output: ${outputPath}`);
        console.log(`\nStatistics:`);
        console.log(`  Students: ${stats.totalStudents} (${stats.activeStudents} active)`);
        console.log(`  Books: ${stats.totalBooks} (${stats.availableBooks} available)`);
        console.log(`  Borrow Transactions: ${stats.totalBorrowTransactions} (${stats.activeBorrows} active)`);
        console.log(`  Reservations: ${stats.totalReservations} (${stats.activeReservations} active)`);
        console.log(`  Audit Logs: ${stats.totalAuditLogs}`);
        console.log(`  Fines: ${stats.totalFines} (${stats.unpaidFines} unpaid)`);
        console.log(`  Users: ${stats.totalUsers}`);
        console.log(`${'='.repeat(60)}\n`);

        await mongoose.disconnect();
        console.log('✓ Disconnected from MongoDB\n');

        return data;
    } catch (error) {
        console.error('Error extracting data:', error);
        process.exit(1);
    }
}

// Run extraction
extractRealData();
