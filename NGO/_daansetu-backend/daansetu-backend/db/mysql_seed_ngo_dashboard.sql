-- Seed data for NGO dashboard real-data testing
-- Safe to run multiple times (uses NOT EXISTS checks)
-- Target DB: daansetu_db (adjust USE statement if needed)

USE daansetu_db;

-- ---------------------------------------------------------------------------
-- 1) Users
-- Password hash below is BCrypt for plain text: password
-- ---------------------------------------------------------------------------
INSERT INTO users (
    name, email, phone, password, address, city, latitude, longitude, role,
    profile_image, pan_number,
    active, email_verified, phone_verified,
    email_updates_enabled, sms_notifications_enabled, campaign_alerts_enabled,
    weekly_digest_enabled, pickup_reminders_enabled,
    created_at, updated_at
)
SELECT
    'Hope Foundation NGO', 'ngo.hope@daansetu.org', '9000000001',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5l9r0hXmxjSPdZRhqUWLWyd4InENcyu',
    '21 Charity Street, Hyderabad', 'Hyderabad', 17.3850, 78.4867, 'NGO',
    NULL, NULL,
    1, 1, 1,
    1, 1, 1,
    0, 1,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ngo.hope@daansetu.org');

INSERT INTO users (
    name, email, phone, password, address, city, latitude, longitude, role,
    profile_image, pan_number,
    active, email_verified, phone_verified,
    email_updates_enabled, sms_notifications_enabled, campaign_alerts_enabled,
    weekly_digest_enabled, pickup_reminders_enabled,
    created_at, updated_at
)
SELECT
    'Sneha Donor', 'donor.sneha@daansetu.org', '9000000011',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5l9r0hXmxjSPdZRhqUWLWyd4InENcyu',
    'Banjara Hills', 'Hyderabad', 17.4100, 78.4500, 'DONOR',
    NULL, NULL,
    1, 1, 1,
    1, 1, 1,
    0, 1,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'donor.sneha@daansetu.org');

INSERT INTO users (
    name, email, phone, password, address, city, latitude, longitude, role,
    profile_image, pan_number,
    active, email_verified, phone_verified,
    email_updates_enabled, sms_notifications_enabled, campaign_alerts_enabled,
    weekly_digest_enabled, pickup_reminders_enabled,
    created_at, updated_at
)
SELECT
    'Ravi Donor', 'donor.ravi@daansetu.org', '9000000012',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5l9r0hXmxjSPdZRhqUWLWyd4InENcyu',
    'Madhapur', 'Hyderabad', 17.4483, 78.3915, 'DONOR',
    NULL, NULL,
    1, 1, 1,
    1, 1, 1,
    0, 1,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'donor.ravi@daansetu.org');

INSERT INTO users (
    name, email, phone, password, address, city, latitude, longitude, role,
    profile_image, pan_number,
    active, email_verified, phone_verified,
    email_updates_enabled, sms_notifications_enabled, campaign_alerts_enabled,
    weekly_digest_enabled, pickup_reminders_enabled,
    created_at, updated_at
)
SELECT
    'Meena Volunteer', 'volunteer.meena@daansetu.org', '9000000021',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5l9r0hXmxjSPdZRhqUWLWyd4InENcyu',
    'Kondapur', 'Hyderabad', 17.4660, 78.3600, 'VOLUNTEER',
    NULL, NULL,
    1, 1, 1,
    1, 1, 1,
    0, 1,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'volunteer.meena@daansetu.org');

INSERT INTO users (
    name, email, phone, password, address, city, latitude, longitude, role,
    profile_image, pan_number,
    active, email_verified, phone_verified,
    email_updates_enabled, sms_notifications_enabled, campaign_alerts_enabled,
    weekly_digest_enabled, pickup_reminders_enabled,
    created_at, updated_at
)
SELECT
    'Arjun Volunteer', 'volunteer.arjun@daansetu.org', '9000000022',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoO5l9r0hXmxjSPdZRhqUWLWyd4InENcyu',
    'Gachibowli', 'Hyderabad', 17.4435, 78.3772, 'VOLUNTEER',
    NULL, NULL,
    1, 1, 1,
    1, 1, 1,
    0, 1,
    NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'volunteer.arjun@daansetu.org');

