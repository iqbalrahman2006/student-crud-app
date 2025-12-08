const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    course: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended', 'Graduated'],
        default: 'Active'
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    gpa: {
        type: Number,
        min: 0,
        max: 10.0
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
    bloodGroup: { type: String, trim: true },
    hostelRequired: { type: Boolean, default: false },
    transportMode: { type: String, trim: true } // e.g., Bus, Private, Walk
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);