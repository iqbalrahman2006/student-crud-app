require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const BorrowTransaction = require('../src/models/BorrowTransaction');
const Book = require('../src/models/Book');
const LibraryAuditLog = require('../src/models/LibraryAuditLog');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';
const SHOULD_SEED = process.argv.includes('--force') || process.env.SEED_DB === 'true';

// Data Arrays
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Donald", "Sandra"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const courses = ["Computer Science", "Electrical Engineering", "Civil Engineering", "Business", "Economics", "Psychology", "History", "Biology", "Mathematics", "Sociology"];
const bookTitles = ["Advanced AI", "Intro to Psychology", "Modern Economics", "Civil War History", "Quantum Physics", "Organic Chemistry", "Data Structures", "Macroeconomics 101", "Calculus II", "The Great Gatsby", "1984", "Brave New World"];

// Helper: Random Date within range
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const generateRandomStudents = (count) => {
    return Array.from({ length: count }).map(() => {
        const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return {
            name: `${fName} ${lName}`,
            email: `${fName.toLowerCase()}.${lName.toLowerCase()}${Math.floor(Math.random() * 9999)}@university.edu`,
            course: courses[Math.floor(Math.random() * courses.length)],
            gpa: parseFloat((Math.random() * 10).toFixed(2)), // 0.0 - 10.0 scale
            status: Math.random() > 0.1 ? "Active" : "Inactive",
            city: "Campus City",
            country: "USA"
        };
    });
};

