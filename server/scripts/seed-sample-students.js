require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';
const SHOULD_SEED = process.argv.includes('--force') || process.env.SEED_DB === 'true';

// Data Arrays for Random Generation
const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Donald", "Sandra"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const courses = ["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Physics", "Mathematics", "Business", "Economics", "Psychology", "History", "Biology", "Chemistry", "Political Science", "Sociology", "Philosophy"];
const cities = [
    { city: "New York", country: "USA" }, { city: "London", country: "UK" }, { city: "Mumbai", country: "India" },
    { city: "Sydney", country: "Australia" }, { city: "Toronto", country: "Canada" }, { city: "Berlin", country: "Germany" },
    { city: "Paris", country: "France" }, { city: "Tokyo", country: "Japan" }, { city: "Dubai", country: "UAE" },
    { city: "Singapore", country: "Singapore" }, { city: "Seoul", country: "South Korea" }, { city: "Shanghai", country: "China" }
];

const generateRandomStudents = (count) => {
    const students = [];
    for (let i = 0; i < count; i++) {
        const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const loc = cities[Math.floor(Math.random() * cities.length)];

        students.push({
            name: `${fName} ${lName}`,
            email: `${fName.toLowerCase()}.${lName.toLowerCase()}${Math.floor(Math.random() * 9999)}@example.com`,
            course: courses[Math.floor(Math.random() * courses.length)],
            gpa: parseFloat((Math.random() * 4 + 6).toFixed(1)), // 6.0 - 10.0
            status: Math.random() > 0.1 ? "Active" : ["Inactive", "Suspended", "Graduated"][Math.floor(Math.random() * 3)],
            country: loc.country,
            city: loc.city,
            transportMode: ["Bus", "Walk", "Private", "Subway"][Math.floor(Math.random() * 4)],
            studentCategory: Math.random() > 0.3 ? "Local" : "International"
        });
    }
    return students;
};

const sampleStudents = [
    // Keep a few static ones for deterministic testing if needed
    { name: "Rahul Sharma", email: "rahul.sharma@example.com", course: "Computer Science", gpa: 8.5, status: "Active", country: "India", city: "Mumbai", transportMode: "Bus", studentCategory: "Local" },
    ...generateRandomStudents(75) // Generate 75 random students
];

const seedData = async () => {
    if (!SHOULD_SEED) {
        console.warn("⚠️  SEEDING SKIPPED: Use 'SEED_DB=true' env or '--force' flag to run.");
        console.log("   Example: node server/scripts/seed-sample-students.js --force");
        process.exit(0);
    }

    try {
        await mongoose.connect(MONGODB_URI);
        console.log("📦 Connected to MongoDB for Seeding...");

        // Check for existing duplicates to avoid unique index errors
        let insertedCount = 0;
        for (const student of sampleStudents) {
            const exists = await Student.findOne({ email: student.email });
            if (!exists) {
                await Student.create(student);
                console.log(`   + Inserted: ${student.name}`);
                insertedCount++;
            } else {
                console.log(`   ~ Skipped (Exists): ${student.name}`);
            }
        }

        console.log(`\n✅ Seeding Complete. Added ${insertedCount} new students.`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedData();
