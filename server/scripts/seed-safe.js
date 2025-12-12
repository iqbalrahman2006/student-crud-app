const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../src/models/Student');
const Book = require('../src/models/Book');

// Load env vars
dotenv.config({ path: './.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB for Seeding...');

        // Safe Defaults
        const MAX_STUDENTS = 100;
        const MAX_BOOKS = 500;

        // --- CLEAR EXISTING DATA ---
        console.log('🧹 Clearing Collections...');
        await Student.deleteMany({});
        await Book.deleteMany({});


        // --- REALISTIC DATA GENERATORS ---
        const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson'];

        const bookAdjectives = ['Advanced', 'Introduction to', 'Fundamentals of', 'Modern', 'Classic', 'Applied', 'Theoretical', 'Essential', 'Mastering', 'The Art of'];
        const bookSubjects = ['Python', 'Calculus', 'Microeconomics', 'Organic Chemistry', 'World History', 'Thermodynamics', 'Machine Learning', 'Data Structures', 'Quantum Physics', 'Digital Logic', 'Marketing', 'Sociology'];
        const bookAuthors = ['Robert C. Martin', 'Kyle Simpson', 'Andrew Ng', 'Donald Knuth', 'Douglas Crockford', 'Linus Torvalds', 'Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Margaret Hamilton'];

        const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        // --- SEED STUDENTS ---
        console.log(`🌱 Seeding Students (Limit: ${MAX_STUDENTS})...`);
        const departments = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Business'];
        const shelfLocations = ['A1', 'B2', 'C3', 'Reference', 'Stacks-West', 'Stacks-East'];

        const students = Array.from({ length: MAX_STUDENTS }).map((_, i) => {
            const firstName = getRandom(firstNames);
            const lastName = getRandom(lastNames);
            const fullName = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@university.edu`;

            return {
                name: fullName,
                email: email,
                department: getRandom(departments),
                course: getRandom(departments), // Fallback
                status: Math.random() > 0.1 ? 'Active' : 'Inactive',
                enrollmentDate: new Date(),
                gpa: (2.0 + Math.random() * 2.0).toFixed(2),
                phone: `555-01${String(i).padStart(2, '0')}`,
                city: 'New York',
                country: 'USA',
                lastBorrowDate: Math.random() > 0.5 ? new Date() : null,
                borrowedBooksCount: Math.floor(Math.random() * 5)
            };
        });

        await Student.insertMany(students);
        console.log(`✅ ${students.length} Students Inserted.`);


        // --- SEED BOOKS ---
        console.log(`🌱 Seeding Books (Limit: ${MAX_BOOKS})...`);

        // Exact Categories as requested
        const categories = [
            'Computer Science', 'Electrical', 'Civil', 'Mechanical', // Engineering
            'Fiction', 'Philosophy', 'Science', 'History', 'Management', 'Mathematics', 'AI / ML'
        ];

        const books = Array.from({ length: MAX_BOOKS }).map((_, i) => {
            const total = Math.floor(Math.random() * 10) + 1;
            const checkedOut = Math.floor(Math.random() * total);
            // Ensure we use a valid category from our new list
            const category = getRandom(categories);

            return {
                title: `${getRandom(bookAdjectives)} ${category} ${i + 1}`,
                author: getRandom(bookAuthors),
                isbn: `978-${Math.floor(Math.random() * 10000000000)}`,
                department: category,
                shelfLocation: getRandom(shelfLocations),
                popularityIndex: Math.floor(Math.random() * 100),
                totalCopies: total,
                checkedOutCount: checkedOut,
                availableCopies: total - checkedOut,
                status: (total - checkedOut) > 0 ? 'Available' : 'Out of Stock'
            };
        });
        await Book.insertMany(books);
        console.log(`✅ ${books.length} Books Inserted.`);

        console.log('🎉 Seeding Complete!');
        process.exit();

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedData();
