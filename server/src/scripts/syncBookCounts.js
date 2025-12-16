const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Transaction = require('../models/BorrowTransaction');

// Register models
require('../models/Student');

const syncCounts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Sync");

        const books = await Book.find();
        console.log(`Found ${books.length} books. Checking consistency...`);

        let updatedCount = 0;
        let discrepancies = 0;

        for (const book of books) {
            // Count actual active transactions for this book
            const activeCount = await Transaction.countDocuments({
                bookId: book._id,
                status: 'BORROWED' // Ensure this matches your "Active" status string
            });

            if (book.checkedOutCount !== activeCount) {
                console.log(`Mismatch for "${book.title}": stored=${book.checkedOutCount}, actual=${activeCount}. Fixing...`);
                book.checkedOutCount = activeCount;
                await book.save();
                updatedCount++;
                discrepancies++;
            }
        }

        console.log(`Sync Complete. Found ${discrepancies} discrepancies. Updated ${updatedCount} books.`);
        process.exit(0);
    } catch (e) {
        console.error("Sync Failed", e);
        process.exit(1);
    }
};

syncCounts();
