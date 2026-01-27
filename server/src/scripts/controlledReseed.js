/**
 * LAYER 5: Controlled Reseed Engine
 * 
 * Implements deterministic reseed system with strict order:
 * 1. Clear all collections
 * 2. Seed Students
 * 3. Seed Books
 * 4. Seed BorrowTransactions
 * 5. Seed BookReservations
 * 6. Seed Transactions
 * 7. Seed Overdue States
 * 8. Seed LibraryAuditLogs
 * 9. Seed FineLedgers
 * 
 * Rules:
 * - All IDs must exist
 * - All references must resolve
 * - No null relations
 * - No fake placeholders
 * - No auto-generated ghosts
 * - No missing links
 * - No dangling refs
 * - No ambiguous ownership
 */

const mongoose = require('mongoose');

async function controlledReseed(options = {}) {
    const { dryRun = false, clearAll = true, verbose = true } = options;

    try {
        const log = verbose ? console.log : () => { };
        log(`\n=== LAYER 5: CONTROLLED RESEED ENGINE (DRY RUN: ${dryRun ? 'YES' : 'NO'}) ===\n`);

        const results = {
            cleared: {},
            seeded: {},
            errors: [],
            timestamp: new Date(),
            dryRun
        };

        // ===== STEP 0: CLEAR ALL COLLECTIONS =====
        if (clearAll) {
            log('🔥 Clearing all collections...');
            const collections = [
                'Student', 'Book', 'BorrowTransaction', 'BookReservation',
                'Transaction', 'LibraryAuditLog', 'LibraryFineLedger'
            ];

            for (const model of collections) {
                try {
                    if (!dryRun) {
                        const deleted = await mongoose.model(model).deleteMany({});
                        results.cleared[model] = deleted.deletedCount;
                        log(`  ✅ Cleared ${model}: ${deleted.deletedCount} documents`);
                    } else {
                        const count = await mongoose.model(model).countDocuments();
                        results.cleared[model] = count;
                        log(`  📊 Would clear ${model}: ${count} documents`);
                    }
                } catch (err) {
                    results.errors.push(`Failed to clear ${model}: ${err.message}`);
                    log(`  ❌ Error clearing ${model}: ${err.message}`);
                }
            }
        }

        // ===== STEP 1: SEED STUDENTS =====
        log('\n📚 Step 1: Seeding Students...');
        const studentData = generateStudents(50);
        const students = [];

        for (const studentInfo of studentData) {
            try {
                if (!dryRun) {
                    const student = await mongoose.model('Student').create(studentInfo);
                    students.push(student);
                    log(`  ✅ Created student: ${student.name} (${student.email})`);
                } else {
                    // In dry run, simulate by storing the data
                    students.push(studentInfo);
                    log(`  📊 Would create student: ${studentInfo.name}`);
                }
            } catch (err) {
                results.errors.push(`Failed to create student ${studentInfo.email}: ${err.message}`);
                log(`  ❌ Error: ${err.message}`);
            }
        }
        results.seeded.Students = students.length;

        // ===== STEP 2: SEED BOOKS =====
        log('\n📚 Step 2: Seeding Books...');
        const bookData = generateBooks(30);
        const books = [];

        for (const bookInfo of bookData) {
            try {
                if (!dryRun) {
                    const book = await mongoose.model('Book').create(bookInfo);
                    books.push(book);
                    log(`  ✅ Created book: ${book.title} (${book.isbn})`);
                } else {
                    books.push(bookInfo);
                    log(`  📊 Would create book: ${bookInfo.title}`);
                }
            } catch (err) {
                results.errors.push(`Failed to create book ${bookInfo.isbn}: ${err.message}`);
                log(`  ❌ Error: ${err.message}`);
            }
        }
        results.seeded.Books = books.length;

        // ===== STEP 3: SEED BORROW TRANSACTIONS =====
        log('\n📚 Step 3: Seeding BorrowTransactions...');
        const borrowTransactions = [];
        const borrowCount = Math.floor(students.length * 0.6); // 60% of students have borrowed books

        for (let i = 0; i < borrowCount; i++) {
            try {
                const student = students[Math.floor(Math.random() * students.length)];
                const book = books[Math.floor(Math.random() * books.length)];

                if (!student || !student._id || !book || !book._id) {
                    throw new Error('Student or Book ID is missing');
                }

                const txnData = {
                    studentId: student._id,
                    bookId: book._id,
                    issuedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random past 30 days
                    dueDate: new Date(Date.now() + Math.random() * 10 * 24 * 60 * 60 * 1000), // Random future
                    status: 'BORROWED',
                    demo: false
                };

                if (!dryRun) {
                    const txn = await mongoose.model('BorrowTransaction').create(txnData);
                    borrowTransactions.push(txn);
                    log(`  ✅ Created BorrowTransaction: ${student.name} borrowed ${book.title}`);
                } else {
                    borrowTransactions.push(txnData);
                    log(`  📊 Would create BorrowTransaction`);
                }
            } catch (err) {
                results.errors.push(`Failed to create BorrowTransaction: ${err.message}`);
                log(`  ❌ Error: ${err.message}`);
            }
        }
        results.seeded.BorrowTransactions = borrowTransactions.length;

        // ===== STEP 4: SEED BOOK RESERVATIONS =====
        log('\n📚 Step 4: Seeding BookReservations...');
        const reservations = [];
        const reservationCount = Math.floor(students.length * 0.3); // 30% of students have reservations

        for (let i = 0; i < reservationCount; i++) {
            try {
                const student = students[Math.floor(Math.random() * students.length)];
                const book = books[Math.floor(Math.random() * books.length)];

                if (!student || !student._id || !book || !book._id) {
                    throw new Error('Student or Book ID is missing');
                }

                const resData = {
                    student: student._id,
                    book: book._id,
                    status: 'Active',
                    queuePosition: 1,
                    timestamp: new Date(),
                    demo: false
                };

                if (!dryRun) {
                    const res = await mongoose.model('BookReservation').create(resData);
                    reservations.push(res);
                    log(`  ✅ Created BookReservation: ${student.name} reserved ${book.title}`);
                } else {
                    reservations.push(resData);
                    log(`  📊 Would create BookReservation`);
                }
            } catch (err) {
                results.errors.push(`Failed to create BookReservation: ${err.message}`);
                log(`  ❌ Error: ${err.message}`);
            }
        }
        results.seeded.BookReservations = reservations.length;

        // ===== STEP 5: SEED TRANSACTIONS =====
        log('\n📚 Step 5: Seeding Transactions...');
        const transactions = [];
        const transactionCount = Math.floor(students.length * 0.5); // 50% of students have transactions

        for (let i = 0; i < transactionCount; i++) {
            try {
                const student = students[Math.floor(Math.random() * students.length)];
                const book = books[Math.floor(Math.random() * books.length)];

                if (!student || !student._id || !book || !book._id) {
                    throw new Error('Student or Book ID is missing');
                }

                const issueDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000); // Random past 60 days
                const txnData = {
                    student: student._id,
                    book: book._id,
                    studentName: student.name,
                    bookTitle: book.title,
                    issueDate,
                    dueDate: new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000),
                    status: 'Issued',
                    renewalCount: 0,
                    fine: 0
                };

                if (!dryRun) {
                    const txn = await mongoose.model('Transaction').create(txnData);
                    transactions.push(txn);
                    log(`  ✅ Created Transaction: ${student.name} issued ${book.title}`);
                } else {
                    transactions.push(txnData);
                    log(`  📊 Would create Transaction`);
                }
            } catch (err) {
                results.errors.push(`Failed to create Transaction: ${err.message}`);
                log(`  ❌ Error: ${err.message}`);
            }
        }
        results.seeded.Transactions = transactions.length;

        // ===== STEP 6: SEED LIBRARY AUDIT LOGS =====
        log('\n📚 Step 6: Seeding LibraryAuditLogs...');
        const auditLogs = [];
        const actions = ['BORROW', 'RETURN', 'RENEW', 'RESERVE'];

        for (let i = 0; i < borrowTransactions.length + transactions.length; i++) {
            try {
                const action = actions[Math.floor(Math.random() * actions.length)];
                const student = students[Math.floor(Math.random() * students.length)];
                const book = books[Math.floor(Math.random() * books.length)];

                const logData = {
                    action,
                    studentId: student._id,
                    bookId: book._id,
                    timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    metadata: { action }
                };

                if (!dryRun) {
                    const log = await mongoose.model('LibraryAuditLog').create(logData);
                    auditLogs.push(log);
                } else {
                    auditLogs.push(logData);
                }
            } catch (err) {
                results.errors.push(`Failed to create AuditLog: ${err.message}`);
            }
        }
        results.seeded.LibraryAuditLogs = auditLogs.length;
        log(`  ✅ Created ${auditLogs.length} audit logs`);

        // ===== STEP 7: SEED FINE LEDGERS =====
        log('\n📚 Step 7: Seeding FineLedgers...');
        const fines = [];
        const overdueTransactions = transactions.filter(t => new Date(t.dueDate) < Date.now());

        for (const txn of overdueTransactions.slice(0, 10)) {
            try {
                const student = students.find(s => s._id.toString() === txn.student.toString());
                if (!student) continue;

                const fineData = {
                    student: student._id,
                    transaction: txn._id,
                    amount: Math.random() * 100,
                    reason: `Overdue: ${txn.bookTitle}`,
                    status: 'Unpaid',
                    timestamp: new Date()
                };

                if (!dryRun) {
                    const fine = await mongoose.model('LibraryFineLedger').create(fineData);
                    fines.push(fine);
                    log(`  ✅ Created FineLedger: ${student.name}`);
                } else {
                    fines.push(fineData);
                    log(`  📊 Would create FineLedger`);
                }
            } catch (err) {
                results.errors.push(`Failed to create FineLedger: ${err.message}`);
            }
        }
        results.seeded.FineLedgers = fines.length;

        // LAYER 5: Post-Seed Integrity Validation
        log('\n📚 Step 8: Validating Database Integrity...');
        try {
            const dbIntegrityService = require('../services/dbIntegrityService');
            const integrityReport = await dbIntegrityService.validateIntegrity();

            if (integrityReport.orphanCount > 0) {
                throw new Error(`SEED FAILED: ${integrityReport.orphanCount} orphan records detected after seeding`);
            }

            log('  ✅ Integrity validation passed: No orphans detected');
            results.integrityCheck = {
                status: 'PASSED',
                orphanCount: 0
            };
        } catch (err) {
            results.errors.push(`Integrity validation failed: ${err.message}`);
            log(`  ❌ Error: ${err.message}`);
        }

        // Summary
        console.log('\n=== RESEED SUMMARY ===');
        console.log(`Students: ${results.seeded.Students}`);
        console.log(`Books: ${results.seeded.Books}`);
        console.log(`BorrowTransactions: ${results.seeded.BorrowTransactions}`);
        console.log(`BookReservations: ${results.seeded.BookReservations}`);
        console.log(`Transactions: ${results.seeded.Transactions}`);
        console.log(`AuditLogs: ${results.seeded.LibraryAuditLogs}`);
        console.log(`FineLedgers: ${results.seeded.FineLedgers}`);
        console.log(`Errors: ${results.errors.length}`);
        if (results.errors.length > 0) {
            console.log('\nErrors:');
            results.errors.forEach(err => console.log(`  - ${err}`));
        }

        return results;

    } catch (err) {
        console.error('❌ Error during controlled reseed:', err.message);
        throw err;
    }
}

