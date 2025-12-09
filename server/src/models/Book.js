const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a book title'],
        trim: true
    },
    author: {
        type: String,
        required: [true, 'Please provide an author name'],
        trim: true
    },
    isbn: {
        type: String,
        required: [true, 'Please provide an ISBN'],
        unique: true,
        trim: true
    },
    genre: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        enum: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'General', 'Business'],
        default: 'General'
    },
    totalCopies: {
        type: Number,
        default: 1,
        min: 0
    },
    availableCopies: {
        type: Number,
        default: 1,
        min: 0
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock'],
        default: 'Available'
    },
    shelfLocation: String,
    addedDate: {
        type: Date,
        default: Date.now
    }
});

// Auto-update status based on copies
bookSchema.pre('save', function (next) {
    if (this.availableCopies <= 0) {
        this.status = 'Out of Stock';
        this.availableCopies = 0; // Safety clamp
    } else {
        this.status = 'Available';
    }
    next();
});

module.exports = mongoose.model('Book', bookSchema);