-- ---------------------------------------------------------------------------
-- 2) NGO
-- IMPORTANT: NGO email should match NGO user email for current service logic
-- ---------------------------------------------------------------------------
INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Hope Foundation',
    '21 Charity Street, Hyderabad',
    'Hyderabad',
    'Telangana',
    '9000000001',
    'ngo.hope@daansetu.org',
    'Community relief and education support NGO.',
    'REG-HOPE-001',
    'AAATH1234A',
    '80G-HOPE-001',
    NULL,
    'https://hope.example.org',
    17.3850,
    78.4867,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.hope@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Education For All Foundation',
    '42, Andheri West, Mumbai 400058',
    'Mumbai',
    'Maharashtra',
    '9200000101',
    'ngo.education@daansetu.org',
    'Education support NGO for underprivileged children.',
    'REG-EDU-2024-001',
    'AAATE1201F',
    '80G-EDU-2024',
    NULL,
    'https://education.example.org',
    19.0760,
    72.8777,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.education@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Rapid Relief India',
    '15, Connaught Place, New Delhi 110001',
    'New Delhi',
    'Delhi',
    '9200000102',
    'ngo.relief@daansetu.org',
    'Disaster response and emergency shelter support.',
    'REG-REL-2024-002',
    'AAATR1202F',
    '80G-REL-2024',
    NULL,
    'https://relief.example.org',
    28.6139,
    77.2090,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.relief@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Feed India Movement',
    '78, MG Road, Bangalore 560001',
    'Bangalore',
    'Karnataka',
    '9200000103',
    'ngo.feed@daansetu.org',
    'Hunger relief and daily meal program operations.',
    'REG-FED-2024-003',
    'AAATF1203F',
    '80G-FED-2024',
    NULL,
    'https://feed.example.org',
    12.9716,
    77.5946,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.feed@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'WaterAid India',
    '23, T Nagar, Chennai 600017',
    'Chennai',
    'Tamil Nadu',
    '9200000104',
    'ngo.wateraid@daansetu.org',
    'Clean water and sanitation access projects.',
    'REG-WAT-2024-004',
    'AAATW1204F',
    '80G-WAT-2024',
    NULL,
    'https://water.example.org',
    13.0827,
    80.2707,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.wateraid@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Health First NGO',
    '56, Park Street, Kolkata 700016',
    'Kolkata',
    'West Bengal',
    '9200000105',
    'ngo.health@daansetu.org',
    'Healthcare outreach and medicine access for rural areas.',
    'REG-HEA-2024-005',
    'AAATH1205F',
    '80G-HEA-2024',
    NULL,
    'https://health.example.org',
    22.5726,
    88.3639,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.health@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Green Earth Initiative',
    '89, CG Road, Ahmedabad 380006',
    'Ahmedabad',
    'Gujarat',
    '9200000106',
    'ngo.green@daansetu.org',
    'Environmental restoration and tree plantation drives.',
    'REG-GRE-2024-006',
    'AAATG1206F',
    '80G-GRE-2024',
    NULL,
    'https://green.example.org',
    23.0225,
    72.5714,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.green@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Warmth Foundation',
    '34, MI Road, Jaipur 302001',
    'Jaipur',
    'Rajasthan',
    '9200000107',
    'ngo.warmth@daansetu.org',
    'Winter relief and clothing support for vulnerable families.',
    'REG-WAR-2024-007',
    'AAATW1207F',
    '80G-WAR-2024',
    NULL,
    'https://warmth.example.org',
    26.9124,
    75.7873,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.warmth@daansetu.org');

INSERT INTO ngos (
    ngo_name, address, city, state, phone, email, description,
    registration_number, pan_number, section80g_number,
    logo, website, latitude, longitude, verified
)
SELECT
    'Women Empowerment Trust',
    '45, Banjara Hills, Hyderabad 500034',
    'Hyderabad',
    'Telangana',
    '9200000108',
    'ngo.women@daansetu.org',
    'Women skill development and livelihood programs.',
    'REG-WEM-2024-008',
    'AAATW1208F',
    '80G-WEM-2024',
    NULL,
    'https://women.example.org',
    17.3850,
    78.4867,
    1
