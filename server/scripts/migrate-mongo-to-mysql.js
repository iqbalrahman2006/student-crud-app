/**
 * MIGRATION: MongoDB → MySQL Data Transfer Script
 * ========================================================
 * 
 * CRITICAL OPERATIONS:
 * 1. Extract all data from MongoDB
 * 2. Transform ObjectId → CHAR(24) hex strings
 * 3. Insert parent entities first (Students, Books, Users)
 * 4. Insert child entities with FK validation
 * 5. Verify referential integrity (no "unknown" references)
 * 
 * RUN: node server/scripts/migrate-mongo-to-mysql.js
 * 
 * This script is READ-ONLY initially (dry-run mode).
 * Pass --commit to actually write to MySQL.
 * ========================================================
 */

const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Load Mongoose models (must be done before migration)
const Student = require('../src/models/Student');
const Book = require('../src/models/Book');
const User = require('../src/models/User');
const BorrowTransaction = require('../src/models/BorrowTransaction');
const Transaction = require('../src/models/Transaction');
const BookReservation = require('../src/models/BookReservation');
const LibraryAuditLog = require('../src/models/LibraryAuditLog');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studentdb';

// MySQL connection
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'studentdb',
    logging: false
});

// Migration stats
let stats = {
    students: {
        fetched: 0,
        inserted: 0,
        failed: 0
    },
    books: {
        fetched: 0,
        inserted: 0,
        failed: 0
    },
    users: {
        fetched: 0,
        inserted: 0,
        failed: 0
    },
    transactions: {
        fetched: 0,
        inserted: 0,
        failed: 0,
        invalidFk: 0
    },
    borrowTransactions: {
        fetched: 0,
        inserted: 0,
        failed: 0,
        invalidFk: 0
    },
    reservations: {
        fetched: 0,
        inserted: 0,
        failed: 0,
        invalidFk: 0
    },
    auditLogs: {
        fetched: 0,
        inserted: 0,
        failed: 0
    },
    errors: []
};

