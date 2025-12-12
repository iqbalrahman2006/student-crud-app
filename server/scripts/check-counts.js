const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Book = require('../src/models/Book');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb';

const checkDB = async () => {
    try {
        await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("Connected to MongoDB");

        const studentCount = await Student.countDocuments();
        console.log(`Student Count: ${studentCount}`);

        const bookCount = await Book.countDocuments();
        console.log(`Book Count: ${bookCount}`);

        if (studentCount === 0 || bookCount === 0) {
            console.log("ALERT: Database appears empty or partially empty.");
        } else {
            console.log("Database has data.");
        }

    } catch (e) {
        console.error("DB Check Error:", e);
    } finally {
        await mongoose.disconnect();
    }
};

checkDB();