WHERE NOT EXISTS (SELECT 1 FROM ngos WHERE email = 'ngo.women@daansetu.org');

-- ---------------------------------------------------------------------------
-- 3) Campaigns
-- ---------------------------------------------------------------------------
INSERT INTO campaigns (
    ngo_id, admin_id, title, description, donation_type,
    target_amount, collected_amount, start_date, end_date,
    campaign_status, image, city, state, donors_count,
    latitude, longitude
)
SELECT
    (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    (SELECT user_id FROM users WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    'Nutrition Drive 2026',
    'Immediate food support for low-income families.',
    'FOOD',
    500000.00,
    0.00,
    CURDATE() - INTERVAL 20 DAY,
    CURDATE() + INTERVAL 70 DAY,
    'ACTIVE',
    NULL,
    'Hyderabad',
    'Telangana',
    0,
    17.3850,
    78.4867
WHERE NOT EXISTS (
    SELECT 1 FROM campaigns
    WHERE title = 'Nutrition Drive 2026'
      AND ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1)
);

INSERT INTO campaigns (
    ngo_id, admin_id, title, description, donation_type,
    target_amount, collected_amount, start_date, end_date,
    campaign_status, image, city, state, donors_count,
    latitude, longitude
)
SELECT
    (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    (SELECT user_id FROM users WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    'School Kit Support 2026',
    'Books and school kits for children.',
    'BOOKS',
    300000.00,
    0.00,
    CURDATE() - INTERVAL 15 DAY,
    CURDATE() + INTERVAL 90 DAY,
    'ACTIVE',
    NULL,
    'Hyderabad',
    'Telangana',
    0,
    17.4300,
    78.4500
WHERE NOT EXISTS (
    SELECT 1 FROM campaigns
    WHERE title = 'School Kit Support 2026'
      AND ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1)
);

-- ---------------------------------------------------------------------------
-- 4) Donations
-- ---------------------------------------------------------------------------
INSERT INTO donations (
    user_id, campaign_id, donation_type, amount, donation_status,
    donation_date, message, anonymous
)
SELECT
    (SELECT user_id FROM users WHERE email = 'donor.sneha@daansetu.org' LIMIT 1),
    (SELECT campaign_id FROM campaigns WHERE title = 'Nutrition Drive 2026' LIMIT 1),
    'FOOD', 15000.00, 'COMPLETED',
    NOW() - INTERVAL 12 DAY,
    'For urgent family food kits',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM donations
    WHERE user_id = (SELECT user_id FROM users WHERE email = 'donor.sneha@daansetu.org' LIMIT 1)
      AND campaign_id = (SELECT campaign_id FROM campaigns WHERE title = 'Nutrition Drive 2026' LIMIT 1)
      AND amount = 15000.00
);

INSERT INTO donations (
    user_id, campaign_id, donation_type, amount, donation_status,
    donation_date, message, anonymous
)
SELECT
    (SELECT user_id FROM users WHERE email = 'donor.ravi@daansetu.org' LIMIT 1),
    (SELECT campaign_id FROM campaigns WHERE title = 'School Kit Support 2026' LIMIT 1),
    'BOOKS', 10000.00, 'COMPLETED',
    NOW() - INTERVAL 7 DAY,
    'For notebooks and stationery',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM donations
    WHERE user_id = (SELECT user_id FROM users WHERE email = 'donor.ravi@daansetu.org' LIMIT 1)
      AND campaign_id = (SELECT campaign_id FROM campaigns WHERE title = 'School Kit Support 2026' LIMIT 1)
      AND amount = 10000.00
);

INSERT INTO donations (
    user_id, campaign_id, donation_type, amount, donation_status,
    donation_date, message, anonymous
)
SELECT
    (SELECT user_id FROM users WHERE email = 'donor.sneha@daansetu.org' LIMIT 1),
    (SELECT campaign_id FROM campaigns WHERE title = 'School Kit Support 2026' LIMIT 1),
    'BOOKS', 5000.00, 'COMPLETED',
    NOW() - INTERVAL 2 DAY,
    'Happy to support students',
    0
