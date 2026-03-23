# NGO Donation Platform - End-to-End Workflow

This document defines the complete website and operations workflow across visitor, donor, NGO, volunteer, and admin personas.

## 1) Visitor Opens Website

When a visitor lands on the platform, they can see:
- Home
- Campaigns
- Urgent Needs
- NGOs
- Volunteer
- Login / Register

High-level flow:
`Visitor -> Browse Campaigns -> Register/Login -> Donate`

Core tables touched later:
- `USER`
- `CAMPAIGN`
- `URGENT_NEEDS`

---

## 2) User Registration

User creates an account with:
- Name
- Email
- Phone
- Password
- Address
- City

Workflow:
`Register -> Verify Email/SMS -> Account Created`

Optional verification:
- SMS OTP verification
- Email verification

Primary tables:
- `USER`
- `EMAIL_VERIFICATION_TOKEN`
- `OTP_RECORD`
- `EMAIL_LOG`
- `SMS_LOG`

---

## 3) User Login

User logs in with:
- Email or phone
- Password

System validates credentials. If valid:
- Session/token is issued
- Dashboard opens

Primary tables:
- `USER`

---

## 4) NGO Registration

Organizations apply with:
- NGO name
- Address
- City
- State
- Phone
- Email
- Description

Workflow:
`NGO Apply -> Admin Review -> NGO Approved`

After approval, NGO can create campaigns.

Primary tables:
- `NGO`
- `USER` (for NGO account linkage where applicable)

---

## 5) Campaign Creation (NGO)

NGO creates campaigns such as:
- Education support
- Medical help
- Disaster relief
- Food distribution

Campaign includes:
- Title
- Description
- Target amount
- Donation type
- Start date
- End date

Workflow:
`NGO Dashboard -> Create Campaign -> Publish Campaign`

Published campaigns become visible to users.

Primary tables:
- `CAMPAIGN`
- `NGO`

---

## 6) Browse Campaigns

Users can explore campaigns with:
- Campaign list
- Search
- Filters
- Donation progress bar

User selects a campaign to donate.

Primary tables:
- `CAMPAIGN`
- `NGO`
- `DONATION` (for progress aggregation)

---

## 7) Donation Process

User clicks Donate. Two donation types are supported.

### 7.1 Money Donation

User enters:
- Donation amount
- Payment method

Workflow:
`Select Campaign -> Enter Amount -> Payment -> Donation Recorded`

Typical payment methods:
- UPI
- QR code
- Net banking

Records created:
- Donation record
- Payment record

Primary tables:
- `DONATION`
- `PAYMENT`

### 7.2 Item Donation

User can donate items such as:
- Clothes
- Food
- Books
- Medicine

Workflow:
`Select Campaign -> Add Items -> Submit Donation`

Primary tables:
- `DONATION`
- `DONATION_ITEM`

---

## 8) Pickup Scheduling (Item Donation)

If item donation needs pickup, user selects:
- Address
- Pickup date
- Time slot

Workflow:
`Item Donation -> Schedule Pickup -> Pickup Request Created`

Primary tables:
- `PICKUP_REQUEST`
- `DONATION_ITEM`

---

## 9) Volunteer Registration

Users can apply as volunteers.

Workflow:
`Apply Volunteer -> NGO/Admin Approval -> Volunteer Activated`

Primary tables:
- `VOLUNTEER`
- `USER`

---

## 10) Volunteer Task Assignment

Admin assigns pickup tasks.

Workflow:
`Pickup Request -> Assign Volunteer -> Volunteer Accepts Task`

Primary tables:
- `TASK_ASSIGNMENT`
- `PICKUP_REQUEST`
- `VOLUNTEER`

---

## 11) Donation Collection

Volunteer visits donor location and updates status.

Workflow:
`Volunteer Pickup -> Update Status -> Donation Collected`

Primary tables:
- `PICKUP_REQUEST`
- `TASK_ASSIGNMENT`
- `DONATION`

---

## 12) Receipt Generation

After successful donation, system generates receipt.

Workflow:
`Donation Completed -> Receipt Generated -> User Download Receipt`

Receipt includes:
- Donation ID
- Amount
- Date
- NGO name

Primary tables:
- `DONATION_RECEIPT`
- `DONATION`
- `NGO`

---

## 13) Urgent Needs Feature

Admin can post urgent needs such as:
- Flood relief
- Medical emergency
- Food shortage

Workflow:
`Admin Creates Urgent Need -> Users View -> Instant Donations`

Urgent needs are displayed on home page.

Primary tables:
- `URGENT_NEEDS`

---

## 14) Donation Request (Help Request)

Users can request support such as:
- Medical support
- Financial help

Workflow:
`User Request -> Admin Review -> Approve / Reject`

Approved requests can be converted into campaigns or direct support flows.

Primary tables:
- `DONATION_REQUEST`
- `CAMPAIGN` (when converted)

---

## 15) Notifications

System sends:
- SMS notifications
- Email notifications
- In-app notifications

Examples:
- Donation success
- Thank-you messages
- Pickup reminders

Primary tables:
- `NOTIFICATION`
- `EMAIL_LOG`
- `SMS_LOG`

---

## 16) Admin Dashboard

Admin manages:
- Users
- NGOs
- Campaigns
- Donations
- Volunteers
- Pickup requests
- Urgent needs

Admin statistics typically include:
- Total donations
- Active campaigns
- Pending pickups
- Volunteers

Primary tables:
- `USER`
- `NGO`
- `CAMPAIGN`
- `DONATION`
- `VOLUNTEER`
- `PICKUP_REQUEST`
- `URGENT_NEEDS`

---

## Final User Journey

`Visit Website`
`-> Register / Login`
`-> Browse Campaigns`
`-> Select Campaign`
`-> Donate Money / Items`
`-> Payment Success`
`-> Pickup Scheduled (if item donation)`
`-> Volunteer Assigned`
`-> Donation Collected`
`-> Receipt Generated`

---

## NGO Journey

`Register NGO`
`-> Admin Approval`
`-> Create Campaign`
`-> Receive Donations`
`-> Manage Volunteers`
`-> Track Campaign Progress`

---

## Admin Journey

`Manage Users`
`-> Approve NGOs`
`-> Manage Campaigns`
`-> Assign Volunteers`
`-> Monitor Donations`
`-> Handle Urgent Needs`
`-> Generate Reports`

---

## Table Mapping (Logical -> Typical Physical)

- `USER` -> `users`
- `NGO` -> `ngos`
- `CAMPAIGN` -> `campaigns`
- `DONATION` -> `donations`
- `DONATION_ITEM` -> `donation_items`
- `PAYMENT` -> `payments`
- `PICKUP_REQUEST` -> `pickup_requests`
- `VOLUNTEER` -> `volunteers`
- `TASK_ASSIGNMENT` -> `task_assignments`
- `DONATION_RECEIPT` -> `donation_receipts`
- `URGENT_NEEDS` -> `urgent_needs`
- `DONATION_REQUEST` -> `donation_requests`
- `NOTIFICATION` -> `notifications`
- `EMAIL_VERIFICATION_TOKEN` -> `email_verification_tokens`
- `PASSWORD_RESET_TOKEN` -> `password_reset_tokens`
- `OTP_RECORD` -> `otp_records`
- `EMAIL_LOG` -> `email_logs`
- `SMS_LOG` -> `sms_logs`

