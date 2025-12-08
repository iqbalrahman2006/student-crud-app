require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';
const SHOULD_SEED = process.argv.includes('--force') || process.env.SEED_DB === 'true';

const sampleStudents = [
    {
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        course: "Computer Science",
        gpa: 8.5,
        status: "Active",
        country: "India",
        city: "Mumbai",
        transportMode: "Bus",
        studentCategory: "Local"
    },
    {
        name: "Sarah Jenkins",
        email: "sarah.j@example.com",
        course: "Mechanical Engineering",
        gpa: 3.8, // 4.0 scale equiv
        status: "Active",
        country: "USA",
        city: "New York",
        transportMode: "Private",
        studentCategory: "International"
    },
    {
        name: "Hans Muller",
        email: "hans.m@example.com",
        course: "Electrical Engineering",
        gpa: 7.2,
        status: "Inactive",
        country: "Germany",
        city: "Berlin",
        transportMode: "Walk",
        studentCategory: "International"
    },
    {
        name: "Emily Watson",
        email: "emily.w@example.com",
        course: "Computer Science",
        gpa: 9.1,
        status: "Active",
        country: "UK",
        city: "London",
        transportMode: "Bus",
        studentCategory: "International"
    },
    {
        name: "Chen Wei",
        email: "chen.wei@example.com",
        course: "Mathematics",
        gpa: 6.5,
        status: "Graduated",
        country: "China",
        city: "Shanghai",
        transportMode: "Private",
        studentCategory: "Exchange"
    },
    {
        name: "Priya Patel",
        email: "priya.p@example.com",
        course: "Physics",
        gpa: 7.8,
        status: "Active",
        country: "India",
        city: "Ahmedabad",
        transportMode: "Bus",
        studentCategory: "Local"
    },
    {
        name: "John Smith",
        email: "john.smith@example.com",
        course: "Business",
        gpa: 2.5,
        status: "Suspended",
        country: "USA",
        city: "Chicago",
        transportMode: "Private",
        studentCategory: "Local"
    }
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
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Failed:", error);
        process.exit(1);
    }
};

seedData();
