const mongoose = require('mongoose');
const Transaction = require('../../models/BorrowTransaction'); // Ensure correct model
const Book = require('../../models/Book');
const Student = require('../../models/Student');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/student_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected");

        // Find a book and student
        const book = await Book.findOne();
        const student = await Student.findOne();

        if (!book || !student) {
            console.log("No book or student found.");
            return;
        }

        // Create Overdue Transaction (Due 5 days ago)
        const daysOverdue = 5;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - daysOverdue);

        await Transaction.create({
            bookId: book._id,
            studentId: student._id,
            issuedAt: new Date(Date.now() - 86400000 * 20), // Issued 20 days ago
            dueDate: dueDate,
            status: 'BORROWED' // Matches library.js
        });

        console.log(`Seeded Overdue Transaction (Due: ${dueDate.toDateString()})`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
