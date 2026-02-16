-- ==================================================================================
-- 21CSC205P – DBMS LAB WORKBOOK
-- EXPERIMENT 11: PROCEDURES, FUNCTIONS, CURSORS, TRIGGERS, EXCEPTION HANDLING
-- MySQL-compatible routines and examples (executable on MySQL 8+)
-- ==================================================================================

USE studentdb;

-- ==================================================================================
-- PROCEDURE: IssueBook(student_id, book_id)
-- Atomic procedure to issue a book (wrapped in transaction)
-- ==================================================================================
DELIMITER //
CREATE PROCEDURE IssueBook(IN p_studentId VARCHAR(255), IN p_bookId VARCHAR(255), OUT p_result VARCHAR(255))
BEGIN
  DECLARE v_available INT DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_result = 'ERROR: Transaction rolled back';
  END;

  START TRANSACTION;

  SELECT availableCopies INTO v_available FROM Books WHERE id = p_bookId FOR UPDATE;

  IF v_available IS NULL THEN
    ROLLBACK;
    SET p_result = 'ERROR: Book not found';
    LEAVE IssueBook;
  END IF;

  IF v_available <= 0 THEN
    ROLLBACK;
    SET p_result = 'ERROR: No copies available';
    LEAVE IssueBook;
  END IF;

  -- Insert borrow transaction
  INSERT INTO BorrowTransactions (id, studentId, bookId, issuedAt, dueDate, status, renewalCount, renewalLimit, bookTitle)
  VALUES (UUID(), p_studentId, p_bookId, NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), 'BORROWED', 0, 3, (SELECT title FROM Books WHERE id = p_bookId));

  -- Update book availability
  UPDATE Books SET availableCopies = availableCopies - 1, checkedOutCount = checkedOutCount + 1 WHERE id = p_bookId;

  -- Log audit
  INSERT INTO LibraryAuditLogs (id, action, bookId, studentId, timestamp)
  VALUES (UUID(), 'BORROW', p_bookId, p_studentId, NOW());

  COMMIT;
  SET p_result = 'OK: Book issued';
END//
DELIMITER ;

-- Usage example:
-- CALL IssueBook('507f1f77bcf86cd799439011','507f1f77bcf86cd799439030', @out); SELECT @out;


-- ==================================================================================
-- FUNCTION: CalculateFine(days_overdue) RETURNS DECIMAL
-- Simple business function for fine calculation
-- ==================================================================================
DELIMITER //
CREATE FUNCTION CalculateFine(p_days INT) RETURNS DECIMAL(10,2) DETERMINISTIC
BEGIN
  DECLARE v_rate DECIMAL(10,2) DEFAULT 10.00; -- Rs 10 per day
  RETURN p_days * v_rate;
END//
DELIMITER ;

-- Usage:
-- SELECT CalculateFine(5);


-- ==================================================================================
-- CURSOR EXAMPLE: Process overdue transactions to create fines
-- ==================================================================================
DELIMITER //
CREATE PROCEDURE ProcessOverdues()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id VARCHAR(255);
  DECLARE v_due DATETIME;
  DECLARE v_days INT;
  DECLARE v_fine DECIMAL(10,2);
  DECLARE cur1 CURSOR FOR SELECT id, dueDate FROM BorrowTransactions WHERE status = 'OVERDUE';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur1;
  read_loop: LOOP
    FETCH cur1 INTO v_id, v_due;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET v_days = GREATEST(0, DATEDIFF(NOW(), v_due));
    SET v_fine = CalculateFine(v_days);
    -- Insert or update fine ledger
    INSERT INTO LibraryFineLedgers (id, studentId, bookId, fineAmount, daysOverdue, transactionId, status)
    SELECT UUID(), studentId, bookId, v_fine, v_days, id, 'PENDING' FROM BorrowTransactions WHERE id = v_id;
  END LOOP;
  CLOSE cur1;
END//
DELIMITER ;

-- Usage:
-- CALL ProcessOverdues();


-- ==================================================================================
-- TRIGGER EXAMPLE: On Borrow Insert - enforce business rules
-- ==================================================================================
DELIMITER //
CREATE TRIGGER before_borrow_insert
BEFORE INSERT ON BorrowTransactions
FOR EACH ROW
BEGIN
  DECLARE v_available INT;
  SELECT availableCopies INTO v_available FROM Books WHERE id = NEW.bookId;
  IF v_available IS NULL OR v_available <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not available for borrow';
  END IF;
END//
DELIMITER ;

-- ==================================================================================
-- EXCEPTION HANDLING (SIGNAL) EXAMPLES
-- ==================================================================================

-- SIGNAL used above to abort with custom message

-- ==================================================================================
-- CLEANUP (Drop routines - use carefully in dev only)
-- ==================================================================================
-- DROP PROCEDURE IF EXISTS IssueBook;
-- DROP FUNCTION IF EXISTS CalculateFine;
-- DROP PROCEDURE IF EXISTS ProcessOverdues;
-- DROP TRIGGER IF EXISTS before_borrow_insert;

-- ==================================================================================
-- END OF PROCEDURES & FUNCTIONS
-- ==================================================================================
