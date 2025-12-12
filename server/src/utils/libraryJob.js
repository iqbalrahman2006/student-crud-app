const cron = require('node-cron');
const Book = require('../models/Book');
const BorrowTransaction = require('../models/BorrowTransaction');
const logLibraryAction = require('./libraryLogger');

// Run every 15 minutes
const JOB_SCHEDULE = '*/15 * * * *';

const checkOverdueBooks = async () => {
    try {
        console.log(`[LibraryJob] Starting Overdue Calculation: ${new Date().toISOString()}`);

        // 1. Find all currently issued transactions that are PAST DUE
        const now = new Date();
        const overdueTxns = await BorrowTransaction.find({
            status: 'BORROWED',
            dueDate: { $lt: now }
        }).select('bookId');

        if (overdueTxns.length === 0) {
            // Clear flags if no overdue books (optional, but good for cleanup)
            await Book.updateMany({ overdueFlag: true }, { overdueFlag: false });
            return;
        }

        const overdueBookIds = overdueTxns.map(t => t.bookId);

        // 2. Bulk Write: Set Flag TRUE for overdue, FALSE for others
        // This can be heavy, so we do it in chunks or two simplified queries.

        // A. Set TRUE for affected books
        const resOverdue = await Book.updateMany(
            { _id: { $in: overdueBookIds }, overdueFlag: { $ne: true } },
            { overdueFlag: true }
        );

        // B. Set FALSE for books that are NO LONGER overdue (safety sweep)
        // Optimization: Only scan books that are currently flagged TRUE but NOT in our overdue list
        const resClean = await Book.updateMany(
            { overdueFlag: true, _id: { $nin: overdueBookIds } },
            { overdueFlag: false }
        );

        if (resOverdue.modifiedCount > 0 || resClean.modifiedCount > 0) {
            await logLibraryAction('OVERDUE', {
                metadata: {
                    info: 'Background Job Updated Flags',
                    flagged: resOverdue.modifiedCount,
                    cleared: resClean.modifiedCount
                }
            });
            console.log(`[LibraryJob] Updated: ${resOverdue.modifiedCount} flagged, ${resClean.modifiedCount} cleared.`);
        }

    } catch (err) {
        console.error("[LibraryJob] Failed:", err.message);
    }
};

const initLibraryJob = () => {
    // Schedule task
    cron.schedule(JOB_SCHEDULE, checkOverdueBooks);
    console.log("[LibraryJob] Initialized Service.");
};

module.exports = { initLibraryJob, checkOverdueBooks };
