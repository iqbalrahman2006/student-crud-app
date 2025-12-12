const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app'); // Ensure this exports the express app
const BorrowTransaction = require('../src/models/BorrowTransaction');
const Book = require('../src/models/Book');
const Student = require('../src/models/Student');

// Mock User for RBAC overrides if needed
jest.mock('../src/middleware/rbac', () => {
    return (roles) => (req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011', role: 'ADMIN' };
        next();
    };
});

describe('Borrow Transaction Engine', () => {
    let studentId, bookId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb_test');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await BorrowTransaction.deleteMany({});
        await Book.deleteMany({});
        await Student.deleteMany({});

        // Create Test Data
        const student = await Student.create({ name: 'Test Student', email: 'test@lib.com' });
        studentId = student._id;

        const book = await Book.create({
            title: 'Algorithm Design',
            author: 'Kleinberg',
            isbn: '978-0321751041',
            totalCopies: 5,
            checkedOutCount: 0
        });
        bookId = book._id;
    });

    test('Should borrow a book and decrease availability', async () => {
        const res = await request(app)
            .post('/api/v1/library/issue')
            .send({ studentId, bookId });

        expect(res.statusCode).toBe(201);
        expect(res.body.data.status).toBe('BORROWED');
        expect(res.body.data.bookId).toBeDefined();

        // Check Inventory
        const book = await Book.findById(bookId);
        expect(book.checkedOutCount).toBe(1);
        expect(book.availableCopies).toBe(4);
    });

    test('Should return a book and apply no fine if on time', async () => {
        // Issue first
        const txn = await BorrowTransaction.create({
            studentId,
            bookId,
            issuedAt: new Date(Date.now() - 2000), // 2 seconds ago
            dueDate: new Date(Date.now() + 86400000), // +1 Day
            status: 'BORROWED'
        });
        await Book.updateOne({ _id: bookId }, { $inc: { checkedOutCount: 1 } });

        // Return
        const res = await request(app)
            .post('/api/v1/library/return')
            .send({ transactionId: txn._id });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.status).toBe('RETURNED');
        expect(res.body.fineApplied).toBe(0);

        const book = await Book.findById(bookId);
        expect(book.checkedOutCount).toBe(0);
    });

    test('Should apply fine if returned late', async () => {
        // Issue with past due date
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

        const txn = await BorrowTransaction.create({
            studentId,
            bookId,
            issuedAt: pastDate,
            dueDate: pastDate, // Due 10 days ago
            status: 'BORROWED'
        });

        const res = await request(app)
            .post('/api/v1/library/return')
            .send({ transactionId: txn._id });

        expect(res.statusCode).toBe(200);
        // Fine rate $1 * 10 days = $10 (assuming rate inside fineEngine.js)
        // Wait, calculateFine uses 'now' vs 'dueDate'. 
        // If due was 10 days ago, fine is > 0.
        expect(res.body.fineApplied).toBeGreaterThan(0);
        expect(res.body.data.fineAmount).toBeGreaterThan(0);
    });
});
