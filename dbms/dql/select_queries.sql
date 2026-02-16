-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 4-5: DQL COMMANDS (SELECT, WHERE, GROUP BY, JOIN, ORDER BY)
-- ==================================================================================
USE studentdb;

-- ==================================================================================
-- DQL-1: BASIC SELECT QUERIES
-- ==================================================================================

-- Query 1: Select all columns from Students
SELECT * FROM Students;

-- Query 2: Select specific columns
SELECT id, name, email, gpa FROM Students;

-- Query 3: Select with column alias
SELECT id AS student_id, name AS student_name, email AS student_email, gpa AS grade_point_average FROM Students;

-- Query 4: Select with calculated column
SELECT id, name, email, gpa, (gpa * 10) AS percentage FROM Students;

-- Query 5: Select first 10 records
SELECT id, name, email, gpa FROM Students LIMIT 10;

-- Query 6: Select with OFFSET and LIMIT (pagination)
SELECT id, name, email, gpa FROM Students LIMIT 5 OFFSET 5;

-- ==================================================================================
-- DQL-2: WHERE CLAUSE (Filtering Conditions)
-- ==================================================================================

-- Query 7: WHERE with single condition
SELECT name, email, gpa FROM Students WHERE gpa > 8.0;

-- Query 8: WHERE with AND operator
SELECT name, email, gpa, course FROM Students WHERE gpa > 8.0 AND status = 'Active';

-- Query 9: WHERE with OR operator
SELECT name, email, course FROM Students WHERE course = 'CSE' OR course = 'IT';

-- Query 10: WHERE with IN operator
SELECT name, email, course FROM Students WHERE course IN ('CSE', 'ECE', 'IT', 'Mechanical');

-- Query 11: WHERE with BETWEEN operator
SELECT name, email, gpa FROM Students WHERE gpa BETWEEN 7.0 AND 8.5;

-- Query 12: WHERE with LIKE operator (pattern matching)
SELECT name, email FROM Students WHERE name LIKE 'R%';  -- Names starting with R
SELECT name, email FROM Students WHERE email LIKE '%@university.edu';

-- Query 13: WHERE with NOT operator
SELECT name, email, status FROM Students WHERE status != 'Inactive';
SELECT name, email FROM Students WHERE course NOT IN ('CSE', 'ECE');

-- Query 14: WHERE with IS NULL / IS NOT NULL
SELECT id, name, city FROM Students WHERE city IS NULL;
SELECT id, name, city FROM Students WHERE city IS NOT NULL;

-- ==================================================================================
-- DQL-3: ORDER BY CLAUSE (Sorting)
-- ==================================================================================

-- Query 15: ORDER BY ascending (default)
SELECT name, email, gpa FROM Students ORDER BY gpa ASC;

-- Query 16: ORDER BY descending
SELECT name, email, gpa FROM Students ORDER BY gpa DESC;

-- Query 17: ORDER BY with multiple columns
SELECT name, course, gpa, enrollmentDate FROM Students ORDER BY course ASC, gpa DESC;

-- Query 18: ORDER BY with LIMIT (Top N records)
SELECT name, email, gpa FROM Students ORDER BY gpa DESC LIMIT 5;  -- Top 5 students by GPA

-- Query 19: ORDER BY with WHERE clause
SELECT name, course, gpa FROM Students WHERE status = 'Active' ORDER BY gpa DESC;

-- ==================================================================================
-- DQL-4: AGGREGATE FUNCTIONS
-- ==================================================================================

-- Query 20: COUNT function
SELECT COUNT(*) AS total_students FROM Students;
SELECT COUNT(DISTINCT course) AS courses_offered FROM Students;
SELECT COUNT(*) AS active_students FROM Students WHERE status = 'Active';

-- Query 21: SUM function
SELECT SUM(totalCopies) AS total_books_published FROM Books;
SELECT SUM(fine) AS total_fines_collected FROM BorrowTransactions;

-- Query 22: AVG function
SELECT AVG(gpa) AS average_gpa FROM Students;
SELECT AVG(totalCopies) AS avg_copies_per_book FROM Books;

