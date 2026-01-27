/**
 * INTEGRITY REGISTRY (STRICT MODE)
 * 
 * Maps frontend action keys to their complete technical execution chain.
 * Used by the IntegrityService to verify at runtime that all links are present.
 */

const integrityRegistry = {
    // --- STUDENT CRUD ACTIONS ---
    'STUDENT_CREATE': {
        ui: 'StudentForm',
        handler: 'handleSave',
        api: 'studentService.create',
        method: 'POST',
        endpoint: '/api/v1/students',
        controller: 'studentController.create',
        service: 'studentService.create',
        dbOperation: 'Student.save',
        rbac: ['ADMIN']
    },
    'STUDENT_UPDATE': {
        ui: 'StudentForm',
        handler: 'handleSave',
        api: 'studentService.update',
        method: 'PUT',
        endpoint: '/api/v1/students/:id',
        controller: 'studentController.update',
        service: 'studentService.update',
        dbOperation: 'Student.findByIdAndUpdate',
        rbac: ['ADMIN']
    },
    'STUDENT_DELETE': {
        ui: 'StudentItem',
        handler: 'handleDelete',
        api: 'studentService.delete',
        method: 'DELETE',
        endpoint: '/api/v1/students/:id',
        controller: 'studentController.delete',
        service: 'studentService.delete',
        dbOperation: 'Student.findByIdAndDelete',
        rbac: ['ADMIN']
    },

    // --- LIBRARY ACTIONS ---
    'BOOK_ISSUE': {
        ui: 'Library',
        handler: 'handleIssueSubmit',
        api: 'bookService.issue',
        method: 'POST',
        endpoint: '/api/v1/library/issue',
        controller: 'library.js (inline)',
        service: 'bookService.issue',
        dbOperation: 'BorrowTransaction.save',
        rbac: ['ADMIN']
    },
    'BOOK_RETURN': {
        ui: 'TransactionHistory',
        handler: 'handleReturn',
        api: 'bookService.return',
        method: 'POST',
        endpoint: '/api/v1/library/return',
        controller: 'library.js (inline)',
        service: 'bookService.returnBook',
        dbOperation: 'BorrowTransaction.findByIdAndUpdate',
        rbac: ['ADMIN']
    },
    'BOOK_RENEW': {
        ui: 'TransactionHistory',
        handler: 'handleRenew',
        api: 'bookService.renew',
        method: 'POST',
        endpoint: '/api/v1/library/renew',
        controller: 'library.js (inline)',
        service: 'bookService.renew',
        dbOperation: 'BorrowTransaction.findByIdAndUpdate',
        rbac: ['ADMIN']
    },
    'BOOK_RESERVE': {
        ui: 'BookInventory',
        handler: 'handleReserve',
        api: 'bookService.reserve',
        method: 'POST',
        endpoint: '/api/v1/library/reserve',
        controller: 'library.js (inline)',
        service: 'bookService.reserveBook',
        dbOperation: 'BookReservation.save',
        rbac: ['ADMIN']
    },

    // --- SYSTEM ACTIONS ---
    'SYSTEM_SCAN': {
        ui: 'DailyActivityLog',
        handler: 'handleScan',
        api: 'analyticsService.getIntegrityScan',
        method: 'POST',
        endpoint: '/api/v1/system/integrity/scan',
        controller: 'system.js',
        service: 'dbIntegrityService.detectOrphans',
        dbOperation: 'N/A (Read Only)',
        rbac: ['ADMIN']
    },
    'SYSTEM_REPAIR': {
        ui: 'DailyActivityLog',
        handler: 'handleRepair',
        api: 'analyticsService.runIntegrityRepair',
        method: 'POST',
        endpoint: '/api/v1/system/integrity/repair',
        controller: 'system.js',
        service: 'dbIntegrityService.cleanupOrphans',
        dbOperation: 'Multiple.deleteMany',
        rbac: ['ADMIN']
    }
};

module.exports = integrityRegistry;
