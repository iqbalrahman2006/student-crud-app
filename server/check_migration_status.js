/**
 * Quick Status Check: MongoDB vs MySQL Data
 * Shows current record counts and confirms which DB has data
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { sequelize, initializeDatabase } = require('./src/config/sequelize');

const checkStatus = async () => {
    console.log('\n========== MIGRATION STATUS CHECK ==========\n');
    
    try {
        // Check MongoDB
        console.log('📊 MONGODB CHECK');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';
        console.log(`Connecting to: ${mongoUri}`);
        await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
        
        const Student = require('./src/models/Student');
        const Book = require('./src/models/Book');
        const Transaction = require('./src/models/BorrowTransaction');
        
        const mongoStudents = await Student.countDocuments();
        const mongoBooks = await Book.countDocuments();
        const mongoTxns = await Transaction.countDocuments();
        
        console.log(`  Students:     ${mongoStudents}`);
        console.log(`  Books:        ${mongoBooks}`);
        console.log(`  Transactions: ${mongoTxns}`);
        console.log(`  Total:        ${mongoStudents + mongoBooks + mongoTxns}`);
        
        await mongoose.disconnect();
        
        // Check MySQL
        console.log('\n📊 MYSQL CHECK');
        const seq = await initializeDatabase();
        
        const mysqlStudents = await seq.models.Student.count();
        const mysqlBooks = await seq.models.Book.count();
        const mysqlTxns = await seq.models.BorrowTransaction.count();
        
        console.log(`  Students:     ${mysqlStudents}`);
        console.log(`  Books:        ${mysqlBooks}`);
        console.log(`  Transactions: ${mysqlTxns}`);
        console.log(`  Total:        ${mysqlStudents + mysqlBooks + mysqlTxns}`);
        
        // Assessment
        console.log('\n📋 ASSESSMENT');
        if (mongoStudents > 0 && mysqlStudents === 0) {
            console.log('  Status: ❌ Migration needed (data in MongoDB, MySQL empty)');
            console.log('  Recommendation: Run migrate-mongo-to-mysql.js --commit');
        } else if (mysqlStudents > 0) {
            console.log('  Status: ✅ MySQL populated (safe to use)');
            if (mongoStudents > mysqlStudents) {
                console.log('  Note: MongoDB has more data; consider re-migrating');
            }
        } else {
            console.log('  Status: ⚠️  Both databases empty or unreachable');
        }
        
        await seq.close();
        
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
    
    console.log('\n============================================\n');
    process.exit(0);
};

checkStatus();
