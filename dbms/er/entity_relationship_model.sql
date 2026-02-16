-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 8: ER (ENTITY-RELATIONSHIP) DIAGRAM & RELATIONAL SCHEMA
-- ==================================================================================

-- ==================================================================================
-- ER MODEL: STUDENT LIBRARY MANAGEMENT SYSTEM
-- ==================================================================================

-- Entity Definitions:
-- 1. STUDENTS: Student enrollment and details
-- 2. BOOKS: Library book inventory
-- 3. USERS: Authentication and admin accounts
-- 4. BORROW_TRANSACTIONS: Book borrowing/returning events
-- 5. BOOK_RESERVATIONS: Queued reservations when books unavailable
-- 6. LIBRARY_AUDIT_LOGS: Immutable transaction audit trail
-- 7. LIBRARY_FINE_LEDGERS: Fine tracking for overdue books
-- 8. TRANSACTIONS: Legacy transaction table (mirrors BORROW_TRANSACTIONS)

-- ==================================================================================
-- ASCII ER DIAGRAM (Chen Notation)
-- ==================================================================================

/*

                    ┌─────────────────┐
                    │    STUDENTS     │
                    ├─────────────────┤
                    │ PK: id          │
                    │ - name          │
                    │ - email         │
                    │ - course        │
                    │ - gpa           │
                    │ - status        │
                    │ - enrollDate    │
                    └────────┬────────┘
                             │
                             │ 1:N (issue/return)
                             │
                    ┌────────▼─────────────────────┐
                    │ BORROW_TRANSACTIONS          │
                    ├──────────────────────────────┤
                    │ PK: id                       │
                    │ FK: studentId → Students     │
                    │ FK: bookId → Books           │
                    │ - issuedAt                   │
                    │ - dueDate                    │
                    │ - returnedAt                 │
                    │ - status (BORROWED/RETURNED) │
                    │ - renewalCount               │
                    │ - fine                       │
                    └────────┬───────────────┬─────┘
                             │               │
                    1:N ┌────▼────┐        1:N
                        │ BOOKS   │
                        ├─────────┤
                        │ PK: id  │
                        │ - title │
                        │ - author│
                        │ - isbn  │
                        │ - genre │
                        │ - total │
                        │ - avail │
                        └────┬────┘
                             │
                             │ 1:N (records)
                             │
        ┌────────────────────▼───────────────────┐
        │   LIBRARY_FINE_LEDGERS                 │
        ├────────────────────────────────────────┤
        │ PK: id                                 │
        │ FK: studentId → Students               │
        │ FK: bookId → Books                     │
        │ - fineAmount                           │
        │ - daysOverdue                          │
        │ - status (PENDING/PAID/WAIVED)         │
        └────────────────────────────────────────┘


        ┌──────────────────┐
        │ BOOK_RESERVATIONS│
        ├──────────────────┤
        │ PK: id           │
        │ FK: bookId       │
        │ FK: studentId    │
        │ - queuePosition  │
        │ - status         │
        │ - expiryDate     │
        └──────────────────┘


        ┌────────────────────┐
        │ LIBRARY_AUDIT_LOGS │
        ├────────────────────┤
        │ PK: id             │
        │ FK: bookId (null)  │
        │ FK: studentId(null)│
        │ FK: adminId (null) │
        │ - action           │
        │ - timestamp        │
        │ [IMMUTABLE]        │
        └────────────────────┘


        ┌──────────────────┐
        │     USERS        │
        ├──────────────────┤
        │ PK: id           │
        │ - name           │
        │ - email          │
        │ - role (ADMIN)   │
        │       (LIBRARIAN)│
        │       (STUDENT)  │
        └──────────────────┘

*/

-- ==================================================================================
-- CARDINALITY & RELATIONSHIPS
-- ==================================================================================

/*
RELATIONSHIP SUMMARY:

1. Students (1:N) Borrow_Transactions
   - One student can borrow many books
   - Many borrowing records for one student
   - FK: studentId in BORROW_TRANSACTIONS references Students.id
   - Action: DELETE RESTRICT (cannot delete student with active borrows)
            UPDATE CASCADE (if student id changes, update transactions)

2. Books (1:N) Borrow_Transactions
   - One book can be borrowed many times
   - Many borrowing records per book
   - FK: bookId in BORROW_TRANSACTIONS references Books.id
   - Action: DELETE RESTRICT, UPDATE CASCADE

3. Students (1:N) Book_Reservations
   - One student can reserve many books
   - FK: student in BOOK_RESERVATIONS references Students.id
   - Action: DELETE RESTRICT, UPDATE CASCADE

4. Books (1:N) Book_Reservations
   - One book can have many reservations (queue)
   - FK: book in BOOK_RESERVATIONS references Books.id
   - Action: DELETE RESTRICT, UPDATE CASCADE

5. Borrow_Transactions (1:N) Library_Fine_Ledgers
   - One transaction can generate one fine entry
   - FK: transactionId in LIBRARY_FINE_LEDGERS references BORROW_TRANSACTIONS.id
   - Action: DELETE CASCADE (delete fine if transaction deleted)

6. Students (1:N) Library_Fine_Ledgers
   - One student can have many fines
   - FK: studentId in LIBRARY_FINE_LEDGERS references Students.id
   - Action: DELETE RESTRICT

7. Books (1:N) Library_Fine_Ledgers
   - One book can be involved in many fines
   - FK: bookId in LIBRARY_FINE_LEDGERS references Books.id
   - Action: DELETE RESTRICT

8. Library_Audit_Logs (N:1) Students
   - Many audit records for one student
   - FK: studentId in LIBRARY_AUDIT_LOGS (nullable, can be NULL)
   - Action: DELETE SET NULL

9. Library_Audit_Logs (N:1) Books
   - Many audit records for one book
   - FK: bookId in LIBRARY_AUDIT_LOGS (nullable)
   - Action: DELETE SET NULL

10. Library_Audit_Logs (N:1) Users
    - Many audit records created by admins
    - FK: adminId in LIBRARY_AUDIT_LOGS (nullable)
    - Action: DELETE SET NULL
*/

