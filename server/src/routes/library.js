const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student'); // Assuming Student model exists

// --- BOOK ROUTES ---

// GET All Books
router.get('/books', async (req, res) => {
    try {
        const books = await Book.find().sort({ title: 1 });
        res.status(200).json({ status: 'success', results: books.length, data: books });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ADD Book
router.post('/books', async (req, res) => {
    try {
        const newBook = await Book.create(req.body);
        res.status(201).json({ status: 'success', data: newBook });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// UPDATE Book
router.patch('/books/:id', async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!book) return res.status(404).json({ status: 'fail', message: 'Book not found' });
        res.status(200).json({ status: 'success', data: book });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// DELETE Book
router.delete('/books/:id', async (req, res) => {
    try {
        await Book.findByIdAndDelete(req.params.id);
        res.status(204).json({ status: 'success', data: null });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- TRANSACTION ROUTES ---

// ISSUE Book
router.post('/issue', async (req, res) => {
    try {
        const { bookId, studentId, days = 14 } = req.body;

        // 1. Checks
        const book = await Book.findById(bookId);
        if (!book || book.availableCopies < 1) {
            return res.status(400).json({ status: 'fail', message: 'Book not available' });
        }

        // Check student limits (Optional logic placeholder)
        // const activeIssues = await Transaction.countDocuments({ student: studentId, status: 'Issued' });
        // if (activeIssues >= 5) throw new Error("Student limit reached");

        // 2. Create Transaction
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + days);

        const transaction = await Transaction.create({
            book: bookId,
            student: studentId,
            issueDate: Date.now(),
            dueDate: dueDate,
            status: 'Issued'
        });

        // 3. Update Book Inventory
        book.availableCopies -= 1;
        await book.save();

        // Populate for response
        const populated = await Transaction.findById(transaction._id).populate('book').populate('student');

        res.status(201).json({ status: 'success', data: populated });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// RETURN Book
router.post('/return', async (req, res) => {
    try {
        const { transactionId } = req.body;
        const txn = await Transaction.findById(transactionId);
        if (!txn || txn.status === 'Returned') {
            return res.status(404).json({ status: 'fail', message: 'Active transaction not found' });
        }

        // Update Transaction
        txn.returnDate = Date.now();
        txn.status = 'Returned';

        // Calculate Fine (Simple Logic: 1 unit per day late)
        const diffTime = Math.abs(txn.returnDate - txn.dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (txn.returnDate > txn.dueDate) {
            txn.fine = diffDays * 1; // $1 per day
        }
        await txn.save();

        // Update Book Inventory
        const book = await Book.findById(txn.book);
        if (book) {
            book.availableCopies += 1;
            await book.save();
        }

        res.status(200).json({ status: 'success', data: txn });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// RENEW Book
router.post('/renew', async (req, res) => {
    try {
        const { transactionId, days = 7 } = req.body;
        const txn = await Transaction.findById(transactionId);

        if (!txn || txn.status !== 'Issued') {
            return res.status(400).json({ status: 'fail', message: 'Cannot renew this transaction' });
        }

        // Update Due Date
        const currentDue = new Date(txn.dueDate);
        currentDue.setDate(currentDue.getDate() + days);

        txn.dueDate = currentDue;
        txn.renewalCount += 1;
        await txn.save();

        res.status(200).json({ status: 'success', data: txn });
    } catch (err) {
        res.status(400).json({ status: 'error', message: err.message });
    }
});

// GET Transactions (Active/History)
router.get('/transactions', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const txns = await Transaction.find(filter)
            .populate('book', 'title author')
            .populate('student', 'name email')
            .sort({ issueDate: -1 });

        res.status(200).json({ status: 'success', results: txns.length, data: txns });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// TRIGGER REMINDERS (Manual)
router.post('/trigger-reminders', async (req, res) => {
    try {
        const { checkOverdueBooks } = require('../utils/scheduler');
        // In real app, ensure admin auth here
        console.log("Manual trigger of overdue check...");
        await checkOverdueBooks();
        res.status(200).json({ status: 'success', message: 'Reminders triggered successfully.' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
