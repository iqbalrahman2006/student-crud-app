const mongoose = require('mongoose');
const bookService = require('../../src/services/bookService');
const Book = require('../../src/models/Book');
const Student = require('../../src/models/Student');
const BookReservation = require('../../src/models/BookReservation');

describe('Reservation Service', () => {
    let bookId, studentId;

    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb_test_reservation');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await Book.deleteMany({});
        await Student.deleteMany({});
        await BookReservation.deleteMany({});

        const book = await Book.create({
            title: 'Res Test Book',
            author: 'Test Author',
            isbn: '978-0000000000',
            department: 'General',
            totalCopies: 1,
            checkedOutCount: 1
        });
        const student = await Student.create({ name: 'Test Student', email: 'test@res.com' });

        bookId = book._id;
        studentId = student._id;
    });

    test('should allow reservation when book unavailable', async () => {
        const resv = await bookService.reserveBook({ bookId, studentId });
        expect(resv).toBeDefined();
        expect(resv.status).toBe('Active');
        expect(resv.queuePosition).toBe(1);
    });

    test('should prevent double reservation', async () => {
        await bookService.reserveBook({ bookId, studentId });
        await expect(bookService.reserveBook({ bookId, studentId }))
            .rejects.toThrow('Student already has an active reservation');
    });

    test('should inc queue position', async () => {
        await bookService.reserveBook({ bookId, studentId });

        const student2 = await Student.create({ name: 'Test 2', email: 'test2@res.com' });
        const resv2 = await bookService.reserveBook({ bookId, studentId: student2._id });

        expect(resv2.queuePosition).toBe(2);
    });
});
