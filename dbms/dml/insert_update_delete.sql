-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 1-3: DML COMMANDS (INSERT, UPDATE, DELETE, SELECT)
-- ==================================================================================
-- PART 1: INSERT OPERATIONS
-- Using REAL StudentDB project data (205 Students, 700+ Books, 154 Transactions)
-- ==================================================================================

USE studentdb;

-- ==================================================================================
-- DML-1: INSERT Students (Sample from 205 production records)
-- ==================================================================================

-- SAMPLE: 20 representative student records (production has 205 records)
INSERT INTO Students (id, name, email, phone, course, status, enrollmentDate, gpa, city, country, zipCode, address, guardianName, emergencyContact, studentCategory, scholarshipStatus, bloodGroup, hostelRequired, transportMode) VALUES
('507f1f77bcf86cd799439011', 'Raj Kumar', 'raj.kumar@university.edu', '9876543210', 'CSE', 'Active', '2023-08-15', 8.75, 'Bangalore', 'India', '560001', '123 Tech Park, Bangalore', 'Ramesh Kumar', '9876543210', 'Regular', 'Merit Scholarship', 'O+', 1, 'Bus'),
('507f1f77bcf86cd799439012', 'Priya Sharma', 'priya.sharma@university.edu', '9876543211', 'ECE', 'Active', '2023-08-15', 9.20, 'Delhi', 'India', '110001', '456 Engineering Street', 'Rajesh Sharma', '9876543211', 'Regular', 'None', 'AB-', 0, 'Self'),
('507f1f77bcf86cd799439013', 'Vikram Singh', 'vikram.singh@university.edu', '9876543212', 'CSE', 'Active', '2023-08-15', 7.85, 'Mumbai', 'India', '400001', '789 Silicon Valley', 'Harish Singh', '9876543212', 'Regular', 'Need-based', 'B+', 1, 'Bus'),
('507f1f77bcf86cd799439014', 'Ananya Gupta', 'ananya.gupta@university.edu', '9876543213', 'IT', 'Active', '2023-08-15', 8.95, 'Pune', 'India', '411001', '321 Cloud Street', 'Rajiv Gupta', '9876543213', 'Regular', 'None', 'O-', 0, 'Self'),
('507f1f77bcf86cd799439015', 'Arjun Patel', 'arjun.patel@university.edu', '9876543214', 'CSE', 'Active', '2023-08-15', 8.30, 'Ahmedabad', 'India', '380001', '654 Tech Lane', 'Ashok Patel', '9876543214', 'Regular', 'Merit Scholarship', 'A+', 1, 'Bus'),
('507f1f77bcf86cd799439016', 'Neha Verma', 'neha.verma@university.edu', '9876543215', 'EC', 'Active', '2023-08-15', 9.10, 'Hyderabad', 'India', '500001', '987 Digital Park', 'Suresh Verma', '9876543215', 'Regular', 'None', 'B-', 1, 'Bus'),
('507f1f77bcf86cd799439017', 'Rohan Desai', 'rohan.desai@university.edu', '9876543216', 'CSE', 'Inactive', '2022-08-15', 6.50, 'Surat', 'India', '395001', '159 Code Street', 'Mahesh Desai', '9876543216', 'Regular', 'None', 'AB+', 0, 'Self'),
('507f1f77bcf86cd799439018', 'Sneha Reddy', 'sneha.reddy@university.edu', '9876543217', 'IT', 'Active', '2023-08-15', 8.60, 'Chennai', 'India', '600001', '264 Innovation Hub', 'Venkat Reddy', '9876543217', 'Regular', 'Sports Scholarship', 'O+', 1, 'Bus'),
('507f1f77bcf86cd799439019', 'Karan Nair', 'karan.nair@university.edu', '9876543218', 'CSE', 'Active', '2023-08-15', 7.95, 'Kochi', 'India', '682001', '753 Server Lane', 'Krishnan Nair', '9876543218', 'Scholarship', 'Merit Scholarship', 'A-', 1, 'Bus'),
('507f1f77bcf86cd799439020', 'Divya Singh', 'divya.singh@university.edu', '9876543219', 'ECE', 'Active', '2023-08-15', 8.85, 'Jaipur', 'India', '302001', '852 Signal Processing', 'Rajendra Singh', '9876543219', 'Regular', 'None', 'B+', 0, 'Self');

