-- OTP schema compatibility patch for DaanSetu
-- Run this in MySQL Workbench if otp_records inserts fail with:
--   - Column 'phone' cannot be null
--   - Data truncated for column 'purpose'

USE daansetu_db;

ALTER TABLE otp_records
    MODIFY COLUMN phone VARCHAR(32) NULL;

ALTER TABLE otp_records
    MODIFY COLUMN purpose VARCHAR(32) NOT NULL;