-- Query 23: MIN and MAX functions
SELECT MIN(gpa) AS lowest_gpa, MAX(gpa) AS highest_gpa FROM Students;
SELECT MIN(enrollmentDate) AS earliest_enrollment, MAX(enrollmentDate) AS latest_enrollment FROM Students;

-- Query 24: MIN/MAX with names
SELECT name, gpa FROM Students WHERE gpa = (SELECT MAX(gpa) FROM Students);  -- Top student
SELECT name, gpa FROM Students WHERE gpa = (SELECT MIN(gpa) FROM Students);  -- Lowest GPA

-- ==================================================================================
-- DQL-5: GROUP BY CLAUSE (Grouping and Aggregation)
-- ==================================================================================

-- Query 25: GROUP BY with COUNT
SELECT course, COUNT(*) AS students_per_course FROM Students GROUP BY course;

-- Query 26: GROUP BY with AVG
SELECT course, AVG(gpa) AS average_gpa_per_course FROM Students GROUP BY course;

-- Query 27: GROUP BY with multiple columns
SELECT course, status, COUNT(*) AS count FROM Students GROUP BY course, status;

-- Query 28: GROUP BY with SUM
SELECT bookId, SUM(fine) AS total_fines_per_book FROM BorrowTransactions GROUP BY bookId;

-- Query 29: GROUP BY with ORDER BY
SELECT course, COUNT(*) AS student_count FROM Students GROUP BY course ORDER BY student_count DESC;

-- ==================================================================================
-- DQL-6: HAVING CLAUSE (Group Filtering)
-- ==================================================================================

-- Query 30: GROUP BY with HAVING
SELECT course, COUNT(*) AS student_count FROM Students GROUP BY course HAVING COUNT(*) > 10;

-- Query 31: HAVING with AVG
SELECT course, AVG(gpa) AS avg_gpa FROM Students GROUP BY course HAVING AVG(gpa) > 8.0;

-- Query 32: Complex GROUP BY + HAVING
SELECT course, COUNT(*) AS total, AVG(gpa) AS avg_gpa 
FROM Students 
GROUP BY course 
HAVING COUNT(*) > 5 AND AVG(gpa) > 7.5
ORDER BY avg_gpa DESC;

-- ==================================================================================
-- DQL-7: DISTINCT (Removing Duplicates)
-- ==================================================================================

-- Query 33: DISTINCT values
SELECT DISTINCT course FROM Students;
SELECT DISTINCT department FROM Books;
SELECT DISTINCT city FROM Students WHERE city IS NOT NULL;

-- Query 34: COUNT DISTINCT
SELECT COUNT(DISTINCT course) FROM Students;
SELECT COUNT(DISTINCT genre) FROM Books;

-- ==================================================================================
-- DQL-8: JOIN OPERATIONS
-- ==================================================================================

-- Query 35: INNER JOIN (matching records)
SELECT s.name, s.email, b.title, bt.issuedAt, bt.dueDate
FROM BorrowTransactions bt
INNER JOIN Students s ON bt.studentId = s.id
INNER JOIN Books b ON bt.bookId = b.id;

-- Query 36: INNER JOIN with WHERE
SELECT s.name, b.title, bt.status, bt.dueDate
FROM BorrowTransactions bt
INNER JOIN Students s ON bt.studentId = s.id
INNER JOIN Books b ON bt.bookId = b.id
WHERE bt.status = 'OVERDUE';

-- Query 37: LEFT JOIN (all students + their borrowing history)
SELECT s.name, s.email, b.title, bt.issuedAt
FROM Students s
LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId
LEFT JOIN Books b ON bt.bookId = b.id
WHERE s.status = 'Active';

-- Query 38: Counting active borrows per student
SELECT s.id, s.name, COUNT(bt.id) AS active_borrows
FROM Students s
LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId AND bt.status = 'BORROWED'
GROUP BY s.id, s.name
ORDER BY active_borrows DESC;

