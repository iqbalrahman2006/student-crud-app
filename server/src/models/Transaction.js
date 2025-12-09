const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    studentName: String, // Snapshot for easier display
    bookTitle: String,   // Snapshot
    issueDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Issued', 'Returned', 'Overdue'],
        default: 'Issued'
    },
    renewalCount: {
        type: Number,
        default: 0
    },
    fine: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);