-- ==================================================================================
-- RELATIONAL SCHEMA (Simplified Notation)
-- ==================================================================================

/*
STUDENTS(
  id: Varchar[255] PK,
  name: Varchar[255],
  email: Varchar[255] UNIQUE,
  phone: Varchar[20],
  course: Varchar[100],
  status: ENUM{Active|Inactive},
  enrollmentDate: DateTime,
  gpa: Decimal(3,2),
  city: Varchar[100],
  country: Varchar[100],
  zipCode: Varchar[10],
  address: Text,
  guardianName: Varchar[255],
  emergencyContact: Varchar[20],
  studentCategory: Varchar[50],
  scholarshipStatus: Varchar[50],
  bloodGroup: Varchar[10],
  hostelRequired: Boolean,
  transportMode: Varchar[50],
  createdAt: Timestamp,
  updatedAt: Timestamp
)

BOOKS(
  id: Varchar[255] PK,
  title: Varchar[255],
  author: Varchar[255],
  isbn: Varchar[20] UNIQUE,
  genre: Varchar[100],
  department: Varchar[100],
  totalCopies: Integer,
  availableCopies: Integer,
  checkedOutCount: Integer,
  lastAvailabilityUpdatedAt: DateTime,
  overdueFlag: Boolean,
  status: ENUM{Available|Unavailable|Archived},
  shelfLocation: Varchar[50],
  addedDate: DateTime,
  autoTags: JSON,
  createdAt: Timestamp,
  updatedAt: Timestamp
)

BORROW_TRANSACTIONS(
  id: Varchar[255] PK,
  studentId: Varchar[255] FK->STUDENTS,
  bookId: Varchar[255] FK->BOOKS,
  issuedAt: DateTime,
  dueDate: DateTime,
  returnedAt: DateTime,
  status: ENUM{BORROWED|RETURNED|OVERDUE|ARCHIVED},
  renewalCount: Integer,
  renewalLimit: Integer,
  fine: Decimal[10,2],
  bookTitle: Varchar[255],
  createdAt: Timestamp,
  updatedAt: Timestamp
)

BOOK_RESERVATIONS(
  id: Varchar[255] PK,
  book: Varchar[255] FK->BOOKS,
  student: Varchar[255] FK->STUDENTS,
  status: ENUM{ACTIVE|FULFILLED|EXPIRED|CANCELLED},
  queuePosition: Integer,
  expiryDate: DateTime,
  fulfilledAt: DateTime,
  createdAt: Timestamp,
  updatedAt: Timestamp
)

LIBRARY_AUDIT_LOGS(
  id: Varchar[255] PK,
  action: ENUM{BORROW|RETURN|RENEW|ADD|UPDATE|DELETE|OVERDUE|RESERVE|EMAIL_SENT|FINE_LEVIED},
  bookId: Varchar[255] FK->BOOKS (nullable),
  studentId: Varchar[255] FK->STUDENTS (nullable),
  adminId: Varchar[255] FK->USERS (nullable),
  timestamp: DateTime,
  metadata: JSON,
  createdAt: Timestamp
) IMMUTABLE

LIBRARY_FINE_LEDGERS(
  id: Varchar[255] PK,
  studentId: Varchar[255] FK->STUDENTS,
  bookId: Varchar[255] FK->BOOKS,
  fineAmount: Decimal[10,2],
  daysOverdue: Integer,
  transactionId: Varchar[255],
  status: ENUM{PENDING|PAID|WAIVED|APPEALED},
  paidDate: DateTime,
  paidBy: Varchar[255],
  createdAt: Timestamp,
  updatedAt: Timestamp
)

TRANSACTIONS(
  id: Varchar[255] PK,
  student: Varchar[255] FK->STUDENTS,
  book: Varchar[255] FK->BOOKS,
  studentName: Varchar[255],
  bookTitle: Varchar[255],
  issueDate: DateTime,
  dueDate: DateTime,
  returnDate: DateTime,
  status: ENUM{Issued|Returned|Overdue|Renewed},
  renewalCount: Integer,
  fine: Decimal[10,2],
  createdAt: Timestamp,
  updatedAt: Timestamp
)

USERS(
  id: Varchar[255] PK,
  name: Varchar[255],
  email: Varchar[255] UNIQUE,
  role: ENUM{ADMIN|LIBRARIAN|STUDENT},
  createdAt: Timestamp,
  updatedAt: Timestamp
)
*/

