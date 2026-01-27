const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a book title'],
        trim: true,
        minlength: [2, 'Title must be at least 2 characters']
    },
    author: {
        type: String,
        required: [true, 'Please provide an author name'],
        trim: true,
        minlength: [2, 'Author name must be at least 2 characters']
    },
    isbn: {
        type: String,
        required: [true, 'Please provide an ISBN'],
        trim: true,
        immutable: true // ISBN cannot change after creation
    },
    genre: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        enum: {
            values: ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'General', 'Business', 'Fiction', 'Philosophy', 'Science', 'History', 'Management', 'Mathematics', 'AI / ML'],
            message: 'Invalid department: must be one of Computer Science, Electrical, Mechanical, Civil, General, Business, Fiction, Philosophy, Science, History, Management, Mathematics, AI / ML'
        },
        default: 'General',
        required: true
    },
    totalCopies: {
        type: Number,
        default: 1,
        min: [0, 'Total copies cannot be negative'],
        required: true,
        validate: {
            validator: function (value) {
                return Number.isInteger(value);
            },
            message: 'Total copies must be an integer'
        }
    },
    // New fields for robust tracking
    checkedOutCount: {
        type: Number,
        default: 0,
        min: [0, 'Checked out count cannot be negative'],
        validate: {
            validator: function (value) {
                // Ensure checkedOutCount never exceeds totalCopies
                return value <= this.totalCopies;
            },
            message: 'Checked out count ({VALUE}) cannot exceed total copies'
        }
    },
    lastAvailabilityUpdatedAt: {
        type: Date,
        default: Date.now
    },
    overdueFlag: {
        type: Boolean,
        default: false
    },
    // Derived/Legacy field - kept for backward compatibility but re-calculated
    availableCopies: {
        type: Number,
        default: 1,
        min: [0, 'Available copies cannot be negative']
    },
    status: {
        type: String,
        enum: {
            values: ['Available', 'Out of Stock'],
            message: 'Invalid status: must be Available or Out of Stock'
        },
        default: 'Available',
        required: true
    },
    shelfLocation: {
        type: String,
        trim: true
    },
    addedDate: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    autoTags: {
        type: [String],
        default: []
    }
}, {
    timestamps: true,
    strict: 'throw' // Reject unknown fields
});

// LAYER 1: Schema Hardening - Auto-update status based on copies logic
bookSchema.pre('save', function (next) {
    // Validate consistency
    if (this.checkedOutCount < 0) {
        this.checkedOutCount = 0;
    }
    if (this.checkedOutCount > this.totalCopies) {
        const error = new Error(`Checked out count (${this.checkedOutCount}) cannot exceed total copies (${this.totalCopies})`);
        error.statusCode = 400;
        return next(error);
    }

    // Recalculate availableCopies
    this.availableCopies = Math.max(0, this.totalCopies - this.checkedOutCount);

    if (this.availableCopies <= 0) {
        this.status = 'Out of Stock';
    } else {
        this.status = 'Available';
    }
    this.lastAvailabilityUpdatedAt = new Date();
    next();
});

// LAYER 1: Indexes for faster lookups
bookSchema.index({ isbn: 1 }, { unique: true });
bookSchema.index({ department: 1 });
bookSchema.index({ status: 1 });
bookSchema.index({ createdAt: -1 });

// LAYER 1: Pre-findOneAndUpdate validation
bookSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (!update) return next();

    const updateData = update.$set || update;

    // Validate department enum
    if (updateData.department) {
        const validDepts = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'General', 'Business', 'Fiction', 'Philosophy', 'Science', 'History', 'Management', 'Mathematics', 'AI / ML'];
        if (!validDepts.includes(updateData.department)) {
            const error = new Error(`Invalid department: ${updateData.department}`);
            error.statusCode = 400;
            return next(error);
        }
    }

    // Validate status enum
    if (updateData.status && !['Available', 'Out of Stock'].includes(updateData.status)) {
        const error = new Error(`Invalid status: ${updateData.status}`);
        error.statusCode = 400;
        return next(error);
    }

    // Ensure checkedOutCount doesn't exceed totalCopies
    if (updateData.checkedOutCount !== undefined && updateData.totalCopies !== undefined) {
        if (updateData.checkedOutCount > updateData.totalCopies) {
            const error = new Error(`Checked out count cannot exceed total copies`);
            error.statusCode = 400;
            return next(error);
        }
    }

    next();
});

module.exports = mongoose.model('Book', bookSchema);

