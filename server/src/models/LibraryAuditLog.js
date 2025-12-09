const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['BORROW', 'RETURN', 'RENEW', 'ADD', 'UPDATE', 'DELETE', 'OVERDUE']
    },
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book'
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { collection: 'library_audit_logs' });

module.exports = mongoose.model('LibraryAuditLog', auditLogSchema);
