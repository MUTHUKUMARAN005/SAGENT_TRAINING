-- =========================================================
-- PickupService Compatibility Patch for your Workbench script
-- Add this AFTER your Step 15 (or run separately after full setup)
-- DB expected: daansetu_db
-- =========================================================

USE daansetu_db;

-- ---------------------------------------------------------
-- 1) PickupService expects PENDING in pickup_status enum.
--    Your current schema misses it.
-- ---------------------------------------------------------
ALTER TABLE pickup_requests
    MODIFY COLUMN pickup_status
    ENUM('PENDING','APPROVED','ASSIGNED','IN_PROGRESS','COMPLETED','REJECTED','SCHEDULED','CANCELLED')
    DEFAULT 'SCHEDULED';

-- ---------------------------------------------------------
-- 2) Align NGO account login email with NGO entity email.
--    Service logic frequently resolves NGO by authenticated user's email.
--    (Example: dashboardService.getNGOStats(user.getEmail()), NGOController, PickupService)
--
--    We map your existing NGO users to NGO records:
--      user 4: sneha@ngo.com -> ngo_id 4
--      user 5: vikram@ngo.com -> ngo_id 5
-- ---------------------------------------------------------
UPDATE ngos
SET email = 'sneha@ngo.com'
WHERE ngo_id = 4;

UPDATE ngos
SET email = 'vikram@ngo.com'
WHERE ngo_id = 5;

-- ---------------------------------------------------------
-- 3) Ensure volunteers are linked to the same NGOs that are
--    reachable by NGO logins above (for assignVolunteerForNgo)
-- ---------------------------------------------------------
UPDATE volunteers
SET ngo_id = 4
WHERE volunteer_id = 1;

UPDATE volunteers
SET ngo_id = 5
WHERE volunteer_id = 2;

-- ---------------------------------------------------------
-- 4) Ensure at least one pickup starts as PENDING so NGO can
--    test status transitions allowed by PickupService:
--    PENDING, SCHEDULED, COMPLETED
-- ---------------------------------------------------------
UPDATE pickup_requests
SET pickup_status = 'PENDING'
WHERE pickup_id = 3;

-- ---------------------------------------------------------
-- 5) Optional: ensure campaign rollups are in sync with donations
-- ---------------------------------------------------------
UPDATE campaigns c
SET
    c.collected_amount = (
        SELECT COALESCE(SUM(d.amount), 0)
        FROM donations d
        WHERE d.campaign_id = c.campaign_id
          AND d.donation_status = 'COMPLETED'
    ),
    c.donors_count = (
        SELECT COUNT(DISTINCT d.user_id)
        FROM donations d
        WHERE d.campaign_id = c.campaign_id
          AND d.donation_status = 'COMPLETED'
    );

-- ---------------------------------------------------------
-- 6) Verification queries
-- ---------------------------------------------------------
SELECT 'Patch complete' AS status;

SELECT pickup_id, pickup_status, pickup_date, time_slot
FROM pickup_requests
ORDER BY pickup_id;

SELECT v.volunteer_id, u.name AS volunteer_name, n.ngo_name, n.email AS ngo_email
FROM volunteers v
JOIN users u ON u.user_id = v.user_id
LEFT JOIN ngos n ON n.ngo_id = v.ngo_id
ORDER BY v.volunteer_id;

SELECT u.user_id, u.name, u.email, u.role, n.ngo_id, n.ngo_name, n.email AS ngo_email
FROM users u
LEFT JOIN ngos n ON n.email = u.email
WHERE u.role = 'NGO'
ORDER BY u.user_id;

