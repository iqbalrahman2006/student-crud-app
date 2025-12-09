const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config();

// Connect to DB (copied logic normally found in server.js)
const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/studentdb";

// Genre-Specific Data
const genreData = {
    'Computer Science': ['Introduction to Algorithms', 'Clean Code', 'Design Patterns', 'Structure and Interpretation of Computer Programs', 'Artificial Intelligence: A Modern Approach', 'The Pragmatic Programmer', 'Introduction to the Theory of Computation', 'Computer Networking: A Top-Down Approach', 'Operating System Concepts', 'Database System Concepts'],
    'Electrical': ['Fundamentals of Electric Circuits', 'Microelectronic Circuits', 'Electric Machinery', 'Power System Analysis', 'Control Systems Engineering', 'Digital Signal Processing', 'Electromagnetics', 'Modern Digital and Analog Communication Systems', 'Principles of Electronics', 'Solid State Physics'],
    'Mechanical': ['Engineering Mechanics', 'Fluid Mechanics', 'Thermodynamics: An Engineering Approach', 'Shigley\'s Mechanical Engineering Design', 'Heat Transfer', 'Manufacturing Engineering and Technology', 'Theory of Machines', 'Strength of Materials', 'Robotics Modelling', 'Finite Element Method'],
    'Civil': ['Structural Analysis', 'Soil Mechanics', 'Fluid Mechanics for Civil Engineers', 'Surveying', 'Concrete Technology', 'Hydrology', 'Transportation Engineering', 'Construction Management', 'Environmental Engineering', 'Geotechnical Engineering'],
    'Literature': ['To Kill a Mockingbird', '1984', 'The Great Gatsby', 'Pride and Prejudice', 'The Catcher in the Rye', 'Animal Farm', 'Brave New World', 'The Hobbit', 'Fahrenheit 451', 'Lord of the Flies'],
    'Philosophy': ['Meditations', 'The Republic', 'Critique of Pure Reason', 'Beyond Good and Evil', 'The Nichomachean Ethics', 'Being and Time', 'The Symposium', 'Letters from a Stoic', 'Tao Te Ching', 'The Prince'],
    'Business': ['The Lean Startup', 'Thinking, Fast and Slow', 'Good to Great', 'Zero to One', 'Influence: The Psychology of Persuasion', 'The Intelligent Investor', 'Principles', 'Atomic Habits', 'Rich Dad Poor Dad', 'Shoe Dog'],
    'Medicine': ['Gray\'s Anatomy', 'Harrison\'s Principles of Internal Medicine', 'Guyton and Hall Textbook of Medical Physiology', 'Robbins Basic Pathology', 'The Merck Manual', 'Atlas of Human Anatomy', 'Bates\' Guide to Physical Examination', 'Fundamental Neuroscience', 'Immunology', 'First Aid for the USMLE']
};

const generateBooks = (count) => {
    const books = [];
    const cats = Object.keys(genreData);

    for (let i = 0; i < count; i++) {
        const category = cats[i % cats.length]; // Distribute evenly
        const possibleTitles = genreData[category];
        const baseTitle = possibleTitles[Math.floor(Math.random() * possibleTitles.length)];
        const title = `${baseTitle} (Vol. ${Math.floor(Math.random() * 5) + 1})`;

        books.push({
            title: title,
            author: `Author ${Math.floor(Math.random() * 500)}`,
            isbn: `978-${Math.floor(100000000000 + Math.random() * 900000000000).toString().substring(0, 13)}`,
            genre: category,
            department: ['Medicine', 'Business', 'Literature', 'Philosophy'].includes(category) ? 'General' : category,
            totalCopies: Math.floor(Math.random() * 8) + 2,
            availableCopies: Math.floor(Math.random() * 5) + 1,
            status: 'Available'
        });
    }
    return books;
};

// ... imports
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

// ... generateBooks function stays same ...

const seedTransactions = async (books) => {
    console.log("   > Generating Transactions for defined Popularity...");
    const students = await Student.find().limit(50); // Get some students
    if (students.length === 0) {
        console.warn("   ! No students found. Skipping transaction seeding.");
        return;
    }

    // Pick 5-8 random books to be "Popular"
    const popularBooks = [];
    for (let i = 0; i < 8; i++) {
        popularBooks.push(books[Math.floor(Math.random() * books.length)]);
    }

    const transactions = [];

    // For each popular book, create 5-15 transactions
    for (const book of popularBooks) {
        const txCount = Math.floor(Math.random() * 10) + 5;
        console.log(`     - Ref: ${book.title} will have ${txCount} issues.`);

        for (let j = 0; j < txCount; j++) {
            const student = students[Math.floor(Math.random() * students.length)];
            const isReturned = Math.random() > 0.3; // 70% returned

            const issueDate = new Date();
            issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 60) - 1); // 1-60 days ago

            const dueDate = new Date(issueDate);
            dueDate.setDate(dueDate.getDate() + 14);

            const tx = {
                book: book._id,
                student: student._id,
                issueDate: issueDate,
                dueDate: dueDate,
                status: isReturned ? 'Returned' : 'Issued',
                returnDate: isReturned ? new Date(dueDate.getTime() + (Math.random() * 86400000 * 5 * (Math.random() > 0.5 ? 1 : -1))) : null,
                fine: 0,
                renewalCount: Math.floor(Math.random() * 2)
            };
            transactions.push(tx);
        }
    }

    if (transactions.length > 0) {
        await Transaction.insertMany(transactions);
        console.log(`   + Seeded ${transactions.length} Transactions.`);
    }
};

const seedBooks = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("Connected to DB for Seeding...");

        // Strategy: Append if existing, or fill if empty.
        const count = await Book.countDocuments();
        let createdBooks = [];

        if (count > 600 && process.argv[2] !== '--force') {
            console.log(`Database has ${count} books. Adding 100 more...`);
            const newBooks = generateBooks(100);
            createdBooks = await Book.insertMany(newBooks);
            console.log(`✅ Added 100 new books.`);
        } else if (count <= 600) {
            console.log("Seeding base ~200 books...");
            const books = generateBooks(200);
            createdBooks = await Book.insertMany(books);
            console.log(`✅ Seeded ${books.length} books.`);
        }

        // Always seed transactions for popularity if we added books OR if force used
        // To be safe, let's just fetch ALL books now and pick some for transactions 
        // ensuring we use valid IDs from DB
        const allBooks = await Book.find().limit(500);
        await seedTransactions(allBooks);

        console.log("✅ Seeding Logic Complete.");
        process.exit(0);
    } catch (err) {
        console.error("Seeding Failed:", err);
        process.exit(1);
    }
};

seedBooks();
