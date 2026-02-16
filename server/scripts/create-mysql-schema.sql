-- ============================================================
-- MySQL Schema for StudentDB (from MongoDB migration)
-- ============================================================
-- Run this script to create all required tables before migration:
-- mysql -u root -p studentdb < server/scripts/create-mysql-schema.sql
-- ============================================================

SET FOREIGN_KEY_CHECKS=0;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS LibraryAuditLogs;
DROP TABLE IF EXISTS BookReservations;
DROP TABLE IF EXISTS BorrowTransactions;
DROP TABLE IF EXISTS Transactions;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================
-- Students Table
-- ============================================================
CREATE TABLE Students (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NULL,
    course VARCHAR(128) NULL,
    status ENUM('Active', 'Inactive', 'Suspended', 'Graduated') NOT NULL DEFAULT 'Active',
    enrollmentDate DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    gpa DECIMAL(4,2) NULL CHECK (gpa >= 0 AND gpa <= 10.00),
    city VARCHAR(255) NULL,
    country VARCHAR(255) NULL,
    zipCode VARCHAR(20) NULL,
    address TEXT NULL,
    guardianName VARCHAR(255) NULL,
    emergencyContact VARCHAR(255) NULL,
    studentCategory VARCHAR(128) NULL,
    scholarshipStatus VARCHAR(128) NULL,
    bloodGroup ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '') NULL,
    hostelRequired BOOLEAN NOT NULL DEFAULT FALSE,
    transportMode VARCHAR(64) NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt DESC),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='Student enrollment and profile data';

