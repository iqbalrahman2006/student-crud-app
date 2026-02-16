-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 10: AGGREGATE FUNCTIONS & CONSTRAINTS
-- ==================================================================================
USE studentdb;

-- ==================================================================================
-- AGGREGATE FUNCTIONS: SUM, AVG, COUNT, MIN, MAX, GROUP_CONCAT
-- ==================================================================================

-- ==================================================================================
-- AGG-1: COUNT Functions
-- ==================================================================================

-- Count total students
SELECT COUNT(*) as total_students FROM Students;

-- Count active students only
SELECT COUNT(*) as active_count FROM Students WHERE status = 'Active';

-- Count distinct courses
SELECT COUNT(DISTINCT course) as distinct_courses FROM Students;

-- Count students per course (GROUP BY)
SELECT course, COUNT(*) as student_count FROM Students GROUP BY course ORDER BY student_count DESC;

-- Count with HAVING filter
SELECT course, COUNT(*) as count FROM Students GROUP BY course HAVING COUNT(*) > 5;

-- ==================================================================================
-- AGG-2: SUM and AVERAGE Functions
-- ==================================================================================

-- Total books in library
SELECT SUM(totalCopies) as total_books FROM Books;

-- Average GPA of students
SELECT AVG(gpa) as average_gpa FROM Students;

-- Average GPA per course
SELECT course, AVG(gpa) as avg_gpa, COUNT(*) as students FROM Students 
GROUP BY course 
ORDER BY avg_gpa DESC;

-- Total fines collected
SELECT SUM(fine) as total_fines FROM BorrowTransactions;

-- Average fine per overdue transaction
SELECT AVG(fine) as avg_fine FROM BorrowTransactions WHERE status = 'OVERDUE';

-- Total and average copies per department
SELECT department, 
       SUM(totalCopies) as total_in_dept,
       AVG(totalCopies) as avg_per_book,
       COUNT(*) as book_count
FROM Books
GROUP BY department
ORDER BY total_in_dept DESC;

-- ==================================================================================
-- AGG-3: MIN and MAX Functions
-- ==================================================================================

-- Highest and lowest GPA
SELECT 
  MAX(gpa) as highest_gpa,
  MIN(gpa) as lowest_gpa,
  MAX(gpa) - MIN(gpa) as gpa_range
FROM Students;

-- Student with highest GPA
SELECT * FROM Students WHERE gpa = (SELECT MAX(gpa) FROM Students);

-- Book with most copies
SELECT * FROM Books WHERE totalCopies = (SELECT MAX(totalCopies) FROM Books);

-- Latest enrollment date
SELECT MAX(enrollmentDate) as latest_enrollment FROM Students;

-- Earliest book added to library
SELECT MIN(addedDate) as oldest_book FROM Books;

-- ==================================================================================
-- AGG-4: GROUP_CONCAT (String Aggregation - MySQL specific)
-- ==================================================================================

-- All students per course (comma-separated)
SELECT course, GROUP_CONCAT(name SEPARATOR ', ') as students
FROM Students
GROUP BY course;

-- All books by author
SELECT author, GROUP_CONCAT(title SEPARATOR ' | ') as books
FROM Books
GROUP BY author
HAVING COUNT(*) > 1;

-- Authors with multiple books
SELECT author, GROUP_CONCAT(title SEPARATOR ', ') as titles, COUNT(*) as book_count
FROM Books
GROUP BY author
HAVING COUNT(*) > 1
ORDER BY book_count DESC;

-- ==================================================================================
-- AGG-5: STATISTICAL AGGREGATES (Window Functions - MySQL 8.0+)
-- ==================================================================================

-- Running total of students enrolled over time
SELECT 
  name,
  enrollmentDate,
  SUM(1) OVER (ORDER BY enrollmentDate) as cumulative_enrollments
FROM Students
ORDER BY enrollmentDate;

