const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'book is required and must reference a valid Book'],
        validate: {
            isAsync: true,
            validator: async function(v) {
                if (!v) return false;
                const Book = mongoose.model('Book');
                const exists = await Book.findById(v);
                return !!exists;
            },
            message: 'Referenced Book does not exist'
        }
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'student is required and must reference a valid Student'],
        validate: {
            isAsync: true,
            validator: async function(v) {
                if (!v) return false;
                const Student = mongoose.model('Student');
                const exists = await Student.findById(v);
                return !!exists;
            },
            message: 'Referenced Student does not exist'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Active', 'Fulfilled', 'Expired', 'Cancelled'],
            message: 'Invalid status: must be Active, Fulfilled, Expired, or Cancelled'
        },
        default: 'Active',
        required: true,
        validate: {
            validator: function (value) {
                // If status is Fulfilled, fulfilledAt must exist
                if (value === 'Fulfilled' && !this.fulfilledAt) {
                    return false;
                }
                return true;
            },
            message: 'Fulfilled status requires fulfilledAt date'
        }
    },
    queuePosition: {
        type: Number,
        default: 1,
        min: [1, 'Queue position must be at least 1'],
        required: true
    },
    expiryDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value > this.timestamp;
            },
            message: 'Expiry date must be after creation timestamp'
        }
    },
    fulfilledAt: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value >= this.timestamp;
            },
            message: 'Fulfilled date must be on or after creation timestamp'
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true,
        required: true
    },
}, {
    timestamps: true,
    strict: 'throw' // Reject unknown fields
});

// LAYER 1: Schema Hardening - Indexes
reservationSchema.index({ book: 1, status: 1 });
reservationSchema.index({ student: 1, status: 1 });
reservationSchema.index({ status: 1 }); // For active reservation queries
reservationSchema.index({ timestamp: -1 }); // For sorting

// LAYER 1: Pre-save validation
reservationSchema.pre('save', async function(next) {
    try {
        // Verify book exists
        const Book = mongoose.model('Book');
        const book = await Book.findById(this.book);
        if (!book) {
            const error = new Error(`BookReservation: Book with ID ${this.book} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        // Verify student exists
        const Student = mongoose.model('Student');
        const student = await Student.findById(this.student);
        if (!student) {
            const error = new Error(`BookReservation: Student with ID ${this.student} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        next();
    } catch (err) {
        next(err);
    }
});

// LAYER 1: Pre-findOneAndUpdate validation
reservationSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        if (!update) return next();

        const updateData = update.$set || update;

        // Validate status enum
        if (updateData.status && !['Active', 'Fulfilled', 'Expired', 'Cancelled'].includes(updateData.status)) {
            const error = new Error(`Invalid status: ${updateData.status}`);
            error.statusCode = 400;
            return next(error);
        }

        // Verify foreign keys if updated
        if (updateData.book) {
            const Book = mongoose.model('Book');
            const book = await Book.findById(updateData.book);
            if (!book) {
                const error = new Error(`Book with ID ${updateData.book} does not exist`);
                error.statusCode = 400;
                return next(error);
            }
        }

        if (updateData.student) {
            const Student = mongoose.model('Student');
            const student = await Student.findById(updateData.student);
            if (!student) {
                const error = new Error(`Student with ID ${updateData.student} does not exist`);
                error.statusCode = 400;
                return next(error);
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('BookReservation', reservationSchema);

