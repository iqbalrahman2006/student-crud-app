-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 6-7: TCL & DCL COMMANDS (Transactions, Access Control)
-- ==================================================================================
USE studentdb;

-- ==================================================================================
-- TCL-1: TRANSACTION CONTROL LANGUAGE
-- TCL = BEGIN, COMMIT, ROLLBACK, SAVEPOINT
-- ==================================================================================

-- Transaction Example 1: Simple BORROW operation (Atomic)
-- ==================================================================================
START TRANSACTION;
-- Or BEGIN; (MySQL synonym)

-- Step 1: Add borrow transaction record
INSERT INTO BorrowTransactions (
  id, studentId, bookId, issuedAt, dueDate, status, renewalCount, renewalLimit, bookTitle
) VALUES (
  'txn-2024-001',
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439030',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 14 DAY),
  'BORROWED',
  0,
  3,
  'Introduction to Algorithms'
);

-- Step 2: Decrement book availability
UPDATE Books SET availableCopies = availableCopies - 1, checkedOutCount = checkedOutCount + 1 WHERE id = '507f1f77bcf86cd799439030';

-- Step 3: Log to audit trail
INSERT INTO LibraryAuditLogs (id, action, bookId, studentId, timestamp) VALUES (
  UUID(),
  'BORROW',
  '507f1f77bcf86cd799439030',
  '507f1f77bcf86cd799439011',
  NOW()
);

-- If all steps succeed, commit
COMMIT;

-- If any step fails, execute instead:
-- ROLLBACK;  -- Undoes all changes in this transaction


-- Transaction Example 2: RETURN book with fine calculation
-- ==================================================================================
START TRANSACTION;

-- Step 1: Get transaction details
SET @txn_id = 'txn-2024-001';
SET @student_id = (SELECT studentId FROM BorrowTransactions WHERE id = @txn_id);
SET @book_id = (SELECT bookId FROM BorrowTransactions WHERE id = @txn_id);
SET @due_date = (SELECT dueDate FROM BorrowTransactions WHERE id = @txn_id);
SET @days_overdue = (SELECT GREATEST(0, DATEDIFF(NOW(), @due_date)));
SET @fine_amount = @days_overdue * 10;  -- Rs 10 per day

-- Step 2: Update borrow transaction
UPDATE BorrowTransactions SET returnedAt = NOW(), status = 'RETURNED', fine = @fine_amount WHERE id = @txn_id;

-- Step 3: Update book availability
UPDATE Books SET availableCopies = availableCopies + 1, checkedOutCount = checkedOutCount - 1 WHERE id = @book_id;

-- Step 4: Add fine ledger entry if overdue
IF @fine_amount > 0 THEN
  INSERT INTO LibraryFineLedgers (id, studentId, bookId, fineAmount, daysOverdue, transactionId, status) VALUES (
    UUID(),
    @student_id,
    @book_id,
    @fine_amount,
    @days_overdue,
    @txn_id,
    'PENDING'
  );
END IF;

-- Step 5: Log audit event
INSERT INTO LibraryAuditLogs (id, action, bookId, studentId, timestamp, metadata) VALUES (
  UUID(),
  'RETURN',
  @book_id,
  @student_id,
  NOW(),
  JSON_OBJECT('fine', @fine_amount, 'daysOverdue', @days_overdue)
);

COMMIT;
-- ROLLBACK;  -- If any step fails


-- Transaction Example 3: SAVEPOINT (Nested Transaction Points)
-- ==================================================================================
START TRANSACTION;

-- Savepoint 1: Create base records
INSERT INTO Students (id, name, email, phone, course, status, enrollmentDate, gpa) VALUES (
  UUID(),
  'New Student',
  'newstudent@university.edu',
  '9999999999',
  'CSE',
  'Active',
  NOW(),
  8.5
);

SAVEPOINT sp_student_created;

-- Savepoint 2: Try to create transaction
INSERT INTO BorrowTransactions (id, studentId, bookId, issuedAt, dueDate, status) VALUES (
  UUID(),
  (SELECT id FROM Students WHERE email = 'newstudent@university.edu'),
  '507f1f77bcf86cd799439030',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 14 DAY),
  'BORROWED'
);

