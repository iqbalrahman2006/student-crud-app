const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
    studentName: {
        type: String,
        trim: true
    },
    bookTitle: {
        type: String,
        trim: true
    },
    issueDate: {
        type: Date,
        default: Date.now,
        required: [true, 'issueDate is required'],
        immutable: true
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
        validate: {
            validator: function (value) {
                return value && value >= this.issueDate;
            },
            message: 'Due date must be on or after issue date'
        }
    },
    returnDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value >= this.issueDate;
            },
            message: 'Return date must be on or after issue date'
        }
    },
    status: {
        type: String,
        enum: {
            values: ['Issued', 'Returned', 'Overdue'],
            message: 'Invalid status: must be Issued, Returned, or Overdue'
        },
        default: 'Issued',
        required: true,
        validate: {
            validator: function (value) {
                // If status is Returned, returnDate must exist
                if (value === 'Returned' && !this.returnDate) {
                    return false;
                }
                // If Issued or Overdue, returnDate must be null
                if ((value === 'Issued' || value === 'Overdue') && this.returnDate) {
                    return false;
                }
                return true;
            },
            message: 'Status and returnDate must be consistent'
        }
    },
    renewalCount: {
        type: Number,
        default: 0,
        min: [0, 'Renewal count cannot be negative'],
        max: [5, 'Maximum 5 renewals allowed']
    },
    fine: {
        type: Number,
        default: 0,
        min: [0, 'Fine cannot be negative']
    }
}, {
    timestamps: true,
    strict: 'throw' // Reject unknown fields
});

// LAYER 1: Schema Hardening - Indexes
transactionSchema.index({ student: 1 });
transactionSchema.index({ book: 1 });
transactionSchema.index({ status: 1, dueDate: 1 }); // For overdue queries
transactionSchema.index({ issueDate: -1 }); // For sorting
transactionSchema.index({ status: 1 }); // For active transaction queries

// LAYER 1: Pre-save validation
transactionSchema.pre('save', async function(next) {
    try {
        // Verify student exists
        const Student = mongoose.model('Student');
        const student = await Student.findById(this.student);
        if (!student) {
            const error = new Error(`Transaction: Student with ID ${this.student} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        // Capture student name at transaction time for audit trail
        if (!this.studentName) {
            this.studentName = student.name;
        }

        // Verify book exists
        const Book = mongoose.model('Book');
        const book = await Book.findById(this.book);
        if (!book) {
            const error = new Error(`Transaction: Book with ID ${this.book} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        // Capture book title at transaction time for audit trail
        if (!this.bookTitle) {
            this.bookTitle = book.title;
        }

        next();
    } catch (err) {
        next(err);
    }
});

// LAYER 1: Pre-findOneAndUpdate validation
transactionSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        if (!update) return next();

        const updateData = update.$set || update;

        // Validate status enum
        if (updateData.status && !['Issued', 'Returned', 'Overdue'].includes(updateData.status)) {
            const error = new Error(`Invalid status: ${updateData.status}`);
            error.statusCode = 400;
            return next(error);
        }

        // Verify foreign keys if updated
        if (updateData.student) {
            const Student = mongoose.model('Student');
            const student = await Student.findById(updateData.student);
            if (!student) {
                const error = new Error(`Student with ID ${updateData.student} does not exist`);
                error.statusCode = 400;
                return next(error);
            }
        }

        if (updateData.book) {
            const Book = mongoose.model('Book');
            const book = await Book.findById(updateData.book);
            if (!book) {
                const error = new Error(`Book with ID ${updateData.book} does not exist`);
                error.statusCode = 400;
                return next(error);
            }
        }

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Transaction', transactionSchema);

