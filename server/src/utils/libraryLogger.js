const LibraryAuditLog = require('../models/LibraryAuditLog');

/**
 * Logs a library action to the database.
 * @param {string} action - The action type (BORROW, RETURN, etc.)
 * @param {object} params - { bookId, studentId, adminId, metadata, req }
 */
const logLibraryAction = async (action, { bookId, studentId, adminId, metadata = {}, req = null }) => {
    try {
        let ipAddress = '';
        let userAgent = '';

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            userAgent = req.headers['user-agent'];
            // Auto-populate adminId from req.user if not provided explicitly
            if (!adminId && req.user) {
                adminId = req.user._id;
            }
        }

        await LibraryAuditLog.create({
            action,
            bookId,
            studentId,
            adminId,
            metadata,
            ipAddress,
            userAgent
        });
    } catch (err) {
        console.error("Failed to log library action:", err.message);
        // Do not throw, logging failure should not block main flow/transaction?
        // Ideally prompt says "Call it only after... succeeds". 
        // We log error but don't crash app.
    }
};

module.exports = logLibraryAction;
