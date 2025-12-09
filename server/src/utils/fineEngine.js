const LibraryFineLedger = require('../models/LibraryFineLedger');
const logLibraryAction = require('./libraryLogger');

const calculateFine = async (transaction, isReturnAction = false) => {
    const due = new Date(transaction.dueDate);
    const now = new Date();

    // No fine if not overdue
    if (now <= due) return 0;

    const diffTime = Math.abs(now - due);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Config: $1 per day, Max $50
    const RATE = 1;
    const CAP = 50;

    let fineAmount = diffDays * RATE;
    if (fineAmount > CAP) fineAmount = CAP;

    // Logic: If returning, we finalize the fine. If just viewing, we project it.
    if (isReturnAction && fineAmount > 0) {
        // Create Ledger Entry
        await LibraryFineLedger.create({
            student: transaction.student,
            transaction: transaction._id,
            amount: fineAmount,
            reason: `Overdue by ${diffDays} days`,
            status: 'Unpaid'
        });

        await logLibraryAction('OVERDUE', {
            studentId: transaction.student,
            bookId: transaction.book,
            metadata: { fineAmount, info: `Fine of $${fineAmount} applied` }
        });
    }

    return fineAmount;
};

module.exports = calculateFine;