WHERE NOT EXISTS (
    SELECT 1 FROM donations
    WHERE user_id = (SELECT user_id FROM users WHERE email = 'donor.sneha@daansetu.org' LIMIT 1)
      AND campaign_id = (SELECT campaign_id FROM campaigns WHERE title = 'School Kit Support 2026' LIMIT 1)
      AND amount = 5000.00
);

-- Keep campaign totals and donor counts in sync for dashboard cards
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
    )
WHERE c.ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1);

-- ---------------------------------------------------------------------------
-- 5) Donation items (used by pickup item list)
-- ---------------------------------------------------------------------------
INSERT INTO donation_items (donation_id, item_name, category, quantity, description, estimated_value)
SELECT
    d.donation_id,
    'Rice Bags',
    'FOOD',
    10,
    '10kg bags',
    6000.00
FROM donations d
WHERE d.message = 'For urgent family food kits'
  AND NOT EXISTS (SELECT 1 FROM donation_items di WHERE di.donation_id = d.donation_id);

INSERT INTO donation_items (donation_id, item_name, category, quantity, description, estimated_value)
SELECT
    d.donation_id,
    'School Notebooks',
    'BOOKS',
    50,
    'A4 notebook packs',
    3000.00
FROM donations d
WHERE d.message = 'For notebooks and stationery'
  AND NOT EXISTS (SELECT 1 FROM donation_items di WHERE di.donation_id = d.donation_id);

-- ---------------------------------------------------------------------------
-- 6) Pickup requests
-- ---------------------------------------------------------------------------
INSERT INTO pickup_requests (
    donation_id, donor_address, pickup_date, time_slot,
    pickup_status, contact_phone, notes, latitude, longitude, reminder_sent
)
SELECT
    d.donation_id,
    'Flat 301, Banjara Hills, Hyderabad',
    CURDATE() + INTERVAL 1 DAY,
    '10:00 AM - 12:00 PM',
    'SCHEDULED',
    '9000000011',
    'Call before arrival',
    17.4100,
    78.4500,
    0
FROM donations d
WHERE d.message = 'For urgent family food kits'
  AND NOT EXISTS (SELECT 1 FROM pickup_requests p WHERE p.donation_id = d.donation_id);

INSERT INTO pickup_requests (
    donation_id, donor_address, pickup_date, time_slot,
    pickup_status, contact_phone, notes, latitude, longitude, reminder_sent
)
SELECT
    d.donation_id,
    'Hitech City, Hyderabad',
    CURDATE() + INTERVAL 2 DAY,
    '03:00 PM - 05:00 PM',
    'PENDING',
    '9000000012',
    'Security gate entry required',
    17.4483,
    78.3915,
    0
FROM donations d
WHERE d.message = 'For notebooks and stationery'
  AND NOT EXISTS (SELECT 1 FROM pickup_requests p WHERE p.donation_id = d.donation_id);

-- ---------------------------------------------------------------------------
-- 7) Volunteers
-- ---------------------------------------------------------------------------
INSERT INTO volunteers (
    user_id, ngo_id, volunteer_status, joined_date, hours_volunteered, tasks_completed
)
SELECT
    (SELECT user_id FROM users WHERE email = 'volunteer.meena@daansetu.org' LIMIT 1),
    (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    'ACTIVE',
    CURDATE() - INTERVAL 30 DAY,
    14,
    3
WHERE NOT EXISTS (
    SELECT 1 FROM volunteers v
    WHERE v.user_id = (SELECT user_id FROM users WHERE email = 'volunteer.meena@daansetu.org' LIMIT 1)
);

INSERT INTO volunteers (
    user_id, ngo_id, volunteer_status, joined_date, hours_volunteered, tasks_completed
)
SELECT
    (SELECT user_id FROM users WHERE email = 'volunteer.arjun@daansetu.org' LIMIT 1),
    (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    'ACTIVE',
    CURDATE() - INTERVAL 20 DAY,
    8,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM volunteers v
    WHERE v.user_id = (SELECT user_id FROM users WHERE email = 'volunteer.arjun@daansetu.org' LIMIT 1)
);

-- ---------------------------------------------------------------------------
-- 8) Task assignments
-- ---------------------------------------------------------------------------
INSERT INTO task_assignments (
    pickup_id, volunteer_id, assigned_date, task_status, description, completed_date
)
SELECT
    p.pickup_id,
    (SELECT volunteer_id FROM volunteers v
      JOIN users u ON u.user_id = v.user_id
      WHERE u.email = 'volunteer.meena@daansetu.org' LIMIT 1),
    NOW() - INTERVAL 1 DAY,
    'ASSIGNED',
    'Pickup assignment for request #1',
    NULL
