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

const seedBooks = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("Connected to DB for Seeding...");

        const count = await Book.countDocuments();
        if (count > 50 && process.argv[2] !== '--force') {
            console.log(`Database already has ${count} books. Skipping seed. Use --force to overwrite/append.`);
            process.exit(0);
        }

        const books = generateBooks(500);
        await Book.insertMany(books);

        console.log(`✅ Successfully seeded ${books.length} books!`);
        process.exit(0);
    } catch (err) {
        console.error("Seeding Failed:", err);
        process.exit(1);
    }
};

seedBooks();
