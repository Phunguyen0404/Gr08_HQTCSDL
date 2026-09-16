-- ==============================================================================
-- HOTEL MANAGEMENT SYSTEM
-- TRANSACTIONS MASTER SCRIPT (TẬP LỆNH GIAO TÁC & TRANH CHẤP ĐỒNG THỜI)
-- DBMS: MySQL (InnoDB)
-- ==============================================================================
-- Bao gom 2 ban kịch bản:
--   1. database/transactions_errors.sql: Demo 4 loi giao tac kinh dien & Deadlock.
--   2. database/transactions_fixed.sql: Ban giai phap hoan chinh khac phuc triet de.
-- ==============================================================================

USE hotel_management;

-- 1. Kiem tra muc co lap giao tac hien tai cua he thong
SELECT @@GLOBAL.transaction_isolation AS Global_Isolation,
       @@SESSION.transaction_isolation AS Session_Isolation;

-- 2. Kiem tra cac tien trinh va khoa dang hoat dong trong InnoDB
SHOW PROCESSLIST;
SELECT * FROM performance_schema.data_locks;
SELECT * FROM performance_schema.data_lock_waits;
