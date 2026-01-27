const mongoose = require('mongoose');

const fineLedgerSchema = new mongoose.Schema({
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
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        validate: {
            isAsync: true,
            validator: async function(v) {
                if (!v) return true; // Optional field
                const Transaction = mongoose.model('Transaction');
                const exists = await Transaction.findById(v);
                return !!exists;
            },
            message: 'Referenced Transaction does not exist'
        }
    },
    borrowTransaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BorrowTransaction',
        validate: {
            isAsync: true,
            validator: async function(v) {
                if (!v) return true; // Optional field
                const BorrowTransaction = mongoose.model('BorrowTransaction');
                const exists = await BorrowTransaction.findById(v);
                return !!exists;
            },
            message: 'Referenced BorrowTransaction does not exist'
        }
    },
    amount: {
        type: Number,
        required: [true, 'Fine amount is required'],
        min: [0, 'Fine amount cannot be negative']
    },
    reason: {
        type: String,
        required: [true, 'Fine reason is required'],
        trim: true,
        minlength: [5, 'Reason must be at least 5 characters']
    },
    status: {
        type: String,
        enum: {
            values: ['Unpaid', 'Paid', 'Waived'],
            message: 'Invalid status: must be Unpaid, Paid, or Waived'
        },
        default: 'Unpaid',
        required: true
    },
    paidDate: {
        type: Date,
        validate: {
            validator: function (value) {
                return !value || value >= this.timestamp;
            },
            message: 'Paid date must be on or after creation timestamp'
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true,
        required: [true, 'timestamp is required']
    }
}, {
    timestamps: true,
    strict: 'throw' // Reject unknown fields
});

// LAYER 1: Schema Hardening - Indexes
fineLedgerSchema.index({ student: 1, status: 1 });
fineLedgerSchema.index({ status: 1 });
fineLedgerSchema.index({ timestamp: -1 });
fineLedgerSchema.index({ transaction: 1 }); // For linking to borrow transactions
fineLedgerSchema.index({ borrowTransaction: 1 }); // For linking to new transaction model

// LAYER 1: Pre-save validation
fineLedgerSchema.pre('save', async function(next) {
    try {
        // Verify student exists
        const Student = mongoose.model('Student');
        const student = await Student.findById(this.student);
        if (!student) {
            const error = new Error(`LibraryFineLedger: Student with ID ${this.student} does not exist`);
            error.statusCode = 400;
            return next(error);
        }

        // Validate amount
        if (this.amount <= 0) {
            const error = new Error('Fine amount must be greater than 0');
            error.statusCode = 400;
            return next(error);
        }

        // If status is Paid, paidDate must exist
        if (this.status === 'Paid' && !this.paidDate) {
            const error = new Error('Paid status requires paidDate');
            error.statusCode = 400;
            return next(error);
        }

        next();
    } catch (err) {
        next(err);
    }
});

// LAYER 1: Pre-findOneAndUpdate validation
fineLedgerSchema.pre('findOneAndUpdate', async function(next) {
    try {
        const update = this.getUpdate();
        if (!update) return next();

        const updateData = update.$set || update;

        // Validate status enum
        if (updateData.status && !['Unpaid', 'Paid', 'Waived'].includes(updateData.status)) {
            const error = new Error(`Invalid status: ${updateData.status}`);
            error.statusCode = 400;
            return next(error);
        }

        // If updating to Paid, ensure paidDate is set
        if (updateData.status === 'Paid' && !updateData.paidDate) {
            updateData.paidDate = new Date();
        }

        // Verify student if updated
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

module.exports = mongoose.model('LibraryFineLedger', fineLedgerSchema);
