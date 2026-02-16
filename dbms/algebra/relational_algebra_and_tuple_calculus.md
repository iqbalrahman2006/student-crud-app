-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- RELATIONAL ALGEBRA & TUPLE CALCULUS MAPPING (StudentDB)
-- ==================================================================================

-- Relational Algebra notation (operators):
-- σ: Selection (WHERE)
-- π: Projection (SELECT columns)
-- ×: Cartesian Product
-- ⋈: Natural Join / Theta Join
-- ∪: Union
-- −: Set Difference
-- ρ: Rename
-- γ: Grouping / Aggregation

-- ==================================================================================
-- EXAMPLE 1: Students with GPA > 8.0
-- RA: σ_{gpa > 8.0}(Students)
-- SQL: SELECT * FROM Students WHERE gpa > 8.0;

-- ==================================================================================
-- EXAMPLE 2: Titles of books borrowed by 'Raj Kumar'
-- Steps:
-- 1) Find student id for 'Raj Kumar': π_{id}(σ_{name='Raj Kumar'}(Students))
-- 2) Find borrow transactions for that student: σ_{studentId = <id>}(BorrowTransactions)
-- 3) Join with Books to get title: BorrowTransactions ⋈_{bookId=Books.id} Books
-- RA Combined: π_{title}(σ_{name='Raj Kumar'}(Students) ⋈ BorrowTransactions ⋈ Books)
-- SQL Equivalent:
-- SELECT b.title FROM Students s
-- JOIN BorrowTransactions bt ON s.id = bt.studentId
-- JOIN Books b ON bt.bookId = b.id
-- WHERE s.name = 'Raj Kumar';

-- ==================================================================================
-- EXAMPLE 3: Most borrowed books (Top 5)
-- RA:
-- γ_{bookId; COUNT(bt.id) -> times_borrowed}(BorrowTransactions) 🌐 then sort and take top 5
-- SQL Equivalent:
-- SELECT b.title, COUNT(bt.id) AS times_borrowed FROM Books b
-- LEFT JOIN BorrowTransactions bt ON b.id = bt.bookId
-- GROUP BY b.id, b.title ORDER BY times_borrowed DESC LIMIT 5;

-- ==================================================================================
-- EXAMPLE 4: Students who have not borrowed any book
-- RA: π_{id, name}(Students) − π_{studentId, name}(Students ⋈ BorrowTransactions)
-- SQL Equivalent:
-- SELECT s.id, s.name FROM Students s
-- LEFT JOIN BorrowTransactions bt ON s.id = bt.studentId
-- WHERE bt.id IS NULL;

-- ==================================================================================
-- TUPLE RELATIONAL CALCULUS (TRC)
-- TRC example: { s.name | Student(s) AND s.gpa > 8.0 }
-- SQL Equivalent: SELECT name FROM Students WHERE gpa > 8.0;

-- Complex TRC:
-- { b.title | Book(b) AND ∃t(BorrowTransactions(t) AND t.bookId = b.id AND t.status = 'OVERDUE') }
-- SQL Equivalent:
-- SELECT DISTINCT b.title FROM Books b
-- WHERE EXISTS (SELECT 1 FROM BorrowTransactions bt WHERE bt.bookId = b.id AND bt.status = 'OVERDUE');

-- ==================================================================================
-- PRACTICAL MAPPINGS (Common patterns)
-- ==================================================================================
-- Selection: σ_{cond}(R)  -> WHERE
-- Projection: π_{attrs}(R)  -> SELECT attr1, attr2
-- Join: R ⋈ S -> FROM R JOIN S ON R.x = S.y
-- Group/Aggregation: γ_{group; agg} -> GROUP BY
-- Division: Useful for "students who borrowed all books in a set"

-- Division example (Students who borrowed every book in a small required list):
-- RA: Students ÷ RequiredBooks
-- SQL Pattern (relational division):
-- SELECT s.id, s.name FROM Students s
-- WHERE NOT EXISTS (
--   SELECT rb.bookId FROM RequiredBooks rb
--   WHERE NOT EXISTS (
--     SELECT 1 FROM BorrowTransactions bt WHERE bt.studentId = s.id AND bt.bookId = rb.bookId
--   )
-- );

-- ==================================================================================
-- MAPPING CHECKLIST (for workbook answers)
-- ==================================================================================
-- For each SQL query in the DQL folder, provide its equivalent in:
-- - Relational Algebra (stepwise operators)
-- - Tuple Relational Calculus (predicate logic form)
-- - Explain any use of aggregation or windowing

-- Example mapping for "Students with overdue books":
-- SQL:
-- SELECT DISTINCT s.id, s.name FROM Students s
-- JOIN BorrowTransactions bt ON s.id = bt.studentId
-- WHERE bt.status = 'OVERDUE';

-- RA:
-- π_{s.id, s.name}((Students ⋈_{s.id=bt.studentId} σ_{status='OVERDUE'}(BorrowTransactions)))

-- TRC:
-- { <s.id, s.name> | Student(s) AND ∃t (BorrowTransactions(t) AND t.studentId = s.id AND t.status = 'OVERDUE') }

-- ==================================================================================
-- END OF RELATIONAL ALGEBRA & TRC NOTES