-- Query 39: Multi-table JOIN (Students + Books + Fine Ledger)
SELECT s.name, b.title, lf.fineAmount, lf.daysOverdue, lf.status
FROM Students s
INNER JOIN LibraryFineLedgers lf ON s.id = lf.studentId
INNER JOIN Books b ON lf.bookId = b.id
ORDER BY lf.fineAmount DESC;

-- ==================================================================================
-- DQL-9: SUBQUERIES
-- ==================================================================================

-- Query 40: Subquery in WHERE clause
SELECT name, email, gpa FROM Students WHERE gpa > (SELECT AVG(gpa) FROM Students);

-- Query 41: Subquery with IN operator
SELECT name, course FROM Students WHERE course IN (SELECT course FROM Students GROUP BY course HAVING COUNT(*) > 5);

-- Query 42: Subquery with EXISTS
SELECT name FROM Students s WHERE EXISTS (SELECT 1 FROM BorrowTransactions bt WHERE bt.studentId = s.id AND bt.status = 'BORROWED');

-- Query 43: Correlated subquery
SELECT s.name, (SELECT COUNT(*) FROM BorrowTransactions WHERE studentId = s.id) AS total_borrows FROM Students s;

-- ==================================================================================
-- DQL-10: UNION and SET OPERATIONS
-- ==================================================================================

-- Query 44: UNION (combine results without duplicates)
SELECT name, email, course FROM Students WHERE status = 'Active'
UNION
SELECT name, email, course FROM Students WHERE gpa > 8.5;

-- Query 45: UNION ALL (combine results with duplicates)
SELECT name, course FROM Students WHERE course = 'CSE'
UNION ALL
SELECT name, course FROM Students WHERE gpa > 9.0;

-- ==================================================================================
-- DQL-11: COMPLEX REAL-WORLD QUERIES
-- ==================================================================================

-- Query 46: Most borrowed books (real dashboard query)
SELECT b.title, b.author, COUNT(bt.id) AS times_borrowed, SUM(bt.fine) AS total_fines
FROM Books b
LEFT JOIN BorrowTransactions bt ON b.id = bt.bookId
GROUP BY b.id, b.title, b.author
ORDER BY times_borrowed DESC
LIMIT 10;

-- Query 47: Students with overdue books and fines
SELECT s.name, s.email, b.title, bt.dueDate, bt.fine, DATEDIFF(NOW(), bt.dueDate) AS days_overdue
FROM Students s
INNER JOIN BorrowTransactions bt ON s.id = bt.studentId
INNER JOIN Books b ON bt.bookId = b.id
WHERE bt.status = 'OVERDUE'
ORDER BY days_overdue DESC;

-- Query 48: Book availability report
SELECT title, author, totalCopies, availableCopies, checkedOutCount, 
       ROUND(100 * availableCopies / totalCopies, 2) AS availability_percentage
FROM Books
ORDER BY availableCopies ASC;

-- Query 49: Department-wise book inventory
SELECT b.department, COUNT(DISTINCT b.id) AS unique_books, SUM(b.totalCopies) AS total_copies, SUM(b.availableCopies) AS available_copies
FROM Books b
GROUP BY b.department
ORDER BY total_copies DESC;

-- Query 50: Student borrowing summary
SELECT s.id, s.name, s.course, 
       COUNT(CASE WHEN bt.status = 'BORROWED' THEN 1 END) AS currently_borrowed,
       COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) AS overdue_books,
       COUNT(CASE WHEN bt.status = 'RETURNED' THEN 1 END) AS returned_books,
       SUM(bt.fine) AS total_fines
FROM Students s
LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId
GROUP BY s.id, s.name, s.course
ORDER BY total_fines DESC;

-- ==================================================================================
-- DQL EXECUTION VERIFICATION
-- ==================================================================================

-- Run all these queries to verify DQL functionality
-- Expected output: All queries should return results without errors
-- Key verification points:
-- - WHERE filters correctly
-- - ORDER BY sorts properly
-- - GROUP BY aggregates correctly
-- - JOINs match correct relationships
-- - Subqueries return valid subsets
-- - Aggregate functions compute correctly