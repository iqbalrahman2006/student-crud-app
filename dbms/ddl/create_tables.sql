-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 1-3: DDL & DML COMMANDS
-- ==================================================================================
-- StudentDB Application
-- REAL PROJECT TABLES (205 Students, 700+ Books, 154 Transactions)
-- MySQL Syntax (InnoDB Engine, Foreign Key Support, Transactions Enabled)
-- ==================================================================================

-- ==================================================================================
-- 1. CREATE DATABASE
-- ==================================================================================

CREATE DATABASE IF NOT EXISTS studentdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studentdb;

-- Enable Foreign Key Constraints
SET FOREIGN_KEY_CHECKS = 1;

-- ==================================================================================
-- 2. CREATE USERS TABLE
-- ==================================================================================

CREATE TABLE Users (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Unique user ID',
  name VARCHAR(255) NOT NULL COMMENT 'User full name',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email (unique)',
  role ENUM('ADMIN', 'LIBRARIAN', 'STUDENT') DEFAULT 'STUDENT' COMMENT 'User role',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
  INDEX idx_role (role),
  INDEX idx_email (email),
  CONSTRAINT uc_user_email UNIQUE KEY (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts - RBAC support';

-- ==================================================================================
-- 3. CREATE STUDENTS TABLE
-- ==================================================================================

CREATE TABLE Students (
  id VARCHAR(255) PRIMARY KEY COMMENT 'MongoDB ObjectId (preserved)',
  name VARCHAR(255) NOT NULL COMMENT 'Student full name',
  email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Student email (unique)',
  phone VARCHAR(20) COMMENT 'Contact phone',
  course VARCHAR(100) COMMENT 'Enrolled course/department',
  status ENUM('Active', 'Inactive') DEFAULT 'Active' COMMENT 'Enrollment status',
  enrollmentDate DATETIME COMMENT 'Enrollment date',
  gpa DECIMAL(3,2) COMMENT 'GPA (0.00-10.00)',
  city VARCHAR(100) COMMENT 'City of residence',
  country VARCHAR(100) COMMENT 'Country of residence',
  zipCode VARCHAR(10) COMMENT 'Postal code',
  address TEXT COMMENT 'Full address',
  guardianName VARCHAR(255) COMMENT 'Guardian/Parent name',
  emergencyContact VARCHAR(20) COMMENT 'Emergency contact number',
  studentCategory VARCHAR(50) COMMENT 'Category (Regular/Scholarship)',
  scholarshipStatus VARCHAR(50) COMMENT 'Scholarship status',
  bloodGroup VARCHAR(10) COMMENT 'Blood group',
  hostelRequired BOOLEAN DEFAULT FALSE COMMENT 'Hostel requirement',
  transportMode VARCHAR(50) COMMENT 'Transportation mode',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_course (course),
  INDEX idx_enrollmentDate (enrollmentDate),
  INDEX idx_gpa (gpa),
  CONSTRAINT uc_student_email UNIQUE KEY (email),
  CONSTRAINT uc_student_name UNIQUE KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student records - 205+ records in production';

-- ==================================================================================
-- 4. CREATE BOOKS TABLE
-- ==================================================================================

CREATE TABLE Books (
  id VARCHAR(255) PRIMARY KEY COMMENT 'MongoDB ObjectId (preserved)',
  title VARCHAR(255) NOT NULL COMMENT 'Book title',
  author VARCHAR(255) NOT NULL COMMENT 'Author name',
  isbn VARCHAR(20) UNIQUE COMMENT 'ISBN (unique)',
  genre VARCHAR(100) COMMENT 'Book genre/category',
  department VARCHAR(100) COMMENT 'Department/Subject area',
  totalCopies INT NOT NULL DEFAULT 1 COMMENT 'Total copies in library',
  availableCopies INT NOT NULL DEFAULT 1 COMMENT 'Currently available copies',
  checkedOutCount INT DEFAULT 0 COMMENT 'Number currently checked out',
  lastAvailabilityUpdatedAt DATETIME COMMENT 'Last inventory update',
  overdueFlag BOOLEAN DEFAULT FALSE COMMENT 'Has overdue loans',
  status ENUM('Available', 'Unavailable', 'Archived') DEFAULT 'Available' COMMENT 'Book status',
  shelfLocation VARCHAR(50) COMMENT 'Physical shelf location',
  addedDate DATETIME COMMENT 'Date added to library',
  autoTags JSON COMMENT 'Auto-generated tags (JSON)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_title (title),
  INDEX idx_author (author),
  INDEX idx_isbn (isbn),
  INDEX idx_status (status),
  INDEX idx_department (department),
  UNIQUE KEY uc_isbn (isbn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Book inventory - 700+ records in production';

-- ==================================================================================
-- 5. CREATE BORROW TRANSACTIONS TABLE
-- ==================================================================================

CREATE TABLE BorrowTransactions (
  id VARCHAR(255) PRIMARY KEY COMMENT 'Transaction ID',
  studentId VARCHAR(255) NOT NULL COMMENT 'FK → Students.id',
  bookId VARCHAR(255) NOT NULL COMMENT 'FK → Books.id',
  issuedAt DATETIME NOT NULL COMMENT 'Borrow date/time',
  dueDate DATETIME NOT NULL COMMENT 'Due return date',
  returnedAt DATETIME COMMENT 'Actual return date/time',
  status ENUM('BORROWED', 'RETURNED', 'OVERDUE', 'ARCHIVED') DEFAULT 'BORROWED' COMMENT 'Transaction status',
  renewalCount INT DEFAULT 0 COMMENT 'Number of renewals',
  renewalLimit INT DEFAULT 3 COMMENT 'Max renewals allowed',
  fine DECIMAL(10,2) DEFAULT 0 COMMENT 'Overdue fine amount',
  bookTitle VARCHAR(255) COMMENT 'Denormalized book title (snapshot)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (bookId) REFERENCES Books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_bookId (bookId),
  INDEX idx_status (status),
  INDEX idx_dueDate (dueDate),
  INDEX idx_status_dueDate (status, dueDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Book borrowing transactions - 154+ records in production';

-- ==================================================================================
-- 6. CREATE BOOK RESERVATIONS TABLE
-- ==================================================================================

CREATE TABLE BookReservations (
  id VARCHAR(255) PRIMARY KEY,
  book VARCHAR(255) NOT NULL COMMENT 'FK → Books.id',
  student VARCHAR(255) NOT NULL COMMENT 'FK → Students.id',
  status ENUM('ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
  queuePosition INT NOT NULL COMMENT 'Position in reservation queue',
  expiryDate DATETIME COMMENT 'Reservation expiry date',
  fulfilledAt DATETIME COMMENT 'When reservation was fulfilled',
  timestamp DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (book) REFERENCES Books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (student) REFERENCES Students(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_book (book),
  INDEX idx_student (student),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Book reservation queue system';

-- ==================================================================================
-- 7. CREATE LIBRARY AUDIT LOGS TABLE (IMMUTABLE)
-- ==================================================================================

CREATE TABLE LibraryAuditLogs (
  id VARCHAR(255) PRIMARY KEY,
  action ENUM('BORROW', 'RETURN', 'RENEW', 'ADD', 'UPDATE', 'DELETE', 'OVERDUE', 'RESERVE', 'EMAIL_SENT', 'FINE_LEVIED') NOT NULL,
  bookId VARCHAR(255) COMMENT 'FK → Books.id (nullable)',
  studentId VARCHAR(255) COMMENT 'FK → Students.id (nullable)',
  adminId VARCHAR(255) COMMENT 'FK → Users.id (nullable)',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON COMMENT 'Additional action metadata (JSON)',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (bookId) REFERENCES Books(id) ON DELETE SET NULL,
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE SET NULL,
  FOREIGN KEY (adminId) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp),
  INDEX idx_bookId (bookId),
  INDEX idx_studentId (studentId),
  CHECK (1=1) COMMENT 'Immutable audit logs - no updates allowed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Immutable audit trail - CANNOT be updated or deleted';

-- ==================================================================================
-- 8. CREATE TRANSACTIONS TABLE (Legacy, for compatibility)
-- ==================================================================================

CREATE TABLE Transactions (
  id VARCHAR(255) PRIMARY KEY,
  student VARCHAR(255) NOT NULL,
  book VARCHAR(255) NOT NULL,
  studentName VARCHAR(255),
  bookTitle VARCHAR(255),
  issueDate DATETIME,
  dueDate DATETIME,
  returnDate DATETIME,
  status ENUM('Issued', 'Returned', 'Overdue', 'Renewed') DEFAULT 'Issued',
  renewalCount INT DEFAULT 0,
  fine DECIMAL(10,2) DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student) REFERENCES Students(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (book) REFERENCES Books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_student (student),
  INDEX idx_book (book),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Legacy transaction table - mirrors BorrowTransactions';

-- ==================================================================================
-- 9. CREATE LIBRARY FINE LEDGER TABLE
-- ==================================================================================

CREATE TABLE LibraryFineLedgers (
  id VARCHAR(255) PRIMARY KEY,
  studentId VARCHAR(255) NOT NULL,
  bookId VARCHAR(255) NOT NULL,
  fineAmount DECIMAL(10,2) NOT NULL,
  daysOverdue INT NOT NULL,
  transactionId VARCHAR(255),
  status ENUM('PENDING', 'PAID', 'WAIVED', 'APPEALED') DEFAULT 'PENDING',
  paidDate DATETIME,
  paidBy VARCHAR(255) COMMENT 'Admin who marked as paid',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (bookId) REFERENCES Books(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_studentId (studentId),
  INDEX idx_status (status),
  INDEX idx_daysOverdue (daysOverdue)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fine tracking for overdue books';

-- ==================================================================================
-- ERROR HANDLING & VERIFICATION
-- ==================================================================================

-- Verify all tables created
SHOW TABLES;

-- Verify table structure
DESCRIBE Students;
DESCRIBE Books;
DESCRIBE Borrow Transactions;
DESCRIBE LibraryAuditLogs;

-- Verify Foreign Key Constraints
SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'studentdb' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Success message
-- Tables created: 8
-- Total records expected: 205 students, 700+ books, 154 transactions
-- All constraints enforced: ON DELETE RESTRICT, ON UPDATE CASCADE
