const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    role: {
        type: String,
        enum: ['ADMIN', 'LIBRARIAN', 'AUDITOR', 'STUDENT'],
        default: 'STUDENT'
    }
}, {
    timestamps: true
});

// Index for faster email lookups
UserSchema.index({ email: 1 });

module.exports = mongoose.model('User', UserSchema);

