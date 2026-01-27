const mongoose = require('mongoose');

const borrowTransactionSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: [true, 'studentId is required and must reference a valid Student'],
        validate: {
            isAsync: true,
            validator: async function (v) {
                if (!v) return false;
                const Student = mongoose.model('Student');
                const exists = await Student.findById(v);
                return !!exists;
            },
            message: 'Referenced Student does not exist'
        }
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: [true, 'bookId is required and must reference a valid Book'],
        validate: {
            isAsync: true,
            validator: async function (v) {
                if (!v) return false;
                const Book = mongoose.model('Book');
                const exists = await Book.findById(v);
                return !!exists;
            },
            message: 'Referenced Book does not exist'
        }
    },
    issuedAt: {
        type: Date,
        default: Date.now,
        required: true,
        immutable: true // Issue date cannot change after creation
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
        validate: {
            validator: function (value) {
                return value && value >= this.issuedAt;
            },
            message: 'Due date must be on or after issue date'
        }
    },
    returnedAt: {
        type: Date,
        default: null,
        validate: {
            validator: function (value) {
                return !value || value >= this.issuedAt;
            },
            message: 'Return date must be on or after issue date'
        }
    },
    fineAmount: {
        type: Number,
        default: 0,
        min: [0, 'Fine amount cannot be negative']
    },
    status: {
        type: String,
        enum: {
            values: ['BORROWED', 'RETURNED', 'OVERDUE'],
            message: 'Invalid status: must be BORROWED, RETURNED, or OVERDUE'
        },
        default: 'BORROWED',
        required: true,
        validate: {
            validator: function (value) {
                // If status is RETURNED, returnedAt must exist
                if (value === 'RETURNED' && !this.returnedAt) {
                    return false;
                }
                // If BORROWED or OVERDUE, returnedAt must be null
                if ((value === 'BORROWED' || value === 'OVERDUE') && this.returnedAt) {
                    return false;
                }
                return true;
            },
            message: 'Status and returnedAt date must be consistent'
        }
    },
    renewalCount: {
        type: Number,
        default: 0,
        min: [0, 'Renewal count cannot be negative'],
        max: [5, 'Maximum 5 renewals allowed']
    },
    demo: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    strict: 'throw' // Reject unknown fields
});

// LAYER 1: Schema Hardening - Indexes
borrowTransactionSchema.index({ studentId: 1, status: 1 });
borrowTransactionSchema.index({ bookId: 1, status: 1 });
borrowTransactionSchema.index({ issuedAt: -1 });
borrowTransactionSchema.index({ dueDate: 1, status: 1 }); // For overdue queries
borrowTransactionSchema.index({ status: 1 }); // For active loan queries

// LAYER 1: Pre-save validation - ensure foreign keys exist
borrowTransactionSchema.pre('save', async function (next) {
    try {
        // Verify student exists
        const Student = mongoose.model('Student');
        const student = await Student.findById(this.studentId);
        if (!student) {
            const error = new Error(`BorrowTransaction: Student with ID ${this.studentId} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        // Verify book exists
        const Book = mongoose.model('Book');
        const book = await Book.findById(this.bookId);
        if (!book) {
            const error = new Error(`BorrowTransaction: Book with ID ${this.bookId} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        next();
    } catch (err) {
        next(err);
    }
});

// LAYER 1: Pre-findOneAndUpdate validation - ensure status transitions are valid
borrowTransactionSchema.pre('findOneAndUpdate', async function (next) {
    try {
        const update = this.getUpdate();
        if (!update) return next();

        const updateData = update.$set || update;

        // Validate status enum
        if (updateData.status && !['BORROWED', 'RETURNED', 'OVERDUE'].includes(updateData.status)) {
            const error = new Error(`Invalid status: ${updateData.status}`);
            error.statusCode = 400;
            return next(error);
        }

        // Ensure foreign key references still exist if they're being updated
        if (updateData.studentId) {
            const Student = mongoose.model('Student');
            const student = await Student.findById(updateData.studentId);
            if (!student) {
                const error = new Error(`Student with ID ${updateData.studentId} does not exist`);
                error.statusCode = 400;
                return next(error);
            }
        }

        if (updateData.bookId) {
            const Book = mongoose.model('Book');
            const book = await Book.findById(updateData.bookId);
            if (!book) {
                const error = new Error(`Book with ID ${updateData.bookId} does not exist`);
                error.statusCode = 400;
                return next(error);
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('BorrowTransaction', borrowTransactionSchema);

