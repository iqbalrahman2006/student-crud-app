const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Book = require('../models/Book');
const Transaction = require('../models/BorrowTransaction');
const ensureLibraryRole = require('../middleware/rbac');

// Generate Weekly Report
router.get('/weekly', ensureLibraryRole(['ADMIN', 'LIBRARIAN']), async (req, res) => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const newStudents = await Student.countDocuments({ createdAt: { $gte: oneWeekAgo } });
        const newBooks = await Book.countDocuments({ createdAt: { $gte: oneWeekAgo } });
        const activeLoans = await Transaction.countDocuments({ status: 'BORROWED' });
        const overdueLoans = await Transaction.countDocuments({ status: 'BORROWED', dueDate: { $lt: new Date() } });

        const reportData = {
            generatedAt: new Date().toISOString(),
            metrics: {
                "New Students (Last 7 Days)": newStudents,
                "New Books (Last 7 Days)": newBooks,
                "Current Active Loans": activeLoans,
                "Current Overdue Loans": overdueLoans,
                "System Status": "Nominal"
            }
        };

        res.status(200).json({ status: 'success', data: reportData.metrics, meta: { generatedAt: reportData.generatedAt } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