SAVEPOINT sp_transaction_created;

-- If error occurs, rollback to specific savepoint
-- ROLLBACK TO sp_transaction_created;  -- Undo transaction, keep student

COMMIT;


-- Transaction Example 4: ISOLATION LEVEL and LOCKING
-- ==================================================================================

-- Set transaction isolation level (affects concurrency)
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

START TRANSACTION;
-- Use consistent reads with FOR UPDATE for pessimistic locking
SELECT * FROM Books WHERE id = '507f1f77bcf86cd799439030' FOR UPDATE;

-- Perform updates safely (no race conditions)
UPDATE Books SET availableCopies = availableCopies - 1 WHERE id = '507f1f77bcf86cd799439030';

COMMIT;

-- Isolation Levels (in order of strictness):
-- 1. READ UNCOMMITTED: Can read uncommitted changes (dirty reads)
-- 2. READ COMMITTED: Only read committed changes (default)
-- 3. REPEATABLE READ: Snapshot isolation
-- 4. SERIALIZABLE: Full isolation (slowest)


-- ==================================================================================
-- DCL-1: DATA CONTROL LANGUAGE
-- DCL = GRANT, REVOKE (Managing user permissions)
-- ==================================================================================

-- DCL Example 1: Create user accounts
-- ==================================================================================

-- Create Admin User
CREATE USER IF NOT EXISTS 'admin_user'@'localhost' IDENTIFIED BY 'admin_pass_123';

-- Create Librarian User
CREATE USER IF NOT EXISTS 'librarian'@'localhost' IDENTIFIED BY 'librarian_pass_123';

-- Create Student User
CREATE USER IF NOT EXISTS 'student'@'localhost' IDENTIFIED BY 'student_pass_123';

-- Create Read-Only User
CREATE USER IF NOT EXISTS 'readonly'@'localhost' IDENTIFIED BY 'readonly_pass_123';


-- DCL Example 2: GRANT permissions - ADMIN (Full Access)
-- ==================================================================================

GRANT ALL PRIVILEGES ON studentdb.* TO 'admin_user'@'localhost';
-- Grants: SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, GRANT, etc.


-- DCL Example 3: GRANT permissions - LIBRARIAN (Full operational access)
-- ==================================================================================

-- Can perform all CRUD operations
GRANT SELECT, INSERT, UPDATE, DELETE ON studentdb.* TO 'librarian'@'localhost';

-- Specifically allow borrow/return operations
GRANT SELECT, INSERT, UPDATE ON studentdb.Students TO 'librarian'@'localhost';
GRANT SELECT, INSERT, UPDATE ON studentdb.Books TO 'librarian'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON studentdb.BorrowTransactions TO 'librarian'@'localhost';
GRANT SELECT, INSERT ON studentdb.LibraryAuditLogs TO 'librarian'@'localhost';  -- Can INSERT logs, not modify

-- Prevent librarian from dropping tables
-- (Implicit - not explicitly granted DROP privilege)


-- DCL Example 4: GRANT permissions - STUDENT (Limited access)
-- ==================================================================================

-- Can view their own records
GRANT SELECT ON studentdb.Students TO 'student'@'localhost';

-- Can view available books
GRANT SELECT ON studentdb.Books TO 'student'@'localhost';

-- Can view (but not modify) their own transactions
GRANT SELECT ON studentdb.BorrowTransactions TO 'student'@'localhost';

-- Note: Row-Level Security (RLS) would be implemented at application layer
-- SQL itself doesn't limit which ROWS a user can see, only which TABLES


-- DCL Example 5: GRANT permissions - READ-ONLY USER
-- ==================================================================================

GRANT SELECT ON studentdb.* TO 'readonly'@'localhost';
-- Only SELECT; no INSERT, UPDATE, DELETE, or administrative commands


-- DCL Example 6: REVOKE permissions
-- ==================================================================================

-- Remove DELETE permission from student account
REVOKE DELETE ON studentdb.* FROM 'student'@'localhost';

