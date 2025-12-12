const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const BorrowTransaction = require('../src/models/BorrowTransaction');
const Book = require('../src/models/Book');
const Student = require('../src/models/Student');

jest.mock('../src/middleware/rbac', () => {
    return (roles) => (req, res, next) => {
        req.user = { _id: '507f1f77bcf86cd799439011', role: 'ADMIN' };
        next();
    };
});

describe('Dashboard Metrics Engine', () => {
    jest.setTimeout(30000); // Increase timeout to 30s

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

        // 1. Seed 2 Students
        await Student.create([{ name: 'S1', email: 's1@u.edu' }, { name: 'S2', email: 's2@u.edu' }]);

        // 2. Seed Books (1 Book with 10 copies)
        const book = await Book.create({
            title: 'Metric Test Book',
            author: 'Tester',
            isbn: '999-0000000001',
            totalCopies: 10,
            checkedOutCount: 2 // We will create 2 txns
        });

        // 3. Create Transactions
        const student = await Student.findOne();
        await BorrowTransaction.create([
            {
                studentId: student._id,
                bookId: book._id,
                issuedAt: new Date(),
                dueDate: new Date(Date.now() + 86400000), // Active
                status: 'BORROWED'
            },
            {
                studentId: student._id,
                bookId: book._id,
                issuedAt: new Date(Date.now() - 100000000),
                dueDate: new Date(Date.now() - 50000000), // Overdue
                status: 'BORROWED'
            }
        ]);
    });

    test('Should calculate accurate inventory and overdue counts', async () => {
        const res = await request(app).get('/api/v1/library/inventory/summary');

        expect(res.statusCode).toBe(200);
        const data = res.body.data;

        // Total Copies = 10
        expect(data.totalCopies).toBe(10);

        // Active Loans = 2
        // Available = 10 - 2 = 8
        expect(data.totalCheckedOut).toBe(2);
        expect(data.totalAvailableCopies).toBe(8);

        // Overdue = 1
        expect(data.overdueCount).toBe(1);
    });
});
