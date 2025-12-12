const mongoose = require('mongoose');

const borrowTransactionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        default: () => new Date(+new Date() + 14 * 24 * 60 * 60 * 1000) // +14 Days default
    },
    returnedAt: {
        type: Date,
        default: null
    },
    fineAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['BORROWED', 'RETURNED', 'OVERDUE'],
        default: 'BORROWED'
    },
    renewalCount: {
        type: Number,
        default: 0
    },
    demo: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for quick lookups
borrowTransactionSchema.index({ studentId: 1, status: 1 });
borrowTransactionSchema.index({ bookId: 1, status: 1 });

module.exports = mongoose.model('BorrowTransaction', borrowTransactionSchema);