-- Remove all permissions and drop user
REVOKE ALL PRIVILEGES ON studentdb.* FROM 'readonly'@'localhost';
DROP USER 'readonly'@'localhost';

-- Revoke specific permissions
REVOKE INSERT, UPDATE ON studentdb.BorrowTransactions FROM 'student'@'localhost';


-- DCL Example 7: View user permissions
-- ==================================================================================

-- Show current user
SELECT USER();

-- Show all users
SELECT User, Host FROM mysql.user;

-- Show specific user permissions
SHOW GRANTS FOR 'librarian'@'localhost';
SHOW GRANTS FOR 'student'@'localhost';

-- Show current session privileges
SHOW PRIVILEGES;


-- DCL Example 8: Role-Based Access Control (RBAC) - MySQL 8.0+
-- ==================================================================================

-- Create Roles
CREATE ROLE IF NOT EXISTS 'admin_role';
CREATE ROLE IF NOT EXISTS 'librarian_role';
CREATE ROLE IF NOT EXISTS 'student_role';

-- Grant privileges to roles
GRANT ALL PRIVILEGES ON studentdb.* TO 'admin_role';
GRANT SELECT, INSERT, UPDATE ON studentdb.* TO 'librarian_role';
GRANT SELECT ON studentdb.* TO 'student_role';

-- Assign roles to users
-- GRANT 'admin_role' TO 'admin_user'@'localhost';
-- GRANT 'librarian_role' TO 'librarian'@'localhost';
-- GRANT 'student_role' TO 'student'@'localhost';

-- Activate role for current session
-- SET ROLE 'admin_role';


-- ==================================================================================
-- TCL & DCL COMBINED EXAMPLE: Complete Borrow Operation with Security
-- ==================================================================================

-- Assuming logged in as 'librarian'@'localhost'

START TRANSACTION;

-- 1. Verify student exists and is active
SELECT id INTO @student_id FROM Students WHERE id = '507f1f77bcf86cd799439012' AND status = 'Active';

IF @student_id IS NULL THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found or inactive';
END IF;

-- 2. Verify book is available
SELECT id INTO @book_id FROM Books WHERE id = '507f1f77bcf86cd799439031' AND availableCopies > 0;

IF @book_id IS NULL THEN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not available';
END IF;

-- 3. Insert transaction (with FOR UPDATE lock)
INSERT INTO BorrowTransactions (id, studentId, bookId, issuedAt, dueDate, status, renewalCount, renewalLimit) VALUES (
  UUID(),
  @student_id,
  @book_id,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 14 DAY),
  'BORROWED',
  0,
  3
);

-- 4. Update book availability
UPDATE Books SET availableCopies = availableCopies - 1 WHERE id = @book_id;

-- 5. Log to audit
INSERT INTO LibraryAuditLogs (id, action, bookId, studentId, timestamp) VALUES (UUID(), 'BORROW', @book_id, @student_id, NOW());

COMMIT;

-- ==================================================================================
-- TCL & DCL EXECUTION VERIFICATION
-- ==================================================================================

-- Verify transactions worked:
SELECT COUNT(*) AS total_transactions FROM BorrowTransactions;
SELECT COUNT(*) AS total_audit_logs FROM LibraryAuditLogs;

-- Verify permissions set:
SHOW GRANTS FOR 'librarian'@'localhost';
SHOW GRANTS FOR 'student'@'localhost';

-- ==================================================================================
-- SUMMARY
-- ==================================================================================
-- TCL: Controls transaction atomicity (ACID properties)
--   - BEGIN/START TRANSACTION: Start transaction
--   - COMMIT: Save all changes
--   - ROLLBACK: Undo all changes
--   - SAVEPOINT: Create intermediate rollback points
--   - FOR UPDATE: Lock rows during transaction
--
-- DCL: Controls who can do what
--   - GRANT: Give permissions to users/roles
--   - REVOKE: Remove permissions from users/roles
--   - CREATE USER: Create login accounts
--   - CREATE ROLE: Create permission groups (MySQL 8.0+)
--   - Isolation Levels: Control transaction concurrency
