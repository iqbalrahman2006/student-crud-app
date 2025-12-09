const LibraryAuditLog = require('../models/LibraryAuditLog');

const logLibraryAction = async (action, details, meta = {}) => {
    try {
        await LibraryAuditLog.create({
            action,
            details,
            studentId: meta.studentId || null,
            bookId: meta.bookId || null,
            meta
        });
        // Console log for debug
        // console.log(`[AUDIT] ${action}: ${details}`);
    } catch (err) {
        console.error("Audit Log Failure:", err);
    }
};

module.exports = logLibraryAction;
