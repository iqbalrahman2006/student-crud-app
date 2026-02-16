-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- COMPLEX SUBQUERIES & VIEWS (Examples using StudentDB)
-- ==================================================================================
USE studentdb;

-- ==================================================================================
-- SUBQUERY EXAMPLE 1: Students with GPA above course average
-- ==================================================================================
SELECT s.id, s.name, s.course, s.gpa
FROM Students s
WHERE s.gpa > (SELECT AVG(gpa) FROM Students WHERE course = s.course);

-- ==================================================================================
-- SUBQUERY EXAMPLE 2: Books never borrowed
-- ==================================================================================
SELECT b.id, b.title
FROM Books b
WHERE NOT EXISTS (SELECT 1 FROM BorrowTransactions bt WHERE bt.bookId = b.id);

-- ==================================================================================
-- SUBQUERY EXAMPLE 3: Students who borrowed a specific author
-- ==================================================================================
SELECT DISTINCT s.id, s.name
FROM Students s
WHERE EXISTS (
  SELECT 1 FROM BorrowTransactions bt
  JOIN Books b ON bt.bookId = b.id
  WHERE bt.studentId = s.id AND b.author = 'Thomas H. Cormen'
);

-- ==================================================================================
-- SUBQUERY EXAMPLE 4: Top 3 students by number of borrows per course
-- ==================================================================================
SELECT * FROM (
  SELECT s.id, s.name, s.course, COUNT(bt.id) AS borrow_count,
         ROW_NUMBER() OVER (PARTITION BY s.course ORDER BY COUNT(bt.id) DESC) AS rn
  FROM Students s
  LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId
  GROUP BY s.id, s.name, s.course
) t WHERE rn <= 3;

-- ==================================================================================
-- VIEW EXAMPLE: Student Borrow Summary (already added in ER module but repeated here)
-- ==================================================================================
CREATE OR REPLACE VIEW vw_student_borrow_summary AS
SELECT s.id, s.name, s.course,
       COUNT(bt.id) AS total_borrows,
       COUNT(CASE WHEN bt.status = 'OVERDUE' THEN 1 END) AS overdue_count,
       SUM(bt.fine) AS total_fines
FROM Students s
LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId
GROUP BY s.id, s.name, s.course;

-- ==================================================================================
-- MATERIALIZED VIEW PATTERN (MySQL workaround using table)
-- ==================================================================================
-- MySQL does not provide native materialized views. Use a table + refresh job:
-- CREATE TABLE mv_popular_books AS (SELECT b.id, b.title, COUNT(bt.id) as times_borrowed FROM Books b LEFT JOIN BorrowTransactions bt ON b.id = bt.bookId GROUP BY b.id);
-- REFRESH: TRUNCATE mv_popular_books; INSERT INTO mv_popular_books SELECT ...;

-- ==================================================================================
-- RUN VERIFICATION
-- ==================================================================================
-- Execute these queries to validate subqueries and views
SELECT COUNT(*) FROM vw_student_borrow_summary;
SELECT * FROM vw_student_borrow_summary LIMIT 10;