const seedData = async () => {
    if (!SHOULD_SEED) {
        console.warn("⚠️  SEEDING SKIPPED. Use '--force' to run.");
        process.exit(0);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("📦 Connected to MongoDB...");

        // 1. Purge Existing Data
        console.log("🔥 Clearing old data...");
        await Student.deleteMany({});
        await BorrowTransaction.deleteMany({});
        await LibraryAuditLog.deleteMany({});
        // Optional: Clear Books if we want a fresh start there too, but let's keep or backfill them.
        // For consistency, let's ensure we have books.
        const bookCount = await Book.countDocuments();
        let books = [];

        if (bookCount < 10) {
            console.log("📚 Seeding Books...");
            await Book.deleteMany({});
            const newBooks = bookTitles.map(t => ({
                title: t,
                author: "Academic Author",
                isbn: `978-${Math.floor(Math.random() * 1000000000)}`,
                availableCopies: 5,
                totalCopies: 5,
                department: "General"
            }));
            books = await Book.insertMany(newBooks);
        } else {
            books = await Book.find();
        }

        // 2. Seed Students (GPA 10.0)
        console.log("🌱 Seeding Students (GPA Scale 10.0)...");
        const students = await Student.insertMany(generateRandomStudents(200)); // 200 Students
        console.log(`   + Inserted ${students.length} students.`);

        // 3. Seed Transactions (Link valid Student IDs to valid Book IDs)
        console.log("🔗 Seeding Transactions (Active & History)...");
        const transactions = [];

        // Loop through students to generate history
        // 40% of students have some history
        const activeBorrowers = students.sort(() => 0.5 - Math.random()).slice(0, 80);

        for (const student of activeBorrowers) {
            // Each student has 1-3 transactions
            const count = Math.ceil(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const book = books[Math.floor(Math.random() * books.length)];

                // Constraints:
                // Everything must happen BEFORE now (Dec 16 2025).
                // Max cycle: Issue -> 14 days -> Due -> 5 days late -> Return. (~20 days max)

                const now = new Date().getTime();
                const threeMonthsAgo = now - (90 * 86400000);

                // 1. Generate Issue Date (Past 90 days, but leaving room for events)
                // Ensure at least 30 days buffer if we want to simulate late returns
                let issueTs = threeMonthsAgo + Math.random() * (now - threeMonthsAgo - (30 * 86400000));
                let issueDate = new Date(issueTs);

                // 2. Determine Due Date (Fixed 14 days)
                let dueDate = new Date(issueTs + (14 * 86400000));

                let status = 'RETURNED';
                let returnDate = null;
                let fineAmount = 0;

                const rand = Math.random();

                if (rand > 0.6) {
                    // Scenario A: Currently Borrowed (Active)
                    // Can be Normal or Overdue
                    status = 'BORROWED';
                    // If we want it to be "Active", issue date should be recent
                    // Borrowed in last 20 days
                    const recentIssueTs = now - (Math.random() * 20 * 86400000);
                    issueDate = new Date(recentIssueTs);
                    dueDate = new Date(recentIssueTs + (14 * 86400000));
                    returnDate = null;

                } else {
                    // Scenario B: Returned
                    // Return date must be > issueDate AND <= now
                    // Let's decide if it was Late or On Time
                    const isLate = Math.random() > 0.7;

                    if (isLate) {
                        // Returned AFTER DueDate
                        // returnTs = dueDate + random(1-7 days)
                        // Constraint: returnTs <= now
                        // We ensured issueDate has buffer, so dueDate + 7 days should be <= now
                        const daysLate = Math.ceil(Math.random() * 7); // 1-7 days late
                        let returnTs = dueDate.getTime() + (daysLate * 86400000);

                        // Clamp to now (shouldn't trigger if issueDate logic is right, but safe guard)
                        if (returnTs > now) returnTs = now;

                        returnDate = new Date(returnTs);

                        // Recalculate actual days late for fine consistency
                        const actualLateMs = returnTs - dueDate.getTime();
                        if (actualLateMs > 0) {
                            const actualDaysLate = Math.ceil(actualLateMs / 86400000);
                            fineAmount = actualDaysLate * 5; // $5 per day
                        }
                    } else {
                        // Returned On Time (Between Issue and Due)
                        const window = dueDate.getTime() - issueTs;
                        const returnTs = issueTs + (Math.random() * window);
                        returnDate = new Date(returnTs);
                        fineAmount = 0;
                    }
                }

                transactions.push({
                    studentId: student._id,
                    bookId: book._id,
                    status: status,
                    issuedAt: issueDate,
                    dueDate: dueDate,
                    returnedAt: returnDate,
                    fineAmount: fineAmount
                });
            }
        }

        await BorrowTransaction.insertMany(transactions);
        console.log(`   + Inserted ${transactions.length} transactions (Active & Returned).`);

        // 4. Seed Audit Logs (Mirroring Transactions)
        console.log("📜 Seeding Audit Logs (Mirroring History)...");
        const auditLogs = [];
        const systemAdminId = new mongoose.Types.ObjectId(); // Mock Admin ID

        for (const txn of transactions) {
            // Log 1: BORROW
            auditLogs.push({
                action: 'BORROW',
                bookId: txn.bookId,
                studentId: txn.studentId,
                adminId: systemAdminId,
                timestamp: txn.issuedAt,
                metadata: { info: "Seeded Transaction" },
                ipAddress: '127.0.0.1',
                userAgent: 'SeedScript/1.0'
            });

            // Log 2: RETURN (if applicable)
            if (txn.status === 'RETURNED' && txn.returnedAt) {
                auditLogs.push({
                    action: 'RETURN',
                    bookId: txn.bookId,
                    studentId: txn.studentId,
                    adminId: systemAdminId,
                    timestamp: txn.returnedAt,
                    metadata: { fine: txn.fineAmount, info: "Seeded Return" },
                    ipAddress: '127.0.0.1',
                    userAgent: 'SeedScript/1.0'
                });
            }
        }

        await LibraryAuditLog.insertMany(auditLogs);
        console.log(`   + Inserted ${auditLogs.length} audit log entries.`);

        console.log("\n✅ RE-SEED COMPLETE. Data Mismatch Fixed.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed:", error);
        process.exit(1);
    }
};

seedData();