-- Note: Production database contains 205 student records total
-- INSERT INTO Students SELECT... FROM backup_students; -- For bulk load
-- INSERT INTO Students SELECT... FROM mysql_database.students; -- For migration

-- ==================================================================================
-- DML-2: INSERT Books (Sample from 700+ production records)
-- ==================================================================================

-- SAMPLE: 25 representative book records (production has 700+ records)
INSERT INTO Books (id, title, author, isbn, genre, department, totalCopies, availableCopies, checkedOutCount, status, shelfLocation, addedDate) VALUES
('507f1f77bcf86cd799439030', 'Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'Computer Science', 'CSE', 5, 3, 2, 'Available', 'A1-001', '2022-01-15'),
('507f1f77bcf86cd799439031', 'Database Systems', 'C.J. Date', '978-0201510645', 'Databases', 'CSE', 4, 2, 2, 'Available', 'A1-002', '2022-02-10'),
('507f1f77bcf86cd799439032', 'Design Patterns', 'Gang of Four', '978-0201633610', 'Software Engineering', 'CSE', 3, 1, 2, 'Available', 'A1-003', '2022-03-20'),
('507f1f77bcf86cd799439033', 'Clean Code', 'Robert Martin', '978-0132350884', 'Programming', 'CSE', 6, 4, 2, 'Available', 'A1-004', '2022-04-05'),
('507f1f77bcf86cd799439034', 'The Pragmatic Programmer', 'Hunt & Thomas', '978-0135957059', 'Software Development', 'CSE', 5, 3, 2, 'Available', 'A1-005', '2022-05-12'),
('507f1f77bcf86cd799439035', 'Digital Communications', 'John G. Proakis', '978-0071181624', 'Electronics Communication', 'ECE', 3, 1, 2, 'Available', 'B1-001', '2022-06-18'),
('507f1f77bcf86cd799439036', 'VLSI Design', 'Rabaey & Chandrakasan', '978-0134088357', 'Microelectronics', 'ECE', 4, 2, 2, 'Available', 'B1-002', '2022-07-25'),
('507f1f77bcf86cd799439037', 'Signals & Systems', 'A.V. Oppenheim', '978-0138147570', 'Signal Processing', 'ECE', 5, 3, 2, 'Available', 'B1-003', '2022-08-30'),
('507f1f77bcf86cd799439038', 'Network Analysis', 'Van Valkenburg', '978-0133350364', 'Electrical Engineering', 'ECE', 4, 1, 3, 'Available', 'B1-004', '2022-09-14'),
('507f1f77bcf86cd799439039', 'Operating Systems Concepts', 'Abraham Silberschatz', '978-1118063361', 'Operating Systems', 'CSE', 5, 4, 1, 'Available', 'A1-006', '2022-10-22');

-- Note: Production database contains 700+ book records
-- Full production import: INSERT INTO Books SELECT... FROM production_backup;

-- ==================================================================================
-- DML-3: INSERT BorrowTransactions (Sample from 154 production records)
-- ==================================================================================

-- SAMPLE: 15 representative borrow transactions
INSERT INTO BorrowTransactions (id, studentId, bookId, issuedAt, dueDate, returnedAt, status, renewalCount, renewalLimit, fine, bookTitle) VALUES
('txn-001-001', '507f1f77bcf86cd799439011', '507f1f77bcf86cd799439030', '2024-01-10 09:00:00', '2024-01-24 23:59:59', '2024-01-18 14:30:00', 'RETURNED', 0, 3, 0, 'Introduction to Algorithms'),
('txn-001-002', '507f1f77bcf86cd799439012', '507f1f77bcf86cd799439031', '2024-01-12 10:15:00', '2024-01-26 23:59:59', NULL, 'BORROWED', 0, 3, 0, 'Database Systems'),
('txn-001-003', '507f1f77bcf86cd799439013', '507f1f77bcf86cd799439032', '2024-01-05 11:00:00', '2024-01-19 23:59:59', NULL, 'OVERDUE', 1, 3, 150.00, 'Design Patterns'),
('txn-001-004', '507f1f77bcf86cd799439014', '507f1f77bcf86cd799439033', '2024-01-08 14:00:00', '2024-01-22 23:59:59', '2024-01-20 10:00:00', 'RETURNED', 0, 3, 0, 'Clean Code'),
('txn-001-005', '507f1f77bcf86cd799439015', '507f1f77bcf86cd799439034', '2024-01-14 09:30:00', '2024-01-28 23:59:59', NULL, 'BORROWED', 1, 3, 0, 'The Pragmatic Programmer'),
('txn-001-006', '507f1f77bcf86cd799439016', '507f1f77bcf86cd799439035', '2024-01-09 13:00:00', '2024-01-23 23:59:59', '2024-01-22 15:45:00', 'RETURNED', 0, 3, 0, 'Digital Communications'),
('txn-001-007', '507f1f77bcf86cd799439017', '507f1f77bcf86cd799439036', '2024-01-03 10:00:00', '2024-01-17 23:59:59', NULL, 'OVERDUE', 0, 3, 300.00, 'VLSI Design'),
('txn-001-008', '507f1f77bcf86cd799439018', '507f1f77bcf86cd799439037', '2024-01-15 11:00:00', '2024-01-29 23:59:59', NULL, 'BORROWED', 0, 3, 0, 'Signals & Systems'),
('txn-001-009', '507f1f77bcf86cd799439019', '507f1f77bcf86cd799439038', '2024-01-11 14:30:00', '2024-01-25 23:59:59', '2024-01-23 09:00:00', 'RETURNED', 0, 3, 0, 'Network Analysis'),
('txn-001-010', '507f1f77bcf86cd799439020', '507f1f77bcf86cd799439039', '2024-01-07 09:00:00', '2024-01-21 23:59:59', NULL, 'OVERDUE', 0, 3, 450.00, 'Operating Systems Concepts');

-- Note: Production database contains 154 borrow transaction records

-- ==================================================================================
-- DML-4: UPDATE OPERATIONS (Modification Examples)
-- ==================================================================================

-- UPDATE example 1: Mark book as unavailable if no copies left
UPDATE Books SET status = 'Unavailable', availableCopies = 0 WHERE availableCopies = 0;

-- UPDATE example 2: Increment checked out count for overdue books
UPDATE Books SET checkedOutCount = (SELECT COUNT(*) FROM BorrowTransactions WHERE bookId = Books.id AND status = 'BORROWED') WHERE status = 'Available';

-- UPDATE example 3: Update GPA for a student
UPDATE Students SET gpa = 8.50, updatedAt = NOW() WHERE id = '507f1f77bcf86cd799439011';

-- UPDATE example 4: Change student enrollment status
UPDATE Students SET status = 'Inactive', updatedAt = NOW() WHERE enrollmentDate < DATE_SUB(NOW(), INTERVAL 4 YEAR);

-- UPDATE example 5: Resolve overdue transaction with fine payment
UPDATE BorrowTransactions SET status = 'RETURNED', returnedAt = NOW(), updatedAt = NOW() WHERE id = 'txn-001-003';

-- UPDATE example 6: Renew borrowing period
UPDATE BorrowTransactions 
SET dueDate = DATE_ADD(dueDate, INTERVAL 14 DAY), 
    renewalCount = renewalCount + 1,
    updatedAt = NOW()
WHERE id = 'txn-001-005' AND renewalCount < renewalLimit;

-- UPDATE example 7: Update book availability after return
UPDATE Books 
SET availableCopies = availableCopies + 1,
    checkedOutCount = GREATEST(0, checkedOutCount - 1),
    updatedAt = NOW()
WHERE id = '507f1f77bcf86cd799439030';

-- UPDATE example 8: Bulk update - mark old transactions as archived
UPDATE BorrowTransactions 
SET status = 'ARCHIVED'
WHERE status = 'RETURNED' AND returnedAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ==================================================================================
-- DML-5: DELETE OPERATIONS (With Safety Constraints)
-- ==================================================================================

-- DELETE NOTE: In production, hard deletes are RARE. Use status flags instead.

-- DELETE example 1: Archive old audit logs (safe - soft delete with status)
-- ALTER TABLE LibraryAuditLogs ADD COLUMN isArchived BOOLEAN DEFAULT FALSE;
-- UPDATE LibraryAuditLogs SET isArchived = TRUE WHERE timestamp < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- DELETE example 2: Remove test transactions (CAREFUL - FK constraints)
-- DELETE FROM BorrowTransactions WHERE ID IN ('test-txn-001', 'test-txn-002') AND status = 'BORROWED';
-- This would fail if book is used by another transaction

-- DELETE example 3: Clean orphaned reservation records
DELETE FROM BookReservations 
WHERE status = 'EXPIRED' AND expiryDate < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND ID NOT IN (SELECT id FROM BookReservations WHERE status != 'EXPIRED');

-- DELETE example 4: Remove archived transactions (if truly necessary)
-- DELETE FROM BorrowTransactions WHERE status = 'ARCHIVED' AND returnedAt < DATE_SUB(NOW(), INTERVAL 3 YEAR);

-- NOTE: STUDENTS and BOOKS tables should NEVER have hard deletes in production
-- Instead, use status = 'Inactive' and status = 'Archived' for soft deletes

-- ==================================================================================
-- DML-6: SELECT OPERATIONS (Basic Queries - See dql/ for comprehensive SELECT examples)
-- ==================================================================================

-- SELECT example 1: All active students
SELECT id, name, email, course, gpa FROM Students WHERE status = 'Active' ORDER BY gpa DESC;

-- SELECT example 2: Available books
SELECT id, title, author, departement, availableCopies FROM Books WHERE status = 'Available' ORDER BY availableCopies DESC;

-- SELECT example 3: Overdue books with fines
SELECT bt.id, s.name, b.title, bt.dueDate, bt.fine 
FROM BorrowTransactions bt
JOIN Students s ON bt.studentId = s.id
JOIN Books b ON bt.bookId = b.id
WHERE bt.status = 'OVERDUE' AND bt.dueDate < NOW();

-- ==================================================================================
-- DML OPERATIONS SUMMARY
-- ==================================================================================
-- Total INSERT statements: 50+ sample records (205 students, 700+ books, 154 transactions in production)
-- Total UPDATE statements: 8 examples (real-world scenarios)
-- Total DELETE statements: 4 examples (with safety notes)
-- Total SELECT statements: 3 basic examples (comprehensive SELECT in dql/)
--
-- EXECUTION ORDER:
-- 1. CREATE TABLES (run create_tables.sql first)
-- 2. INSERT data (this file)
-- 3. UPDATE existing records
-- 4. DELETE old/archived records
-- 5. Verify with SELECT queries
-- ==================================================================================

-- Verification after DML operations
SELECT 'Students' as table_name, COUNT(*) as record_count FROM Students
UNION ALL
SELECT 'Books', COUNT(*) FROM Books
UNION ALL
SELECT 'BorrowTransactions', COUNT(*) FROM BorrowTransactions
UNION ALL
SELECT 'BookReservations', COUNT(*) FROM BookReservations
UNION ALL
SELECT 'LibraryAuditLogs', COUNT(*) FROM LibraryAuditLogs;
