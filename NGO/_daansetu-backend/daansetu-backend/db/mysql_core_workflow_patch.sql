-- =========================================================
-- DaanSetu Core Workflow Patch (NGO Donation Management)
-- Purpose:
-- 1) Fix NGO ownership/linkage for dashboard visibility
-- 2) Keep pickup/volunteer workflow states compatible with backend enums
-- 3) Backfill missing physical pickup rows and monetary receipts
-- 4) Provide verification queries for donor/ngo/admin dashboard views
--
-- Tested assumptions:
-- - DB name: daansetu_db
-- - Collation mixed issues exist; comparisons use utf8mb4_unicode_ci
-- - Backend enums:
--   DonationStatus: PENDING, CONFIRMED, COMPLETED, FAILED, REFUNDED
--   PickupStatus: PENDING, APPROVED, ASSIGNED, IN_PROGRESS, COMPLETED, REJECTED, SCHEDULED, CANCELLED
--   TaskStatus: ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
-- =========================================================

USE daansetu_db;

-- -----------------------------
-- INPUTS
-- -----------------------------
SET @source_ngo_email = 'sneha@ngo.com';
SET @target_ngo_email = 'mv3602391@gmail.com';

SET @old_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;

-- -----------------------------
-- A) Resolve source and target users
-- -----------------------------
SET @source_user_id = (
    SELECT u.user_id
    FROM users u
    WHERE u.email COLLATE utf8mb4_unicode_ci = @source_ngo_email COLLATE utf8mb4_unicode_ci
      AND u.role = 'NGO'
    LIMIT 1
);

SET @target_user_id = (
    SELECT u.user_id
    FROM users u
    WHERE u.email COLLATE utf8mb4_unicode_ci = @target_ngo_email COLLATE utf8mb4_unicode_ci
    LIMIT 1
);

SET @source_user_name = (
    SELECT u.name
    FROM users u
    WHERE u.user_id = @source_user_id
    LIMIT 1
);

SET @target_user_name = (
    SELECT u.name
    FROM users u
    WHERE u.user_id = @target_user_id
    LIMIT 1
);

-- Ensure target user can act as NGO in app paths
UPDATE users
SET role = 'NGO', active = 1
WHERE user_id = @target_user_id;

-- -----------------------------
-- B) Resolve source NGO profile and ensure target NGO profile exists
-- -----------------------------
SET @source_ngo_id = (
    SELECT n.ngo_id
    FROM ngos n
    WHERE n.email COLLATE utf8mb4_unicode_ci = @source_ngo_email COLLATE utf8mb4_unicode_ci
    LIMIT 1
);

INSERT INTO ngos (ngo_name, email, verified)
SELECT
    COALESCE(NULLIF(TRIM(@target_user_name), ''), 'NGO'),
    @target_ngo_email,
    0
FROM dual
WHERE @target_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM ngos n
      WHERE n.email COLLATE utf8mb4_unicode_ci = @target_ngo_email COLLATE utf8mb4_unicode_ci
  );

SET @target_ngo_id = (
    SELECT n.ngo_id
    FROM ngos n
    WHERE n.email COLLATE utf8mb4_unicode_ci = @target_ngo_email COLLATE utf8mb4_unicode_ci
    LIMIT 1
);

-- -----------------------------
-- C) Transfer ownership to target NGO account
-- -----------------------------
-- 1) Campaigns: by source NGO id or source admin id or source NGO name
UPDATE campaigns c
LEFT JOIN ngos n ON n.ngo_id = c.ngo_id
SET
    c.ngo_id = @target_ngo_id,
    c.admin_id = @target_user_id
WHERE @target_ngo_id IS NOT NULL
  AND @target_user_id IS NOT NULL
  AND (
      c.ngo_id = @source_ngo_id
      OR c.admin_id = @source_user_id
      OR LOWER(COALESCE(n.ngo_name, '')) COLLATE utf8mb4_unicode_ci = LOWER(COALESCE(@source_user_name, '')) COLLATE utf8mb4_unicode_ci
  );

-- 2) Volunteers: move any source-linked volunteers under target NGO monitor
UPDATE volunteers v
SET v.ngo_id = @target_ngo_id,
    v.volunteer_status = 'ACTIVE'
WHERE @target_ngo_id IS NOT NULL
  AND (v.ngo_id = @source_ngo_id OR v.ngo_id IS NULL);

