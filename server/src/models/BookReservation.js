const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
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
    status: {
        type: String,
        enum: ['Active', 'Fulfilled', 'Expired', 'Cancelled'],
        default: 'Active'
    },
    queuePosition: {
        type: Number,
        default: 1
    },
    expiryDate: {
        type: Date, // If fulfilled, how long held?
    },
    fulfilledAt: {
        type: Date
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    demo: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('BookReservation', reservationSchema);
