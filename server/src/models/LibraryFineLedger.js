const mongoose = require('mongoose');

const fineLedgerSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String, // e.g., "Overdue: Book Title"
        required: true
    },
    status: {
        type: String,
        enum: ['Unpaid', 'Paid', 'Waived'],
        default: 'Unpaid'
    },
    paidDate: Date,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LibraryFineLedger', fineLedgerSchema);
