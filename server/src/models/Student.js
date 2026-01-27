const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+$/, 'Please provide a valid email address'],
        immutable: true // Email cannot change after creation
    },
    phone: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                // Allow empty or valid phone format (10+ digits, optional +, spaces, dashes)
                return !v || /^[\d\s\-+()]{10,}$/.test(v);
            },
            message: 'Please provide a valid phone number'
        }
    },
    course: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: {
            values: ['Active', 'Inactive', 'Suspended', 'Graduated'],
            message: 'Invalid status: must be Active, Inactive, Suspended, or Graduated'
        },
        default: 'Active',
        required: true
    },
    enrollmentDate: {
        type: Date,
        default: Date.now,
        immutable: true // Enrollment date cannot change
    },
    gpa: {
        type: Number,
        min: [0, 'GPA cannot be negative'],
        max: [10.0, 'GPA cannot exceed 10.0']
    },
    city: {
        type: String,
        trim: true
    },
    country: {
        type: String,
        trim: true
    },
    zipCode: String,
    address: String,

    // --- ENTERPRISE OPTIONAL FIELDS (Phase 8) ---
    guardianName: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    studentCategory: { type: String, trim: true }, // e.g., International, Local
    scholarshipStatus: { type: String, trim: true },
    bloodGroup: {
        type: String,
        trim: true,
        enum: {
            values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
            message: '{VALUE} is not a valid blood group'
        }
    },
    hostelRequired: { type: Boolean, default: false },
    transportMode: { type: String, trim: true } // e.g., Bus, Private, Walk
}, {
    timestamps: true,
    strict: 'throw' // Reject unknown fields
});

// LAYER 1: Schema Hardening - Indexes
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ status: 1 });
studentSchema.index({ createdAt: -1 });

// LAYER 1: Validation hook - ensure no null/undefined required fields
studentSchema.pre('save', function (next) {
    if (!this.name || !this.name.trim()) {
        const error = new Error('Student name is required and cannot be empty');
        error.statusCode = 400;
        return next(error);
    }
    if (!this.email || !this.email.trim()) {
        const error = new Error('Student email is required and cannot be empty');
        error.statusCode = 400;
        return next(error);
    }
    next();
});

// LAYER 1: Prevent invalid status transitions
studentSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate();
    if (update && update.$set && update.$set.status) {
        const validStatuses = ['Active', 'Inactive', 'Suspended', 'Graduated'];
        if (!validStatuses.includes(update.$set.status)) {
            const error = new Error(`Invalid status: ${update.$set.status}. Must be one of: ${validStatuses.join(', ')}`);
            error.statusCode = 400;
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Student', studentSchema);
