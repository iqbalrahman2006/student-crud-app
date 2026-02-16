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
    'BOOK_CREATE': {
        ui: 'Library',
        handler: 'handleBookSubmit',
        api: 'bookService.create',
        method: 'POST',
        endpoint: '/api/v1/library/books',
        controller: 'library.js',
        service: 'Book.create',
        dbOperation: 'Book.save',
        rbac: ['ADMIN']
    },
    'BOOK_UPDATE': {
        ui: 'Library',
        handler: 'handleBookSubmit',
        api: 'bookService.update',
        method: 'PATCH',
        endpoint: '/api/v1/library/books/:id',
        controller: 'library.js',
        service: 'Book.save',
        dbOperation: 'Book.findByIdAndUpdate',
        rbac: ['ADMIN']
    },
    'BOOK_DELETE': {
        ui: 'Library',
        handler: 'handleDelete',
        api: 'bookService.delete',
        method: 'DELETE',
        endpoint: '/api/v1/library/books/:id',
        controller: 'library.js',
        service: 'Book.findByIdAndDelete',
        dbOperation: 'Book.deleteOne',
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
        rbac: ['ADMIN', 'LIBRARIAN']
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
        rbac: ['ADMIN', 'LIBRARIAN']
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
        rbac: ['ADMIN', 'LIBRARIAN']
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
        rbac: ['ADMIN', 'LIBRARIAN']
    },
    'RESERVATION_FULFILL': {
        ui: 'LibraryReservations',
        handler: 'handleAction',
        api: 'bookService.manageReservation',
        method: 'POST',
        endpoint: '/api/v1/library/reserve/action',
        controller: 'library.js',
        service: 'BookReservation.save',
        dbOperation: 'Multiple.update',
        rbac: ['ADMIN', 'LIBRARIAN']
    },
    'RESERVATION_CANCEL': {
        ui: 'LibraryReservations',
        handler: 'handleAction',
        api: 'bookService.manageReservation',
        method: 'POST',
        endpoint: '/api/v1/library/reserve/action',
        controller: 'library.js',
        service: 'BookReservation.save',
        dbOperation: 'BookReservation.findByIdAndUpdate',
        rbac: ['ADMIN', 'LIBRARIAN']
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
    },
    'TRIGGER_REMINDERS': {
        ui: 'Library',
        handler: 'handleTriggerReminders',
        api: 'analyticsService.triggerReminders',
        method: 'POST',
        endpoint: '/api/v1/library/trigger-reminders',
        rbac: ['ADMIN']
    },
    'EMAIL_BLAST': {
        ui: 'N/A',
        handler: 'N/A',
        api: 'analyticsService.sendBlastEmail',
        method: 'POST',
        endpoint: '/api/v1/notifications/blast',
        rbac: ['ADMIN']
    }
};

module.exports = integrityRegistry;
