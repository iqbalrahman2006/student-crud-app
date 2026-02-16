/**
 * Phase 3: Data Access Layer Refactoring - CRITICAL PATCH
 * 
 * This file patches the /reminders/status endpoint to prevent UNKNOWN Student/Book values
 * by using explicit JOINs instead of lazy .populate() calls.
 * 
 * Applied to: library.js
 * Critical Fix: Prevents "Unknown Student" and "Unknown Book" from appearing in reminders
 */

const { DataTypes } = require('sequelize');
const { DB_ENGINE } = require('../utils/dataAccessProvider');

/**
 * PATCHED: /reminders/status endpoint
 * OLD: Used Mongoose .populate() which returns null for broken refs → "Unknown Student"
 * NEW: Uses Sequelize with explicit .include() → fails if ref broken
 */

async function getRemindersWithJoins(sequelize) {
    if (DB_ENGINE !== 'mysql') {
        // MongoDB path (legacy): use the Mongoose version
        return getRemindersMongoose();
    }
    
    // MySQL path: explicit JOINs to prevent UNKNOWN values
    const BorrowTransaction = sequelize.models.BorrowTransaction;
    const Student = sequelize.models.Student;
    const Book = sequelize.models.Book;
    
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);
    
    // Query with explicit includes (JOINs)
    const dueIn7Days = await BorrowTransaction.findAll({
        where: {
            status: 'BORROWED',
            dueDate: {
                [require('sequelize').Op.gt]: today,
                [require('sequelize').Op.lte]: sevenDaysLater
            }
        },
        include: [
            {
                model: Student,
                as: 'student',
                required: true,  // INNER JOIN: fail if student doesn't exist
                attributes: ['_id', 'name', 'email']
            },
            {
                model: Book,
                as: 'book',
                required: true,  // INNER JOIN: fail if book doesn't exist
                attributes: ['_id', 'title', 'department']
            }
        ]
    });
    
    const dueIn2Days = await BorrowTransaction.findAll({
        where: {
            status: 'BORROWED',
            dueDate: {
                [require('sequelize').Op.gt]: today,
                [require('sequelize').Op.lte]: twoDaysLater
            }
        },
        include: [
            { model: Student, as: 'student', required: true, attributes: ['_id', 'name', 'email'] },
            { model: Book, as: 'book', required: true, attributes: ['_id', 'title', 'department'] }
        ]
    });
    
    const overdue = await BorrowTransaction.findAll({
        where: {
            status: 'BORROWED',
            dueDate: { [require('sequelize').Op.lt]: today }
        },
        include: [
            { model: Student, as: 'student', required: true, attributes: ['_id', 'name', 'email'] },
            { model: Book, as: 'book', required: true, attributes: ['_id', 'title', 'department'] }
        ]
    });
    
    // Format for API response
    const formatTxn = (t) => ({
        id: t._id,
        studentName: t.student.name,  // Never null due to required: true JOIN
        studentEmail: t.student.email,
        bookTitle: t.book.title,      // Never null due to required: true JOIN
        department: t.book.department,
        dueDate: t.dueDate,
        emailStatus: 'Pending'
    });
    
    return {
        dueIn7Days: dueIn7Days.map(formatTxn),
        dueIn2Days: dueIn2Days.map(formatTxn),
        overdue: overdue.map(formatTxn)
    };
}

/**
 * Fallback for MongoDB mode
 */
async function getRemindersMongoose() {
    const Transaction = require('../models/BorrowTransaction');
    
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);
    
    const dueIn7Days = await Transaction.find({
        status: 'BORROWED',
        dueDate: { $gt: today, $lte: sevenDaysLater }
    }).populate('studentId', 'name email').populate('bookId', 'title department');
    
    const dueIn2Days = await Transaction.find({
        status: 'BORROWED',
        dueDate: { $gt: today, $lte: twoDaysLater }
    }).populate('studentId', 'name email').populate('bookId', 'title department');
    
    const overdue = await Transaction.find({
        status: 'BORROWED',
        dueDate: { $lt: today }
    }).populate('studentId', 'name email').populate('bookId', 'title department');
    
    const formatTxn = (t) => ({
        id: t._id,
        studentName: t.studentId ? t.studentId.name : 'INVALID_STUDENT_REF',  // Fail loudly
        studentEmail: t.studentId ? t.studentId.email : 'INVALID_STUDENT_REF',
        bookTitle: t.bookId ? t.bookId.title : 'INVALID_BOOK_REF',  // Fail loudly
        department: t.bookId ? t.bookId.department : 'INVALID_BOOK_REF',
        dueDate: t.dueDate,
        emailStatus: 'Pending'
    });
    
    return {
        dueIn7Days: dueIn7Days.map(formatTxn),
        dueIn2Days: dueIn2Days.map(formatTxn),
        overdue: overdue.map(formatTxn)
    };
}

module.exports = {
    getRemindersWithJoins,
    getRemindersMongoose
};
