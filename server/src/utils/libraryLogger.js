const LibraryAuditLog = require('../models/LibraryAuditLog');

const logLibraryAction = async (action, { bookId, studentId, adminId, metadata, req }) => {
    try {
        const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip) : undefined;
        const userAgent = req ? req.headers['user-agent'] : undefined;

        await LibraryAuditLog.create({
            action,
            bookId,
            studentId,
            adminId,
            metadata,
            ipAddress,
            userAgent
        });
        // Console log for debug
        // console.log(`[AUDIT] ${action}: ${bookId || 'N/A'} - ${studentId || 'N/A'}`);
    } catch (err) {
        console.error("Library Audit Log Failure:", err.message);
        // Never throw, just log failure
    }
};

module.exports = logLibraryAction;
