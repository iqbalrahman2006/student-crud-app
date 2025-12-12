const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const Student = require('../src/models/Student');
const Transaction = require('../src/models/BorrowTransaction');
const BookReservation = require('../src/models/BookReservation');
const bookService = require('../src/services/bookService');

// Increase timeout for integration tests
jest.setTimeout(30000);

describe('Library Critical Path Integration', () => {
    let bookId, studentId, student2Id;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb_test_integration');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await mongoose.connection.db.dropDatabase();

        // Setup Logic
        const book = await Book.create({
            title: 'Integration Book',
            author: 'Integration Author',
            isbn: 'INT-001',
            department: 'General',
            totalCopies: 1, // Critical: Only 1 copy
            checkedOutCount: 0
        });
        const s1 = await Student.create({ name: 'Student 1', email: 's1@test.com' });
        const s2 = await Student.create({ name: 'Student 2', email: 's2@test.com' });

        bookId = book._id;
        studentId = s1._id;
        student2Id = s2._id;
    });

    test('E2E: Borrow -> Reserve -> Return -> Fulfill', async () => {
        // 1. BORROW (Student 1)
        const txn = await bookService.issue({ bookId, studentId });
        expect(txn.status).toBe('BORROWED');

        const bookAfterBorrow = await Book.findById(bookId);
        expect(bookAfterBorrow.checkedOutCount).toBe(1);
        expect(bookAfterBorrow.availableCopies).toBe(0); // Should be 0 now

        // 2. RESERVE (Student 2) - Should Succeed because copies=0
        const reservation = await bookService.reserveBook({
            bookId,
            studentId: student2Id
        });
        expect(reservation.status).toBe('Active');
        expect(reservation.queuePosition).toBe(1);

        // 3. RETURN (Student 1)
        const returnRes = await bookService.returnBook(txn._id);
        expect(returnRes.transaction.status).toBe('RETURNED');
        expect(returnRes.transaction.returnedAt).toBeDefined();

        // 4. CHECK FULFILLMENT
        // Book should be checked in (checkedOutCount 0)
        // But Reservation should be FULFILLED
        const bookAfterReturn = await Book.findById(bookId);
        expect(bookAfterReturn.checkedOutCount).toBe(0);

        const fulfilledRes = await BookReservation.findById(reservation._id);
        expect(fulfilledRes.status).toBe('Fulfilled');
        expect(fulfilledRes.fulfilledAt).toBeDefined();
    });

    test('Validation: Cannot Reserve if Available', async () => {
        // Book has 1 copy available
        await expect(bookService.reserveBook({ bookId, studentId }))
            .rejects.toThrow(/available for immediate issue/);
    });

    test('History: Transaction Populates Book Details', async () => {
        const txn = await bookService.issue({ bookId, studentId });
        const historyTxn = await Transaction.findById(txn._id).populate('bookId');

        expect(historyTxn.bookId).toBeDefined();
        expect(historyTxn.bookId.title).toBe('Integration Book');
    });
});
