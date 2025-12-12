
const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Book = require('../src/models/Book');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

describe('Data Integrity & Stability Check', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb');
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('Should have seeded realistic students', async () => {
        const count = await Student.countDocuments();
        expect(count).toBeGreaterThanOrEqual(100);

        const sample = await Student.findOne();
        expect(sample.name).not.toMatch(/Student \d+/);
        expect(sample.email).not.toMatch(/student\d+@university/);
        expect(sample.email).toContain('@university.edu');
    });

    test('Should have seeded realistic books', async () => {
        const count = await Book.countDocuments();
        expect(count).toBeGreaterThanOrEqual(100);

        const sample = await Book.findOne();
        expect(sample.title).not.toMatch(/Book Title \d+/);
        expect(sample.status).toMatch(/Available|Out of Stock/);
        expect(sample.availableCopies).toBeGreaterThanOrEqual(0);
    });

    test('Should have valid inventory summary data', async () => {
        // We can't easily test the API endpoint here without supertest app, 
        // but we can verify the data aggregates that the API would use.
        const totalCopies = await Book.aggregate([
            { $group: { _id: null, total: { $sum: "$totalCopies" } } }
        ]);
        expect(totalCopies[0].total).toBeGreaterThan(0);
    });
});
