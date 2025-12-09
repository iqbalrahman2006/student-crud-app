require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');
const Book = require('../src/models/Book');
const Transaction = require('../src/models/Transaction');

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb');
        console.log("🔍 Verifying Data Integrity...");

        const students = await Student.countDocuments();
        const books = await Book.countDocuments();
        const txns = await Transaction.countDocuments();
        const popularBooks = await Transaction.aggregate([
            { $group: { _id: "$book", count: { $sum: 1 } } },
            { $match: { count: { $gt: 0 } } }
        ]);

        console.log(`\n---------------------------`);
        console.log(`👥 Students:     ${students} (Expected > 50)`);
        console.log(`📚 Books:        ${books} (Expected > 200)`);
        console.log(`📜 Transactions: ${txns} (Expected > 10)`);
        console.log(`⭐ Popular Books With Data: ${popularBooks.length}`);
        console.log(`---------------------------\n`);

        if (students > 50 && books > 200 && txns > 10) {
            console.log("✅ VERIFICATION PASSED");
            process.exit(0);
        } else {
            console.error("❌ VERIFICATION FAILED - Counts too low.");
            process.exit(1);
        }

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

verify();