FROM pickup_requests p
WHERE p.time_slot = '10:00 AM - 12:00 PM'
  AND NOT EXISTS (SELECT 1 FROM task_assignments t WHERE t.pickup_id = p.pickup_id);

-- ---------------------------------------------------------------------------
-- 9) Urgent needs (homepage banner)
-- ---------------------------------------------------------------------------
INSERT INTO urgent_needs (
    admin_id, title, message, start_time, end_time, created_at, urgent_status
)
SELECT
    (SELECT user_id FROM users WHERE email = 'ngo.hope@daansetu.org' LIMIT 1),
    'Urgent: Food shortage in local shelters',
    'Need immediate dry ration support for 120 families this week.',
    NOW() - INTERVAL 2 HOUR,
    NOW() + INTERVAL 7 DAY,
    NOW(),
    'APPROVED'
WHERE NOT EXISTS (
    SELECT 1 FROM urgent_needs
    WHERE title = 'Urgent: Food shortage in local shelters'
      AND admin_id = (SELECT user_id FROM users WHERE email = 'ngo.hope@daansetu.org' LIMIT 1)
);

-- ---------------------------------------------------------------------------
-- 10) Notifications (for bell/history)
-- ---------------------------------------------------------------------------
INSERT INTO notifications (
    user_id, title, message, type, reference_id, reference_type, is_read, created_at
)
SELECT
    (SELECT user_id FROM users WHERE email = 'donor.sneha@daansetu.org' LIMIT 1),
    'Campaign update',
    'Nutrition Drive reached a new milestone. Thank you for your support!',
    'CAMPAIGN',
    (SELECT campaign_id FROM campaigns WHERE title = 'Nutrition Drive 2026' LIMIT 1),
    'CAMPAIGN',
    0,
    NOW() - INTERVAL 1 DAY
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.title = 'Campaign update'
      AND n.reference_type = 'CAMPAIGN'
      AND n.user_id = (SELECT user_id FROM users WHERE email = 'donor.sneha@daansetu.org' LIMIT 1)
);

INSERT INTO notifications (
    user_id, title, message, type, reference_id, reference_type, is_read, created_at
)
SELECT
    (SELECT user_id FROM users WHERE email = 'volunteer.meena@daansetu.org' LIMIT 1),
    'Pickup alert',
    'A new pickup has been assigned to you. Please check your volunteer tasks.',
    'PICKUP',
    (SELECT pickup_id FROM pickup_requests ORDER BY pickup_id DESC LIMIT 1),
    'PICKUP',
    0,
    NOW() - INTERVAL 3 HOUR
WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.title = 'Pickup alert'
      AND n.reference_type = 'PICKUP'
      AND n.user_id = (SELECT user_id FROM users WHERE email = 'volunteer.meena@daansetu.org' LIMIT 1)
);

-- Quick verification snapshots
SELECT ngo_id, ngo_name, email, verified FROM ngos WHERE email = 'ngo.hope@daansetu.org';
SELECT campaign_id, title, collected_amount, donors_count FROM campaigns WHERE ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org');
SELECT donation_id, amount, donation_status, donation_date FROM donations WHERE campaign_id IN (SELECT campaign_id FROM campaigns WHERE ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org'));
SELECT pickup_id, pickup_status, pickup_date, time_slot FROM pickup_requests WHERE donation_id IN (SELECT donation_id FROM donations WHERE campaign_id IN (SELECT campaign_id FROM campaigns WHERE ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org')));
SELECT volunteer_id, user_id, volunteer_status, tasks_completed, hours_volunteered FROM volunteers WHERE ngo_id = (SELECT ngo_id FROM ngos WHERE email = 'ngo.hope@daansetu.org');
SELECT urgent_id, title, urgent_status, start_time, end_time FROM urgent_needs WHERE admin_id = (SELECT user_id FROM users WHERE email = 'ngo.hope@daansetu.org');