-- Rank students by GPA within course
SELECT 
  name,
  course,
  gpa,
  RANK() OVER (PARTITION BY course ORDER BY gpa DESC) as gpa_rank
FROM Students;

-- ==================================================================================
-- AGG-6: COMPLEX AGGREGATION (Real Dashboard Queries)
-- ==================================================================================

-- Overall library statistics
SELECT 
  (SELECT COUNT(*) FROM Students) as total_students,
  (SELECT COUNT(*) FROM Books) as total_books,
  (SELECT COUNT(*) FROM BorrowTransactions WHERE status = 'BORROWED') as currently_borrowed,
  (SELECT COUNT(*) FROM BorrowTransactions WHERE status = 'OVERDUE') as overdue_count,
  (SELECT SUM(fine) FROM BorrowTransactions WHERE status = 'OVERDUE') as overdue_fines,
  (SELECT COUNT(*) FROM BookReservations WHERE status = 'ACTIVE') as active_reservations;

-- Student activity summary
SELECT 
  s.id,
  s.name,
  COUNT(bt.id) as total_borrows,
  COUNT(CASE WHEN bt.status = 'BORROWED' THEN 1 END) as current_borrows,
  COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) as overdue_books,
  SUM(CASE WHEN bt.status = 'OVERDUE' THEN bt.fine ELSE 0 END) as total_fines
FROM Students s
LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId
GROUP BY s.id, s.name
ORDER BY overdue_books DESC;

-- Book popularity report
SELECT 
  b.id,
  b.title,
  b.author,
  COUNT(bt.id) as times_borrowed,
  COUNT(CASE WHEN bt.status = 'BORROWED' THEN 1 END) as currently_out,
  COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) as currently_overdue,
  SUM(CASE WHEN bt.status = 'OVERDUE' THEN bt.fine ELSE 0 END) as fines_from_overdue
FROM Books b
LEFT JOIN BorrowTransactions bt ON b.id = bt.bookId
GROUP BY b.id, b.title, b.author
ORDER BY times_borrowed DESC
LIMIT 20;

-- ==================================================================================
-- CONSTRAINTS: Enforcing Data Integrity
-- ==================================================================================

-- ==================================================================================
-- CONSTRAINT-1: PRIMARY KEY (Uniqueness + Not Null)
-- ==================================================================================

-- Already defined in create_tables.sql
-- Example: id VARCHAR(255) PRIMARY KEY

-- Verify primary keys
SELECT TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'studentdb' AND CONSTRAINT_NAME = 'PRIMARY';

-- ==================================================================================
-- CONSTRAINT-2: UNIQUE (Uniqueness, allows null)
-- ==================================================================================

-- Email must be unique
ALTER TABLE Students ADD CONSTRAINT uc_student_email UNIQUE (email);
ALTER TABLE Books ADD CONSTRAINT uc_book_isbn UNIQUE (isbn);

-- Verify unique constraints
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'studentdb' AND CONSTRAINT_NAME LIKE 'uc_%';

-- ==================================================================================
-- CONSTRAINT-3: NOT NULL (Mandatory columns)
-- ==================================================================================

-- Examples already in create_tables.sql:
-- name VARCHAR(255) NOT NULL
-- email VARCHAR(255) NOT NULL

-- Add NOT NULL constraint to existing column
ALTER TABLE Students MODIFY phone VARCHAR(20) NOT NULL;

-- ==================================================================================
-- CONSTRAINT-4: CHECK (Column value validation)
-- ==================================================================================

-- Add check constraint (GPA between 0 and 10)
ALTER TABLE Students ADD CONSTRAINT chk_gpa CHECK (gpa >= 0 AND gpa <= 10);

-- Add check: total copies >= available copies
ALTER TABLE Books ADD CONSTRAINT chk_copies CHECK (availableCopies >= 0 AND availableCopies <= totalCopies);

-- Add check for enum-like values
ALTER TABLE Students ADD CONSTRAINT chk_status CHECK (status IN ('Active', 'Inactive'));

