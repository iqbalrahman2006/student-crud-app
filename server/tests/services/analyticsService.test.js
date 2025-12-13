const mongoose = require('mongoose');
const analyticsService = require('../../src/services/analyticsService');
const Book = require('../../src/models/Book');
const Transaction = require('../../src/models/BorrowTransaction');

describe('Analytics Service', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb_test_service');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Book.deleteMany({});
        await Transaction.deleteMany({});

        // Seed
        const book = await Book.create({ title: 'Test Book', author: 'Test Author', isbn: 'TEST-123', totalCopies: 5, checkedOutCount: 1 });
        await Transaction.create({
            bookId: book._id,
            studentId: new mongoose.Types.ObjectId(),
            status: 'BORROWED',
            dueDate: new Date(Date.now() - 10000), // Overdue
            issuedAt: new Date()
        });
    });

    test('getDashboardStats should return correct counts', async () => {
        const stats = await analyticsService.getDashboardStats();

        expect(stats.totalBooks).toBe(1);
        expect(stats.overdueCount).toBe(1);
        expect(stats.borrowedToday).toBe(1);
    });

    test('getInventorySummary should return correct summary', async () => {
        const summary = await analyticsService.getInventorySummary();

        expect(summary.totalCopies).toBe(5);
        expect(summary.totalCheckedOut).toBe(1);
        expect(summary.totalAvailableCopies).toBe(4);
    });
});
