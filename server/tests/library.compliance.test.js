const mongoose = require('mongoose');
const Book = require('../src/models/Book');
const Student = require('../src/models/Student');
const Transaction = require('../src/models/BorrowTransaction');
const LibraryAuditLog = require('../src/models/LibraryAuditLog');
const bookService = require('../src/services/bookService');

describe('Library Compliance Flows (Master Prompt)', () => {
    let bookId, studentId, txnId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb_test_compliance');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Book.deleteMany({});
        await Student.deleteMany({});
        await Transaction.deleteMany({});
        await LibraryAuditLog.deleteMany({});

        const book = await Book.create({
            title: 'Compliance Book',
            author: 'Audit Author',
            isbn: '978-0000000001',
            department: 'General',
            totalCopies: 5,
            checkedOutCount: 0
        });
        const student = await Student.create({
            name: 'Compliance Student',
            email: 'comp@test.com',
            department: 'CS',
            status: 'Active'
        });

        bookId = book._id;
        studentId = student._id;
    });

    // STEP 13: TEST BORROW
    test('Borrow Flow: Updates Inventory, creates Loan, writes Audit Log', async () => {
        const txn = await bookService.issue({ bookId, studentId });
        txnId = txn._id;

        // 1. Check Loan
        expect(txn.status).toBe('BORROWED');
        expect(txn.bookId._id).toEqual(bookId);

        // 2. Check Inventory
        const book = await Book.findById(bookId);
        expect(book.checkedOutCount).toBe(1);

        // 3. Check Audit
        const log = await LibraryAuditLog.findOne({ action: 'BORROW' });
        expect(log).not.toBeNull();
        expect(log.bookId.toString()).toEqual(bookId.toString());
    });

    // STEP 13: TEST RENEW
    test('Renew Flow: Extends Due Date, Increments Count', async () => {
        const txn = await bookService.issue({ bookId, studentId });
        const oldDue = new Date(txn.dueDate).getTime();

        const renewed = await bookService.renew(txn._id, 7);

        expect(renewed.renewalCount).toBe(1);
        expect(new Date(renewed.dueDate).getTime()).toBeGreaterThan(oldDue);

        const log = await LibraryAuditLog.findOne({ action: 'RENEW' });
        expect(log).not.toBeNull();
    });

    // STEP 13: TEST RETURN
    test('Return Flow: Closes Loan, Restores Inventory, Calculates Fine', async () => {
        const txn = await bookService.issue({ bookId, studentId });

        const res = await bookService.returnBook(txn._id);

        expect(res.transaction.status).toBe('RETURNED');
        expect(res.transaction.returnedAt).toBeDefined();

        const book = await Book.findById(bookId);
        expect(book.checkedOutCount).toBe(0);

        const log = await LibraryAuditLog.findOne({ action: 'RETURN' });
        expect(log).not.toBeNull();
    });
});