-- Verify check constraints
SELECT CONSTRAINT_NAME, TABLE_NAME, CHECK_CLAUSE
FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'studentdb';

-- ==================================================================================
-- CONSTRAINT-5: DEFAULT VALUES
-- ==================================================================================

-- Already defined in tables, examples:
-- status ENUM('Active', 'Inactive') DEFAULT 'Active'
-- createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP

-- Update with defaults
INSERT INTO Students (id, name, email, course) 
VALUES ('507f1f77bcf86cd799439099', 'New Student', 'new@university.edu', 'CSE');
-- status defaults to 'Active', gpa to NULL, createdAt to NOW()

-- ==================================================================================
-- CONSTRAINT-6: FOREIGN KEY (Referential Integrity)
-- ==================================================================================

-- Already defined in create_tables.sql, example:
-- FOREIGN KEY (studentId) REFERENCES Students(id) ON DELETE RESTRICT ON UPDATE CASCADE

-- Verify foreign keys
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'studentdb' AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Test FK constraint (this will FAIL):
-- INSERT INTO BorrowTransactions (id, studentId, bookId, issuedAt, dueDate, status)
-- VALUES ('fail', 'non-existent-id', 'book-id', NOW(), NOW(), 'BORROWED');
-- Error: Cannot add or update a child row: a foreign key constraint fails

-- ==================================================================================
-- CONSTRAINT-7: TRIGGERS (Automatic Action Constraints)
-- ==================================================================================

-- Trigger: Automatically update availableCopies when book is borrowed
DELIMITER //
CREATE TRIGGER trg_borrow_book_availability
AFTER INSERT ON BorrowTransactions
FOR EACH ROW
BEGIN
  UPDATE Books 
  SET availableCopies = availableCopies - 1,
      checkedOutCount = checkedOutCount + 1
  WHERE id = NEW.bookId;
END//
DELIMITER ;

-- Trigger: Automatically update availableCopies when book is returned
DELIMITER //
CREATE TRIGGER trg_return_book_availability
AFTER UPDATE ON BorrowTransactions
FOR EACH ROW
BEGIN
  IF NEW.status = 'RETURNED' AND OLD.status = 'BORROWED' THEN
    UPDATE Books 
    SET availableCopies = availableCopies + 1,
        checkedOutCount = checkedOutCount - 1
    WHERE id = NEW.bookId;
  END IF;
END//
DELIMITER ;

-- Trigger: Log audit trail on borrow
DELIMITER //
CREATE TRIGGER trg_audit_borrow
AFTER INSERT ON BorrowTransactions
FOR EACH ROW
BEGIN
  INSERT INTO LibraryAuditLogs (id, action, bookId, studentId, timestamp)
  VALUES (UUID(), 'BORROW', NEW.bookId, NEW.studentId, NOW());
END//
DELIMITER ;

-- List all triggers
SELECT TRIGGER_SCHEMA, TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = 'studentdb';

-- ==================================================================================
-- CONSTRAINT TESTING & VERIFICATION
-- ==================================================================================

-- Test 1: Try inserting duplicate email (should FAIL - UNIQUE)
-- INSERT INTO Students VALUES ('id', 'name', 'raj.kumar@university.edu', ...);
-- Error: Duplicate entry

-- Test 2: Try inserting invalid GPA (should FAIL - CHECK)
-- INSERT INTO Students VALUES ('id', 'name', 'email@test.edu', 'CSE', 15.0, ...);
-- Error: Check constraint violation

-- Test 3: Try inserting invalid status (should FAIL - CHECK)
-- INSERT INTO Students (..., status = 'Unknown', ...);
-- Error: Check constraint violation

-- Test 4: Try referencing non-existent student (should FAIL - FK)
-- INSERT INTO BorrowTransactions VALUES ('id', 'invalid-id', 'book-id', ...);
-- Error: Foreign key constraint fails

-- Successful aggregation and constraint verification
SELECT 'All constraints verified' as result;