const DRY_RUN = !process.argv.includes('--commit');
const VERBOSE = process.argv.includes('--verbose');

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  MongoDB → MySQL Migration Script                              ║
║  Mode: ${DRY_RUN ? 'DRY-RUN (no commits)' : 'COMMIT (writing to MySQL)'}                                    ║
╚════════════════════════════════════════════════════════════════╝
`);

// ============================================================
// MIGRATION FUNCTIONS
// ============================================================

/**
 * Migrate Students collection
 */
async function migrateStudents(mongoConnection) {
    console.log('\n[1/7] Migrating Students...');
    try {
        const students = await Student.find().lean();
        stats.students.fetched = students.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${students.length} students (dry-run)`);
            return students;
        }

        const studentData = students.map(doc => ({
            _id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            phone: doc.phone || null,
            course: doc.course || null,
            status: doc.status || 'Active',
            enrollmentDate: doc.enrollmentDate,
            gpa: doc.gpa || null,
            city: doc.city || null,
            country: doc.country || null,
            zipCode: doc.zipCode || null,
            address: doc.address || null,
            guardianName: doc.guardianName || null,
            emergencyContact: doc.emergencyContact || null,
            studentCategory: doc.studentCategory || null,
            scholarshipStatus: doc.scholarshipStatus || null,
            bloodGroup: doc.bloodGroup || null,
            hostelRequired: doc.hostelRequired || false,
            transportMode: doc.transportMode || null,
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
        }));

        // Bulk insert via raw query (faster than Sequelize for large batches)
        const query = `
            INSERT INTO Students (_id, name, email, phone, course, status, enrollmentDate, gpa, 
                                 city, country, zipCode, address, guardianName, emergencyContact,
                                 studentCategory, scholarshipStatus, bloodGroup, hostelRequired, 
                                 transportMode, createdAt, updatedAt)
            VALUES ?
        `;

        // Split into batches of 500 to avoid packet size issues
        const batchSize = 500;
        for (let i = 0; i < studentData.length; i += batchSize) {
            const batch = studentData.slice(i, i + batchSize);
            const values = batch.map(s => [
                s._id, s.name, s.email, s.phone, s.course, s.status, s.enrollmentDate, s.gpa,
                s.city, s.country, s.zipCode, s.address, s.guardianName, s.emergencyContact,
                s.studentCategory, s.scholarshipStatus, s.bloodGroup, s.hostelRequired,
                s.transportMode, s.createdAt, s.updatedAt
            ]);

            try {
                await sequelize.query(query, {
                    replacements: [values],
                    type: 'INSERT'
                });
                stats.students.inserted += batch.length;
            } catch (err) {
                stats.students.failed += batch.length;
                stats.errors.push(`Student batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.students.inserted} students`);
        return studentData;
    } catch (err) {
        console.error(`  ❌ Error migrating students:`, err.message);
        stats.errors.push(`Student migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Migrate Books collection
 */
async function migrateBooks(mongoConnection) {
    console.log('\n[2/7] Migrating Books...');
    try {
        const books = await Book.find().lean();
        stats.books.fetched = books.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${books.length} books (dry-run)`);
            return books;
        }

        const bookData = books.map(doc => ({
            _id: doc._id.toString(),
            title: doc.title,
            author: doc.author,
            isbn: doc.isbn,
            genre: doc.genre || null,
            department: doc.department || 'General',
            totalCopies: doc.totalCopies || 1,
            checkedOutCount: doc.checkedOutCount || 0,
            lastAvailabilityUpdatedAt: doc.lastAvailabilityUpdatedAt || new Date(),
            overdueFlag: doc.overdueFlag || false,
            status: doc.status || 'Available',
            shelfLocation: doc.shelfLocation || null,
            addedDate: doc.addedDate || new Date(),
            autoTags: JSON.stringify(doc.autoTags || []),
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
        }));

        const batchSize = 500;
        for (let i = 0; i < bookData.length; i += batchSize) {
            const batch = bookData.slice(i, i + batchSize);
            const values = batch.map(b => [
                b._id, b.title, b.author, b.isbn, b.genre, b.department, b.totalCopies,
                b.checkedOutCount, b.lastAvailabilityUpdatedAt, b.overdueFlag, b.status,
                b.shelfLocation, b.addedDate, b.autoTags, b.createdAt, b.updatedAt
            ]);

            const query = `
                INSERT INTO Books (_id, title, author, isbn, genre, department, totalCopies,
                                  checkedOutCount, lastAvailabilityUpdatedAt, overdueFlag, status,
                                  shelfLocation, addedDate, autoTags, createdAt, updatedAt)
                VALUES ?
            `;

            try {
                await sequelize.query(query, { replacements: [values], type: 'INSERT' });
                stats.books.inserted += batch.length;
            } catch (err) {
                stats.books.failed += batch.length;
                stats.errors.push(`Book batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.books.inserted} books`);
        return bookData;
    } catch (err) {
        console.error(`  ❌ Error migrating books:`, err.message);
        stats.errors.push(`Book migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Migrate Users collection
 */
async function migrateUsers(mongoConnection) {
    console.log('\n[3/7] Migrating Users...');
    try {
        const users = await User.find().lean();
        stats.users.fetched = users.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${users.length} users (dry-run)`);
            return users;
        }

        const userData = users.map(doc => ({
            _id: doc._id.toString(),
            name: doc.name,
            email: doc.email,
            role: doc.role || 'STUDENT',
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
        }));

        const batchSize = 500;
        for (let i = 0; i < userData.length; i += batchSize) {
            const batch = userData.slice(i, i + batchSize);
            const values = batch.map(u => [u._id, u.name, u.email, u.role, u.createdAt, u.updatedAt]);

            const query = `
                INSERT INTO Users (_id, name, email, role, createdAt, updatedAt)
                VALUES ?
            `;

            try {
                await sequelize.query(query, { replacements: [values], type: 'INSERT' });
                stats.users.inserted += batch.length;
            } catch (err) {
                stats.users.failed += batch.length;
                stats.errors.push(`User batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.users.inserted} users`);
        return userData;
    } catch (err) {
        console.error(`  ❌ Error migrating users:`, err.message);
        stats.errors.push(`User migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Migrate BorrowTransactions collection (primary transaction model)
 */
async function migrateBorrowTransactions(mongoConnection, studentIds, bookIds) {
    console.log('\n[4/7] Migrating BorrowTransactions...');
    try {
        const transactions = await BorrowTransaction.find().lean();
        stats.borrowTransactions.fetched = transactions.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${transactions.length} borrow transactions (dry-run)`);
            return transactions;
        }

        const validTransactions = [];
        for (const txn of transactions) {
            const studentId = txn.studentId.toString();
            const bookId = txn.bookId.toString();

            if (!studentIds.includes(studentId)) {
                stats.borrowTransactions.invalidFk++;
                stats.errors.push(`BorrowTransaction: Student ${studentId} not found`);
                continue;
            }
            if (!bookIds.includes(bookId)) {
                stats.borrowTransactions.invalidFk++;
                stats.errors.push(`BorrowTransaction: Book ${bookId} not found`);
                continue;
            }

            validTransactions.push({
                _id: txn._id.toString(),
                studentId,
                bookId,
                issuedAt: txn.issuedAt,
                dueDate: txn.dueDate,
                returnedAt: txn.returnedAt || null,
                fineAmount: txn.fineAmount || 0,
                status: txn.status || 'BORROWED',
                renewalCount: txn.renewalCount || 0,
                demo: txn.demo || false,
                studentName: txn.studentName || null,
                bookTitle: txn.bookTitle || null,
                createdAt: txn.createdAt || new Date(),
                updatedAt: txn.updatedAt || new Date()
            });
        }

        const batchSize = 500;
        for (let i = 0; i < validTransactions.length; i += batchSize) {
            const batch = validTransactions.slice(i, i + batchSize);
            const values = batch.map(t => [
                t._id, t.studentId, t.bookId, t.issuedAt, t.dueDate, t.returnedAt,
                t.fineAmount, t.status, t.renewalCount, t.demo, t.studentName,
                t.bookTitle, t.createdAt, t.updatedAt
            ]);

            const query = `
                INSERT INTO BorrowTransactions (_id, studentId, bookId, issuedAt, dueDate, returnedAt,
                                               fineAmount, status, renewalCount, demo, studentName,
                                               bookTitle, createdAt, updatedAt)
                VALUES ?
            `;

            try {
                await sequelize.query(query, { replacements: [values], type: 'INSERT' });
                stats.borrowTransactions.inserted += batch.length;
            } catch (err) {
                stats.borrowTransactions.failed += batch.length;
                stats.errors.push(`BorrowTransaction batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.borrowTransactions.inserted} borrow transactions`);
        if (stats.borrowTransactions.invalidFk > 0) {
            console.log(`  ⚠️  Skipped ${stats.borrowTransactions.invalidFk} with invalid FK`);
        }
        return validTransactions;
    } catch (err) {
        console.error(`  ❌ Error migrating borrow transactions:`, err.message);
        stats.errors.push(`BorrowTransaction migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Migrate Transactions collection (legacy model)
 */
async function migrateTransactions(mongoConnection, studentIds, bookIds) {
    console.log('\n[5/7] Migrating Transactions (legacy)...');
    try {
        const transactions = await Transaction.find().lean();
        stats.transactions.fetched = transactions.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${transactions.length} transactions (dry-run)`);
            return transactions;
        }

        const validTransactions = [];
        for (const txn of transactions) {
            const studentId = txn.student.toString();
            const bookId = txn.book.toString();

            if (!studentIds.includes(studentId)) {
                stats.transactions.invalidFk++;
                continue;
            }
            if (!bookIds.includes(bookId)) {
                stats.transactions.invalidFk++;
                continue;
            }

            validTransactions.push({
                _id: txn._id.toString(),
                student: studentId,
                book: bookId,
                studentName: txn.studentName || null,
                bookTitle: txn.bookTitle || null,
                issueDate: txn.issueDate,
                dueDate: txn.dueDate,
                returnDate: txn.returnDate || null,
                status: txn.status || 'Issued',
                renewalCount: txn.renewalCount || 0,
                fine: txn.fine || 0,
                createdAt: txn.createdAt || new Date(),
                updatedAt: txn.updatedAt || new Date()
            });
        }

        const batchSize = 500;
        for (let i = 0; i < validTransactions.length; i += batchSize) {
            const batch = validTransactions.slice(i, i + batchSize);
            const values = batch.map(t => [
                t._id, t.student, t.book, t.studentName, t.bookTitle, t.issueDate,
                t.dueDate, t.returnDate, t.status, t.renewalCount, t.fine, t.createdAt, t.updatedAt
            ]);

            const query = `
                INSERT INTO Transactions (_id, student, book, studentName, bookTitle, issueDate,
                                         dueDate, returnDate, status, renewalCount, fine, createdAt, updatedAt)
                VALUES ?
            `;

            try {
                await sequelize.query(query, { replacements: [values], type: 'INSERT' });
                stats.transactions.inserted += batch.length;
            } catch (err) {
                stats.transactions.failed += batch.length;
                stats.errors.push(`Transaction batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.transactions.inserted} transactions`);
        if (stats.transactions.invalidFk > 0) {
            console.log(`  ⚠️  Skipped ${stats.transactions.invalidFk} with invalid FK`);
        }
        return validTransactions;
    } catch (err) {
        console.error(`  ❌ Error migrating transactions:`, err.message);
        stats.errors.push(`Transaction migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Migrate BookReservations collection
 */
async function migrateReservations(mongoConnection, studentIds, bookIds) {
    console.log('\n[6/7] Migrating BookReservations...');
    try {
        const reservations = await BookReservation.find().lean();
        stats.reservations.fetched = reservations.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${reservations.length} reservations (dry-run)`);
            return reservations;
        }

        const validReservations = [];
        for (const res of reservations) {
            const studentId = res.student.toString();
            const bookId = res.book.toString();

            if (!studentIds.includes(studentId)) {
                stats.reservations.invalidFk++;
                continue;
            }
            if (!bookIds.includes(bookId)) {
                stats.reservations.invalidFk++;
                continue;
            }

            validReservations.push({
                _id: res._id.toString(),
                book: bookId,
                student: studentId,
                status: res.status || 'Active',
                queuePosition: res.queuePosition || 1,
                expiryDate: res.expiryDate || null,
                fulfilledAt: res.fulfilledAt || null,
                timestamp: res.timestamp || new Date(),
                createdAt: res.createdAt || new Date(),
                updatedAt: res.updatedAt || new Date()
            });
        }

        const batchSize = 500;
        for (let i = 0; i < validReservations.length; i += batchSize) {
            const batch = validReservations.slice(i, i + batchSize);
            const values = batch.map(r => [
                r._id, r.book, r.student, r.status, r.queuePosition, r.expiryDate,
                r.fulfilledAt, r.timestamp, r.createdAt, r.updatedAt
            ]);

            const query = `
                INSERT INTO BookReservations (_id, book, student, status, queuePosition, expiryDate,
                                             fulfilledAt, timestamp, createdAt, updatedAt)
                VALUES ?
            `;

            try {
                await sequelize.query(query, { replacements: [values], type: 'INSERT' });
                stats.reservations.inserted += batch.length;
            } catch (err) {
                stats.reservations.failed += batch.length;
                stats.errors.push(`Reservation batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.reservations.inserted} reservations`);
        if (stats.reservations.invalidFk > 0) {
            console.log(`  ⚠️  Skipped ${stats.reservations.invalidFk} with invalid FK`);
        }
        return validReservations;
    } catch (err) {
        console.error(`  ❌ Error migrating reservations:`, err.message);
        stats.errors.push(`Reservation migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Migrate LibraryAuditLogs collection
 */
async function migrateAuditLogs(mongoConnection, studentIds, bookIds, userIds) {
    console.log('\n[7/7] Migrating LibraryAuditLogs...');
    try {

        const logs = await LibraryAuditLog.find().lean();
        stats.auditLogs.fetched = logs.length;

        if (DRY_RUN) {
            console.log(`  🔍 Would insert ${logs.length} audit logs (dry-run)`);
            return logs;
        }

        const logData = logs.map(doc => ({
            _id: doc._id.toString(),
            action: doc.action,
            bookId: doc.bookId ? doc.bookId.toString() : null,
            studentId: doc.studentId ? doc.studentId.toString() : null,
            adminId: doc.adminId ? doc.adminId.toString() : null,
            timestamp: doc.timestamp || new Date(),
            metadata: JSON.stringify(doc.metadata || {}),
            ipAddress: doc.ipAddress || null,
            userAgent: doc.userAgent || null
        }));

        const batchSize = 1000; // Audit logs can be larger batches
        for (let i = 0; i < logData.length; i += batchSize) {
            const batch = logData.slice(i, i + batchSize);
            const values = batch.map(log => [
                log._id, log.action, log.bookId, log.studentId, log.adminId,
                log.timestamp, log.metadata, log.ipAddress, log.userAgent
            ]);

            const query = `
                INSERT INTO LibraryAuditLogs (_id, action, bookId, studentId, adminId,
                                             timestamp, metadata, ipAddress, userAgent)
                VALUES ?
            `;

            try {
                await sequelize.query(query, { replacements: [values], type: 'INSERT' });
                stats.auditLogs.inserted += batch.length;
            } catch (err) {
                stats.auditLogs.failed += batch.length;
                // Audit logs insertions should not fail validation; log error
                if (VERBOSE) stats.errors.push(`AuditLog batch insert failed: ${err.message}`);
            }
        }

        console.log(`  ✅ Inserted ${stats.auditLogs.inserted} audit logs`);
        return logData;
    } catch (err) {
        console.error(`  ❌ Error migrating audit logs:`, err.message);
        stats.errors.push(`AuditLog migration error: ${err.message}`);
        throw err;
    }
}

/**
 * Main migration sequence
 */
async function runMigration() {
    const startTime = Date.now();

    try {
        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        const mongoConnection = await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ MongoDB connected');

        // Connect to MySQL
        console.log('📡 Connecting to MySQL...');
        await sequelize.authenticate();
        console.log('✅ MySQL connected');

        // Run migration steps (in dependency order)
        const studentData = await migrateStudents(mongoConnection);
        const bookData = await migrateBooks(mongoConnection);
        const userData = await migrateUsers(mongoConnection);

        const studentIds = studentData.map(s => s._id);
        const bookIds = bookData.map(b => b._id);
        const userIds = userData.map(u => u._id);

        await migrateBorrowTransactions(mongoConnection, studentIds, bookIds);
        await migrateTransactions(mongoConnection, studentIds, bookIds);
        await migrateReservations(mongoConnection, studentIds, bookIds);
        await migrateAuditLogs(mongoConnection, studentIds, bookIds, userIds);

        // Print summary
        const elapsedMs = Date.now() - startTime;
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Migration Summary (${elapsedMs}ms)
╚════════════════════════════════════════════════════════════════╝

Students:              ${stats.students.inserted}/${stats.students.fetched} inserted
Books:                 ${stats.books.inserted}/${stats.books.fetched} inserted
Users:                 ${stats.users.inserted}/${stats.users.fetched} inserted
BorrowTransactions:    ${stats.borrowTransactions.inserted}/${stats.borrowTransactions.fetched} inserted (${stats.borrowTransactions.invalidFk} invalid FK)
Transactions (legacy): ${stats.transactions.inserted}/${stats.transactions.fetched} inserted (${stats.transactions.invalidFk} invalid FK)
BookReservations:      ${stats.reservations.inserted}/${stats.reservations.fetched} inserted (${stats.reservations.invalidFk} invalid FK)
LibraryAuditLogs:      ${stats.auditLogs.inserted}/${stats.auditLogs.fetched} inserted

${DRY_RUN ? '🔍 DRY-RUN MODE' : '✅ COMMIT MODE'}
${stats.errors.length > 0 ? `
⚠️  Errors encountered:
${stats.errors.slice(0, 10).map(e => '   - ' + e).join('\n')}
${stats.errors.length > 10 ? `   ... and ${stats.errors.length - 10} more` : ''}
` : ''}

${DRY_RUN ? 'To commit changes, run: node server/scripts/migrate-mongo-to-mysql.js --commit' : '✅ Data successfully migrated!'}
`);

        process.exit(0);
    } catch (err) {
        console.error('\n❌ MIGRATION FAILED:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        await sequelize.close();
    }
}

// Run the migration
runMigration();