-- -----------------------------
-- D) Ensure pickup workflow compatibility and visibility
-- -----------------------------
ALTER TABLE pickup_requests
    MODIFY COLUMN pickup_status
    ENUM('PENDING','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','REJECTED','SCHEDULED','CANCELLED')
    DEFAULT 'SCHEDULED';

-- Create missing pickup rows for physical donations (one-time backfill)
INSERT INTO pickup_requests (
    donation_id,
    donor_address,
    pickup_date,
    time_slot,
    pickup_status,
    contact_phone,
    notes,
    latitude,
    longitude,
    reminder_sent,
    created_at
)
SELECT
    d.donation_id,
    COALESCE(u.address, ''),
    CURDATE(),
    '10:00 AM - 12:00 PM',
    'PENDING',
    u.phone,
    CONCAT('Auto-created pickup for physical donation #', d.donation_id),
    u.latitude,
    u.longitude,
    0,
    NOW()
FROM donations d
JOIN users u ON u.user_id = d.user_id
LEFT JOIN pickup_requests pr ON pr.donation_id = d.donation_id
WHERE d.donation_type <> 'MONEY'
  AND pr.pickup_id IS NULL;

-- -----------------------------
-- E) Backfill receipts for completed successful monetary donations
-- -----------------------------
INSERT INTO donation_receipts (donation_id, receipt_number, issued_date, email_sent)
SELECT
    d.donation_id,
    CONCAT('REC-', DATE_FORMAT(NOW(), '%Y'), '-', LPAD(d.donation_id, 8, '0')),
    NOW(),
    0
FROM donations d
LEFT JOIN payments p ON p.donation_id = d.donation_id
LEFT JOIN donation_receipts r ON r.donation_id = d.donation_id
WHERE d.donation_type = 'MONEY'
  AND d.donation_status IN ('CONFIRMED', 'COMPLETED')
  AND p.payment_status = 'SUCCESS'
  AND r.receipt_id IS NULL;

-- -----------------------------
-- F) Recalculate campaign aggregates from completed donations
-- -----------------------------
UPDATE campaigns c
LEFT JOIN (
    SELECT d.campaign_id,
           COALESCE(SUM(CASE WHEN d.donation_status = 'COMPLETED' THEN d.amount ELSE 0 END), 0) AS total_amount,
           COUNT(DISTINCT CASE WHEN d.donation_status = 'COMPLETED' THEN d.user_id END) AS total_donors
    FROM donations d
    GROUP BY d.campaign_id
) agg ON agg.campaign_id = c.campaign_id
SET
    c.collected_amount = COALESCE(agg.total_amount, 0),
    c.donors_count = COALESCE(agg.total_donors, 0);

COMMIT;

SET SQL_SAFE_UPDATES = @old_safe_updates;

-- -----------------------------
-- VERIFICATION
-- -----------------------------
SELECT 'PATCH_STATUS' AS section, 'DONE' AS status;

SELECT 'TARGET_USER' AS section, u.user_id, u.name, u.email, u.role
FROM users u
WHERE u.email COLLATE utf8mb4_unicode_ci = @target_ngo_email COLLATE utf8mb4_unicode_ci;

SELECT 'TARGET_NGO' AS section, n.ngo_id, n.ngo_name, n.email
FROM ngos n
WHERE n.email COLLATE utf8mb4_unicode_ci = @target_ngo_email COLLATE utf8mb4_unicode_ci;

SELECT 'CAMPAIGNS_OWNED' AS section, c.campaign_id, c.title, c.ngo_id, c.admin_id
FROM campaigns c
WHERE c.ngo_id = @target_ngo_id
ORDER BY c.campaign_id DESC;

SELECT 'DONATIONS_VISIBLE' AS section, COUNT(*) AS donation_count
FROM donations d
JOIN campaigns c ON c.campaign_id = d.campaign_id
WHERE c.ngo_id = @target_ngo_id;

SELECT 'PICKUPS_VISIBLE' AS section, COUNT(*) AS pickup_count
FROM pickup_requests pr
JOIN donations d ON d.donation_id = pr.donation_id
JOIN campaigns c ON c.campaign_id = d.campaign_id
WHERE c.ngo_id = @target_ngo_id;

SELECT 'VOLUNTEERS_MONITORED' AS section, COUNT(*) AS volunteer_count
FROM volunteers v
WHERE v.ngo_id = @target_ngo_id;