-- ============================================================
-- Books Table
-- ============================================================
CREATE TABLE Books (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    title VARCHAR(512) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(64) NOT NULL UNIQUE,
    genre VARCHAR(128) NULL,
    department ENUM('Computer Science', 'Electrical', 'Mechanical', 'Civil', 'General', 
                    'Business', 'Fiction', 'Philosophy', 'Science', 'History', 
                    'Management', 'Mathematics', 'AI / ML') NOT NULL DEFAULT 'General',
    totalCopies INT NOT NULL DEFAULT 1 CHECK (totalCopies >= 0),
    checkedOutCount INT NOT NULL DEFAULT 0 CHECK (checkedOutCount >= 0),
    lastAvailabilityUpdatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    overdueFlag BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('Available', 'Out of Stock') NOT NULL DEFAULT 'Available',
    shelfLocation VARCHAR(255) NULL,
    addedDate DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    autoTags JSON NULL,
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_isbn (isbn),
    INDEX idx_department (department),
    INDEX idx_status (status),
    INDEX idx_createdAt (createdAt DESC),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='Library book inventory with tracking';

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE Users (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('ADMIN', 'LIBRARIAN', 'AUDITOR', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    INDEX idx_email (email),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='User accounts and roles';

-- ============================================================
-- BorrowTransactions Table (Main transaction model)
-- ============================================================
CREATE TABLE BorrowTransactions (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    studentId CHAR(24) NOT NULL,
    bookId CHAR(24) NOT NULL,
    issuedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    dueDate DATETIME(3) NOT NULL,
    returnedAt DATETIME(3) NULL,
    fineAmount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (fineAmount >= 0),
    status ENUM('BORROWED', 'RETURNED', 'OVERDUE') NOT NULL DEFAULT 'BORROWED',
    renewalCount INT NOT NULL DEFAULT 0 CHECK (renewalCount >= 0 AND renewalCount <= 5),
    demo BOOLEAN NOT NULL DEFAULT FALSE,
    studentName VARCHAR(255) NULL COMMENT 'Audit trail snapshot',
    bookTitle VARCHAR(512) NULL COMMENT 'Audit trail snapshot',
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    CONSTRAINT fk_bt_student FOREIGN KEY (studentId) REFERENCES Students(_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_bt_book FOREIGN KEY (bookId) REFERENCES Books(_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_studentId_status (studentId, status),
    INDEX idx_bookId_status (bookId, status),
    INDEX idx_issuedAt (issuedAt DESC),
    INDEX idx_dueDate_status (dueDate, status),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='Primary book borrow transaction ledger';

-- ============================================================
-- Transactions Table (Legacy model, alternative field names)
-- ============================================================
CREATE TABLE Transactions (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    student CHAR(24) NOT NULL,
    book CHAR(24) NOT NULL,
    studentName VARCHAR(255) NULL COMMENT 'Audit trail snapshot',
    bookTitle VARCHAR(512) NULL COMMENT 'Audit trail snapshot',
    issueDate DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    dueDate DATETIME(3) NOT NULL,
    returnDate DATETIME(3) NULL,
    status ENUM('Issued', 'Returned', 'Overdue') NOT NULL DEFAULT 'Issued',
    renewalCount INT NOT NULL DEFAULT 0 CHECK (renewalCount >= 0 AND renewalCount <= 5),
    fine DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (fine >= 0),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    CONSTRAINT fk_txn_student FOREIGN KEY (student) REFERENCES Students(_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_txn_book FOREIGN KEY (book) REFERENCES Books(_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_student (student),
    INDEX idx_book (book),
    INDEX idx_status_dueDate (status, dueDate),
    INDEX idx_issueDate_desc (issueDate DESC),
    INDEX idx_status (status),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='Legacy transaction model (alternative field names)';

-- ============================================================
-- BookReservations Table
-- ============================================================
CREATE TABLE BookReservations (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    book CHAR(24) NOT NULL,
    student CHAR(24) NOT NULL,
    status ENUM('Active', 'Fulfilled', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Active',
    queuePosition INT NOT NULL DEFAULT 1 CHECK (queuePosition >= 1),
    expiryDate DATETIME(3) NULL,
    fulfilledAt DATETIME(3) NULL,
    timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    
    CONSTRAINT fk_res_book FOREIGN KEY (book) REFERENCES Books(_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_res_student FOREIGN KEY (student) REFERENCES Students(_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_book_status (book, status),
    INDEX idx_student_status (student, status),
    INDEX idx_status (status),
    INDEX idx_timestamp_desc (timestamp DESC),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='Book reservation and hold queue';

-- ============================================================
-- LibraryAuditLogs Table (IMMUTABLE)
-- ============================================================
CREATE TABLE LibraryAuditLogs (
    _id CHAR(24) PRIMARY KEY NOT NULL COMMENT 'MongoDB ObjectId hex string',
    action ENUM('BORROW', 'RETURN', 'RENEW', 'ADD', 'UPDATE', 'DELETE', 'OVERDUE', 'RESERVE', 'EMAIL_SENT') NOT NULL,
    bookId CHAR(24) NULL,
    studentId CHAR(24) NULL,
    adminId CHAR(24) NULL,
    timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    metadata JSON NULL COMMENT 'Flexible audit context',
    ipAddress VARCHAR(45) NULL,
    userAgent TEXT NULL,
    
    CONSTRAINT fk_audit_book FOREIGN KEY (bookId) REFERENCES Books(_id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_student FOREIGN KEY (studentId) REFERENCES Students(_id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_admin FOREIGN KEY (adminId) REFERENCES Users(_id) ON DELETE SET NULL,
    
    INDEX idx_action_timestamp (action, timestamp DESC),
    INDEX idx_studentId_timestamp (studentId, timestamp DESC),
    INDEX idx_bookId_timestamp (bookId, timestamp DESC),
    INDEX idx_timestamp_desc (timestamp DESC),
    INDEX idx_action (action),
    
    CHARSET utf8mb4,
    COLLATE utf8mb4_unicode_ci
) COMMENT='IMMUTABLE audit ledger - no updates/deletes allowed';

-- ============================================================
-- Triggers for Immutability Enforcement
-- ============================================================

-- Prevent updates to LibraryAuditLogs
DELIMITER //

CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON LibraryAuditLogs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'DBMS INTEGRITY: Audit logs are immutable and cannot be updated';
END//

CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON LibraryAuditLogs
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'DBMS INTEGRITY: Audit logs are immutable and cannot be deleted';
END//

DELIMITER ;

-- ============================================================
-- Verification Queries
-- ============================================================
-- After migration, run these to verify schema:
-- SELECT TABLE_NAME, TABLE_ROWS 
-- FROM INFORMATION_SCHEMA.TABLES 
-- WHERE TABLE_SCHEMA = 'studentdb'
-- ORDER BY TABLE_NAME;

-- Check foreign key constraints:
-- SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = 'studentdb' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================================
-- Done
-- ============================================================
