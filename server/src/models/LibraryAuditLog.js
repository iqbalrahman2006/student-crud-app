const mongoose = require('mongoose');

const LibraryAuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: ["BORROW", "RETURN", "RENEW", "ADD", "UPDATE", "DELETE", "OVERDUE", "RESERVE", "EMAIL_SENT"], // Added EMAIL_SENT for scheduler
        required: true
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book"
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: String,
    userAgent: String
});

// Index for filtering
LibraryAuditLogSchema.index({ action: 1, timestamp: -1 });
LibraryAuditLogSchema.index({ studentId: 1 });
LibraryAuditLogSchema.index({ bookId: 1 });

module.exports = mongoose.model('LibraryAuditLog', LibraryAuditLogSchema);