-- ==================================================================================
-- REFERENTIAL INTEGRITY CONSTRAINTS
-- ==================================================================================

/*
All foreign key relationships are defined with:

1. ON DELETE RESTRICT: Cannot delete parent record if child records exist
   Applied to: Students, Books (for referential integrity)

2. ON UPDATE CASCADE: If parent ID changes, update all child references
   Applied to: All FK relationships (maintains consistency)

3. ON DELETE SET NULL: If parent deleted, set FK to NULL
   Applied to: LIBRARY_AUDIT_LOGS (for optional audit data)

4. ON DELETE CASCADE: If parent deleted, delete all child records
   Applied to: LIBRARY_FINE_LEDGERS when transactionId deleted

CONSTRAINTS ENSURE:
- Data consistency (no orphaned records)
- Referential integrity (FK always points to valid record)
- Cascade operations (atomic parent-child updates)
*/

-- ==================================================================================
-- NORMALIZATION ANALYSIS (See normalization/ folder for details)
-- ==================================================================================

/*
Current schema is in 3NF (Third Normal Form):

1NF (First Normal Form):
- All attributes are atomic
- No repeating groups
- Each cell contains single value

2NF (Second Normal Form):
- In 1NF
- All non-key attributes depend on entire primary key
- No partial dependencies

3NF (Third Normal Form):
- In 2NF
- No transitive dependencies
- Non-key attributes depend only on primary key

DENORMALIZATION:
- bookTitle stored in BORROW_TRANSACTIONS (snapshot of title at borrow time)
- Purpose: Historical accuracy (if book title updated, transaction shows original)
- Acceptable denormalization for reporting/audit requirements

INDEXING STRATEGY:
See optimizations/ folder for performance analysis
*/

-- ==================================================================================
-- DRAW.IO XML REPRESENTATION
-- ==================================================================================

/*
Save as: dbms/er/studentdb_er_model.drawio

<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2024-01-20">
  <diagram id="ER-StudentDB" name="Student Library Database ER Model">
    <mxGraphModel dx="1200" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <object label="STUDENTS" id="obj_students">
          <mxCell style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
            <mxGeometry x="50" y="50" width="150" height="200" as="geometry" />
          </mxCell>
        </object>
        <mxCell id="rel_1" value="1:N" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="obj_students" target="obj_borrow">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

[Full draw.io XML to be generated with proper diagram tool]
*/

-- ==================================================================================
-- VIEWS (Derived Entities for common queries)
-- ==================================================================================

-- View: Active Borrow Summary
CREATE OR REPLACE VIEW vw_active_borrows AS
SELECT 
  s.id as student_id,
  s.name as student_name,
  b.id as book_id,
  b.title as book_title,
  bt.issuedAt,
  bt.dueDate,
  DATEDIFF(bt.dueDate, NOW()) as days_remaining
FROM Students s
INNER JOIN BorrowTransactions bt ON s.id = bt.studentId
INNER JOIN Books b ON bt.bookId = b.id
WHERE bt.status = 'BORROWED';

-- View: Overdue Books with Fine Calculation
CREATE OR REPLACE VIEW vw_overdue_calculation AS
SELECT
  s.id,
  s.name,
  b.title,
  bt.dueDate,
  DATEDIFF(NOW(), bt.dueDate) as days_overdue,
  DATEDIFF(NOW(), bt.dueDate) * 10 as calculated_fine
FROM BorrowTransactions bt
INNER JOIN Students s ON bt.studentId = s.id
INNER JOIN Books b ON bt.bookId = b.id
WHERE bt.status = 'OVERDUE';

-- View: Availability Summary
CREATE OR REPLACE VIEW vw_book_availability AS
SELECT
  id,
  title,
  author,
  totalCopies,
  availableCopies,
  checkedOutCount,
  ROUND(100 * availableCopies / totalCopies, 2) as availability_percentage,
  CASE 
    WHEN availableCopies = 0 THEN 'OUT_OF_STOCK'
    WHEN availableCopies < 2 THEN 'LIMITED'
    ELSE 'AVAILABLE'
  END as stock_status
FROM Books;

-- ==================================================================================
-- ER DIAGRAM VERIFICATION
-- ==================================================================================

-- Verify all relationships
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'studentdb' AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Verify tables structure
SELECT TABLE_NAME, COUNT(*) as column_count
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'studentdb'
GROUP BY TABLE_NAME
ORDER BY TABLE_NAME;
