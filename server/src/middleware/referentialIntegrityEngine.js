/**
 * LAYER 2: Referential Integrity Engine
 * 
 * This middleware enforces referential integrity constraints:
 * - Validates foreign key existence before writes
 * - Prevents orphan creation
 * - Prevents broken relations
 * - Blocks invalid writes
 * - Blocks null foreign keys
 * - Blocks invalid ObjectIds
 */

const mongoose = require('mongoose');

/**
 * Validates that a given value is a valid MongoDB ObjectId
 */
function isValidObjectId(id) {
    try {
        return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
    } catch (err) {
        return false;
    }
}

/**
 * Validates that a referenced document exists
 */
async function validateReference(model, id, fieldName) {
    if (!id) {
        throw new Error(`${fieldName} cannot be null or undefined`);
    }

    if (!isValidObjectId(id)) {
        throw new Error(`${fieldName} is not a valid ObjectId: ${id}`);
    }

    try {
        const exists = await mongoose.model(model).findById(id);
        if (!exists) {
            throw new Error(`Referenced ${model} with ID ${id} does not exist (broken reference)`);
        }
        return exists;
    } catch (err) {
        if (err.message.includes('does not exist')) {
            throw err;
        }
        throw new Error(`Failed to validate ${model} reference: ${err.message}`);
    }
}

/**
 * Validates multiple foreign keys simultaneously
 */
async function validateReferences(references) {
    const promises = references.map(async (ref) => {
        return {
            field: ref.field,
            result: await validateReference(ref.model, ref.id, ref.field)
        };
    });

    const results = await Promise.all(promises);
    return results;
}

/**
 * Validates a BorrowTransaction for referential integrity
 */
async function validateBorrowTransaction(data) {
    const errors = [];

    try {
        await validateReference('Student', data.studentId, 'studentId');
    } catch (err) {
        errors.push(err.message);
    }

    try {
        await validateReference('Book', data.bookId, 'bookId');
    } catch (err) {
        errors.push(err.message);
    }

    if (errors.length > 0) {
        throw new Error(`BorrowTransaction validation failed: ${errors.join('; ')}`);
    }
}

/**
 * Validates a BookReservation for referential integrity
 */
async function validateBookReservation(data) {
    const errors = [];

    try {
        await validateReference('Student', data.student, 'student');
    } catch (err) {
        errors.push(err.message);
    }

    try {
        await validateReference('Book', data.book, 'book');
    } catch (err) {
        errors.push(err.message);
    }

    if (errors.length > 0) {
        throw new Error(`BookReservation validation failed: ${errors.join('; ')}`);
    }
}

/**
 * Validates a Transaction for referential integrity
 */
async function validateTransaction(data) {
    const errors = [];

    try {
        await validateReference('Student', data.student, 'student');
    } catch (err) {
        errors.push(err.message);
    }

    try {
        await validateReference('Book', data.book, 'book');
    } catch (err) {
        errors.push(err.message);
    }

    if (errors.length > 0) {
        throw new Error(`Transaction validation failed: ${errors.join('; ')}`);
    }
}

/**
 * Validates a LibraryFineLedger for referential integrity
 */
async function validateLibraryFineLedger(data) {
    const errors = [];

    try {
        await validateReference('Student', data.student, 'student');
    } catch (err) {
        errors.push(err.message);
    }

    // Transaction is optional but must be valid if provided
    if (data.transaction) {
        try {
            await validateReference('Transaction', data.transaction, 'transaction');
        } catch (err) {
            errors.push(err.message);
        }
    }

    // BorrowTransaction is optional but must be valid if provided
    if (data.borrowTransaction) {
        try {
            await validateReference('BorrowTransaction', data.borrowTransaction, 'borrowTransaction');
        } catch (err) {
            errors.push(err.message);
        }
    }

    if (errors.length > 0) {
        throw new Error(`LibraryFineLedger validation failed: ${errors.join('; ')}`);
    }
}

/**
 * Validates a LibraryAuditLog for referential integrity
 */
async function validateLibraryAuditLog(data) {
    const errors = [];

    // All fields are optional but must be valid if provided
    if (data.bookId) {
        try {
            await validateReference('Book', data.bookId, 'bookId');
        } catch (err) {
            errors.push(err.message);
        }
    }

    if (data.studentId) {
        try {
            await validateReference('Student', data.studentId, 'studentId');
        } catch (err) {
            errors.push(err.message);
        }
    }

    if (data.adminId) {
        try {
            await validateReference('User', data.adminId, 'adminId');
        } catch (err) {
            // Non-critical if User doesn't exist (might be deleted)
            // Don't add to errors
        }
    }

    if (errors.length > 0) {
        throw new Error(`LibraryAuditLog validation failed: ${errors.join('; ')}`);
    }
}

module.exports = {
    isValidObjectId,
    validateReference,
    validateReferences,
    validateBorrowTransaction,
    validateBookReservation,
    validateTransaction,
    validateLibraryFineLedger,
    validateLibraryAuditLog
};