function generateStudents(count) {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica', 'Robert', 'Amanda'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    const courses = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Business'];
    const cities = ['New York', 'Boston', 'Chicago', 'San Francisco', 'Austin'];

    const students = [];
    for (let i = 0; i < count; i++) {
        students.push({
            name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            email: `student${i}@university.edu`,
            phone: `555-${String(1000 + i).padStart(4, '0')}`,
            course: courses[Math.floor(Math.random() * courses.length)],
            status: 'Active',
            gpa: (2.0 + Math.random() * 2.0).toFixed(2),
            city: cities[Math.floor(Math.random() * cities.length)],
            country: 'USA',
            enrollmentDate: new Date()
        });
    }
    return students;
}

function generateBooks(count) {
    const titles = ['Database Systems', 'Algorithms', 'Web Development', 'Machine Learning', 'Cloud Computing',
        'Data Science', 'Cybersecurity', 'DevOps', 'Microservices', 'React Fundamentals'];
    const authors = ['Jane Doe', 'John Smith', 'Robert Johnson', 'Sarah Williams', 'Michael Brown'];
    const departments = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Business'];

    const books = [];
    for (let i = 0; i < count; i++) {
        books.push({
            title: `${titles[i % titles.length]} - Edition ${Math.floor(i / titles.length) + 1}`,
            author: authors[i % authors.length],
            isbn: `978-0-${String(100000 + i).padStart(6, '0')}-X`,
            department: departments[i % departments.length],
            totalCopies: Math.floor(Math.random() * 5) + 1,
            checkedOutCount: 0,
            availableCopies: Math.floor(Math.random() * 5) + 1,
            status: 'Available'
        });
    }
    return books;
}

module.exports = {
    controlledReseed
};
