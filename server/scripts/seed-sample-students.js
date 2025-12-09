require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../src/models/Student');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';
const SHOULD_SEED = process.argv.includes('--force') || process.env.SEED_DB === 'true';

const sampleStudents = [
    // Engineering - CS
    { name: "Rahul Sharma", email: "rahul.sharma@example.com", course: "Computer Science", gpa: 8.5, status: "Active", country: "India", city: "Mumbai", transportMode: "Bus", studentCategory: "Local" },
    { name: "Emily Watson", email: "emily.w@example.com", course: "Computer Science", gpa: 9.1, status: "Active", country: "UK", city: "London", transportMode: "Bus", studentCategory: "International" },
    { name: "Carlos Menendez", email: "carlos.m@example.com", course: "Computer Science", gpa: 7.4, status: "Active", country: "Spain", city: "Madrid", transportMode: "Walk", studentCategory: "International" },

    // Engineering - Electrical
    { name: "Hans Muller", email: "hans.m@example.com", course: "Electrical Engineering", gpa: 7.2, status: "Inactive", country: "Germany", city: "Berlin", transportMode: "Walk", studentCategory: "International" },
    { name: "Sarah Jenkins", email: "sarah.j@example.com", course: "Electrical Engineering", gpa: 3.8, status: "Active", country: "USA", city: "New York", transportMode: "Private", studentCategory: "International" },

    // Engineering - Mechanical
    { name: "Ahmed Al-Sayed", email: "ahmed.a@example.com", course: "Mechanical Engineering", gpa: 8.0, status: "Graduated", country: "UAE", city: "Dubai", transportMode: "Private", studentCategory: "International" },
    { name: "John Smith", email: "john.smith@example.com", course: "Mechanical Engineering", gpa: 2.5, status: "Suspended", country: "USA", city: "Chicago", transportMode: "Private", studentCategory: "Local" },

    // Science - Physics
    { name: "Priya Patel", email: "priya.p@example.com", course: "Physics", gpa: 7.8, status: "Active", country: "India", city: "Ahmedabad", transportMode: "Bus", studentCategory: "Local" },
    { name: "Yuki Tanaka", email: "yuki.t@example.com", course: "Physics", gpa: 9.5, status: "Active", country: "Japan", city: "Tokyo", transportMode: "Subway", studentCategory: "International" },

    // Science - Mathematics
    { name: "Chen Wei", email: "chen.wei@example.com", course: "Mathematics", gpa: 6.5, status: "Graduated", country: "China", city: "Shanghai", transportMode: "Private", studentCategory: "Exchange" },
    { name: "Alice Dubois", email: "alice.d@example.com", course: "Mathematics", gpa: 8.9, status: "Active", country: "France", city: "Paris", transportMode: "Walk", studentCategory: "International" },

    // Business
    { name: "Fatima Hassan", email: "fatima.h@example.com", course: "Business", gpa: 8.2, status: "Active", country: "Egypt", city: "Cairo", transportMode: "Car", studentCategory: "International" },
    { name: "Robert Brown", email: "robert.b@example.com", course: "Business", gpa: 5.5, status: "Inactive", country: "USA", city: "Seattle", transportMode: "Bus", studentCategory: "Local" },
    { name: "Sofia Rossi", email: "sofia.r@example.com", course: "Business", gpa: 9.0, status: "Active", country: "Italy", city: "Rome", transportMode: "Scooter", studentCategory: "International" },

    // Arts
    { name: "Liam O'Connor", email: "liam.o@example.com", course: "Arts", gpa: 7.5, status: "Active", country: "Ireland", city: "Dublin", transportMode: "Walk", studentCategory: "International" },
    { name: "Kim Min-ji", email: "kim.m@example.com", course: "Arts", gpa: 8.8, status: "Active", country: "South Korea", city: "Seoul", transportMode: "Subway", studentCategory: "Exchange" }
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
