const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Book = require('../src/models/Book');
const LibraryAuditLog = require('../src/models/LibraryAuditLog');
const Transaction = require('../src/models/BorrowTransaction');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.disconnect(); // Ensure clean state
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Book.deleteMany({});
    await LibraryAuditLog.deleteMany({});
    await Transaction.deleteMany({});
});

describe('Library Backend & Inventory Engine', () => {

    test('Should create book and init default values', async () => {
        const res = await request(app)
            .post('/api/v1/library/books')
            .set('x-role', 'ADMIN') // Bypass RBAC
            .send({
                title: 'Clean Code',
                author: 'Robert Martin',
                isbn: '978-0132350884',
                totalCopies: 5,
                department: 'Computer Science'
            });

        expect(res.status).toBe(201);
        expect(res.body.data.availableCopies).toBe(5);
        expect(res.body.data.checkedOutCount).toBe(0);

        // Audit Check
        const logs = await LibraryAuditLog.find();
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('ADD');
    });

    test('Should decrement availableCopies on Issue', async () => {
        // Setup Book
        const book = await Book.create({
            title: 'Test Book', author: 'Test', isbn: '12345',
            totalCopies: 2, checkedOutCount: 0, availableCopies: 2
        });

        // Issue
        const res = await request(app)
            .post('/api/v1/library/issue')
            .set('x-role', 'LIBRARIAN')
            .send({
                bookId: book._id,
                studentId: new mongoose.Types.ObjectId(), // Fake Student ID
                days: 7
            });

        expect(res.status).toBe(201);

        // Verify DB State
        const updatedBook = await Book.findById(book._id);
        expect(updatedBook.checkedOutCount).toBe(1);
        expect(updatedBook.availableCopies).toBe(1);
    });

    test('Should correct status to Out of Stock when Copies=0', async () => {
        const book = await Book.create({
            title: 'Popular Book', author: 'Guy', isbn: '999',
            totalCopies: 1, checkedOutCount: 0
        });

        // Issue last copy
        await request(app).post('/api/v1/library/issue')
            .set('x-role', 'ADMIN')
            .send({ bookId: book._id, studentId: new mongoose.Types.ObjectId() });

        const updatedBook = await Book.findById(book._id);
        expect(updatedBook.availableCopies).toBe(0);
        expect(updatedBook.status).toBe('Out of Stock');
    });

    test('Inventory Summary Endpoint', async () => {
        const bookA = await Book.create({ title: 'A', author: 'A', isbn: '1', totalCopies: 10, checkedOutCount: 2, availableCopies: 8 });
        const bookB = await Book.create({ title: 'B', author: 'B', isbn: '2', totalCopies: 5, checkedOutCount: 5, availableCopies: 0 });

        // Create transactions to match checkedOutCount since service relies on Transaction count
        const txns = [];
        for (let i = 0; i < 2; i++) txns.push({ bookId: bookA._id, studentId: new mongoose.Types.ObjectId(), status: 'BORROWED' });
        for (let i = 0; i < 5; i++) txns.push({ bookId: bookB._id, studentId: new mongoose.Types.ObjectId(), status: 'BORROWED' });
        await Transaction.insertMany(txns);

        const res = await request(app).get('/api/v1/library/inventory/summary');

        expect(res.status).toBe(200);
        expect(res.body.data.totalCopies).toBe(15);
        expect(res.body.data.totalAvailableCopies).toBe(8);
        expect(res.body.data.totalDistinctBooks).toBe(2);
    });

});
