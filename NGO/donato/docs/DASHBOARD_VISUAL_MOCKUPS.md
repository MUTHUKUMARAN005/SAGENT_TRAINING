# NGO Admin Dashboard - Visual Mockup & Component Guide

## 📱 DESKTOP VIEW (Full Screen)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR                                   Welcome back, Admin | NGO Account  │
├──────────────────┬──────────────────────────────────────────────────────────┤
│                  │                                                          │
│  [Main]          │  Dashboard                                   🔄  ⋮      │
│  ├─ Dashboard    │                                                          │
│                  │  Manage your NGO operations and monitor donations       │
│  [Campaigns]     │                                                          │
│  ├─ Campaigns    │  ┌──────────────┬──────────────┬──────────────┬─────┐   │
│  ├─ Create       │  │ ₹ Total      │ 📊 Active    │ 👥 Total     │ 🤝  │   │
│  ├─ Approve      │  │ Donations    │ Campaigns    │ Donors       │ Vol │   │
│  │               │  │ ₹5,45,000    │ 12           │ 2,450        │ 340 │   │
│  [Donations]     │  └──────────────┴──────────────┴──────────────┴─────┘   │
│  ├─ All          │                                                          │
│  ├─ Payment      │  ┌──────────────────────────────┐  ┌──────────────────┐ │
│  ├─ Receipts     │  │ Monthly Donations Trend      │  │ Donation Types   │ │
│  │               │  │ ▁▃▄▆█▇▅                       │  │  ◐ Money   65%   │ │
│  [Pickups]       ���  │                              │  │  ◐ Food    20%   │ │
│  ├─ Requests     │  │ Jan Feb Mar Apr May Jun     │  │  ◐ Clothes 10%   │ │
│  ├─ Assign       │  │                              │  │  ◐ Books    5%   │ │
│  ├─ Users        │  └──────────────────────────────┘  └──────────────────┘ │
│  │               │                                                          │
│  [Operations]    │  ┌──────────────────────────────┐  ┌──────────────────┐ │
│  ├─ Volunteers   │  │ Recent Donations             │  │ Recent Pickups   │ │
│  ├─ Tasks        │  │                              │  │                  │ │
│  ├─ Urgent       │  │ Priya Sharma  ₹5,000  ✓     │  │ PICK-001 Today   │ │
│  │               │  │ Rahul Singh   ₹10,000 ✓     │  │ PICK-002 Tomorrow│ │
│  [Reports]       │  │ Anita Verma   ₹2,500  ⏳     │  │ PICK-003 2 days  │ │
│  ├─ Reports      │  │ Vikram Patel  ₹7,500  ✓     │  │ PICK-004 3 days  │ │
│  ├─ Notif        │  │                              │  │                  │ │
│  ├─ Settings     │  └──────────────────────────────┘  └──────────────────┘ │
│                  │                                                          │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

## 📱 TABLET VIEW (Medium Screen)

```
┌──────────────────────────────────────────────────────────────┐
│ NAVBAR              Welcome back, Admin | NGO Account         │
├─���────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ [Dashboard]  │ Dashboard              🔄  ⋮               │
│ [Campaigns]  │                                              │
│ [Donations]  │ ┌──��───────────┬──────────────┐             │
│ [Pickups]    │ │ ₹ Donations  │ 📊 Campaigns │             │
│ [Operations] │ │ ₹5,45,000    │ 12           │             │
│ [Reports]    │ └──────────────┴──────────────┘             │
│              │                                              │
│              │ ┌──────────────────────────────────────────┐ │
│              │ │ Monthly Donations                        │ │
│              │ │ ▁▃▄▆█▇▅                                  │ │
│              │ │ Jan Feb Mar Apr May Jun                  │ │
│              │ └──────────────────────────────────────────┘ │
│              │                                              │
│              │ ┌──────────────┬──────────────┐             │
│              │ │ Recent       │ Recent       │             │
│              │ │ Donations    │ Pickups      │             │
│              │ │ Priya        │ PICK-001     │             │
│              │ │ ₹5,000 ✓     │ Today        │             │
│              │ │ Rahul        │ PICK-002     │             │
│              │ │ ₹10,000 ✓    │ Tomorrow     │             │
│              │ └��─────────────┴──────────────┘             │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

## 📱 MOBILE VIEW (Small Screen)

```
┌──────────────────────────────────┐
│ ☰ NAVBAR       Dashboard    🔄    │
├──────────────────────────────────┤
│                                  │
│ [Dashboard]                      │
│ [Campaigns]                      │
│ [Donations]                      │
│ [Pickups]                        │
│ [Operations]                     │
│ [Reports]                        │
│                                  │
├──────────────────────────────────┤
│ Dashboard                        │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ ₹ Donations                  │ │
│ │ ₹5,45,000                    │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 📊 Campaigns                 │ │
│ │ 12                           │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ 👥 Donors                    │ │
│ │ 2,450                        │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Monthly Donations            │ │
│ │ ▁▃▄▆█▇▅                       │ │
│ │ Jan Feb Mar Apr May Jun      │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Donation Types               │ │
│ │ ◐ Money   65%               │ │
│ │ ◐ Food    20%               │ │
│ │ ◐ Clothes 10%               │ │
│ │ ◐ Books    5%               │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────────────────────┐ │
│ │ Recent Donations             │ │
│ │ Priya Sharma  ₹5,000   ✓     │ │
│ │ Rahul Singh   ₹10,000  ✓     │ │
│ │ Anita Verma   ₹2,500   ⏳     │ │
│ │ Vikram Patel  ₹7,500   ✓     │ │
│ └──────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘
```

## 🎨 STAT CARD COMPONENT

```
┌─────────────────────────────┐
│ 💰  ┌───────────────────┐  │
│     │ Total Donations   │  │
│     │ ₹5,45,000         │  │
│     └───────────────────┘  │
└─────────────────────────────┘

Components:
├─ Icon (left): FiDollarSign
├─ Background: Gradient (blue-500 → cyan-500)
├─ Title: "Total Donations"
└─ Value: "₹5,45,000"

Variants:
├─ Blue (Donations)
├─ Primary (Campaigns)
├─ Green (Donors)
├─ Purple (Volunteers)
└─ Orange (Pickups)
```

## 📊 CHARTS

### Bar Chart - Monthly Donations
```
70K  │                 ▆
60K  │           ▆ █ ▅
50K  │  ▅  ▆ █ ▅ ▆ ▃
40K  │ █  █       ▁
30K  │━━━━━━━━━━━━━━━━━━
    └─────────────────────
     Jan Feb Mar Apr May Jun

Features:
  ├─ Blue bars: Actual donations
  ├─ Gray bars: Target amount
  ├─ Interactive tooltips
  └─ Grid background
```

### Pie Chart - Donation Types
```
        Money
    ●●●●●●●●● 65%
   ●           ●
  ● Food 20%    ●
  ●   ●●●●      ●
  ●  ● Clothes  ●
   ●  10% Books  ●
    ● ●●●●●● 5%●
      ●●●●●●●

Features:
  ├─ Donut style
  ├─ Color-coded by type
  ├─ Percentage labels
  └─ Interactive tooltip
```

## 📋 TABLE COMPONENTS

### Campaigns Table
```
┌─────────────────────────────────────────────────────────────────┐
│ Campaign Name  │ Type   │ Progress │ Donations  │ Status │ Act  │
├─────────────────────────────────────────────────────────────────┤
│ Education Fund │ Money  │ ███████░ │ ₹4,50,000  │ Active │ ✎ ✓  │
│ Mumbai, Edu...│        │          │            │        │      │
├─────────────────────────────────────────────────────────────────┤
│ Food Drive     │ Food   │ ██████░░ │ ₹3,20,000  │ Active │ ✎ ✓  │
│ Delhi, Relief  │        │          │            │        │      │
├─────────────────────────────────────────────────────────────────┤
│ Medical Aid    │ Money  │ ████░░░░ │ ₹1,80,000  │ Pending│ ✎ ✓  │
│ Bangalore, Heal│        │          │            │        │      │
└─────────────────────────────────────────────────────────────────┘

Features:
  ├─ Responsive columns
  ├─ Progress bar (visual)
  ├─ Status badge (color-coded)
  ├─ Action buttons (edit, approve)
  └─ Hover effects
```

### Donations Table
```
┌──────────────────────────────────────────────────────────┐
│ Donor        │ Amount    │ Campaign  │ Type   │ Date │ St│
├──────────────────────────────────────────────────────────┤
│ Priya Sharma │ ₹5,000    │ Education │ Money  │ 3/15 │ ✓ │
├──────────────────────────────────────────────────────────┤
│ Rahul Singh  │ ₹10,000   │ Food      │ Money  │ 3/14 │ ✓ │
├──────────────────────────────────────────────────────────┤
│ Anita Verma  │ Food pack │ Relief    │ Item   │ 3/13 │ ⏳│
└──────────────────────────────────────────────────────────┘

Features:
  ├─ Sortable columns
  ├─ Status badge
  ├─ Amount formatting
  └─ Date display
```

## 🎨 COLOR VARIATIONS

### Status Badges
```
✅ Completed
┌─────────────────────┐
│  ✓ Completed        │
└─────────────────────┘
Background: bg-green-500/10
Text: text-green-400
Border: border-green-500/20

⏳ Pending
┌─────────────────────┐
│  ⏳ Pending          │
└─────────────────────┘
Background: bg-yellow-500/10
Text: text-yellow-400
Border: border-yellow-500/20

🔵 Assigned
┌─────────────────────┐
│  Assigned           │
└─────────────────────┘
Background: bg-blue-500/10
Text: text-blue-400
Border: border-blue-500/20

🟣 In Progress
┌─────────────────────┐
│  In Progress        │
└─────────────────────┘
Background: bg-purple-500/10
Text: text-purple-400
Border: border-purple-500/20
```

## 📱 SIDEBAR MENU STATES

### Active State
```
┌─────────────────────────────┐
│ 🏠 Dashboard                │ ← Primary color
│    |────────────── ➤       │    Background: primary/20
│                             │    Border: primary/30
│                             │    Text: primary-400
└─────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────┐
│ 📋 Campaigns  ┐             │ ← Light background
│              ├─ hover       │    Background: white/5
│              ┘             │
└─────────────────────────────┘
```

### Default State
```
┌─────────────────────────────┐
│ 💳 Donations                │ ← Gray text
│                             │    Text: slate-400
│                             │
└─────────────────────────────┘
```

## ✨ ANIMATIONS & TRANSITIONS

### Page Load
```
Sidebar (fadeInLeft)
├─ From: translateX(-100%)
├─ To: translateX(0)
├─ Duration: 0.5s
└─ Easing: ease-out

Content (fadeInRight)
├─ From: opacity 0
├─ To: opacity 1
├─ Duration: 0.5s
└─ Easing: ease-out
```

### Menu Item Hover
```
Icon nudges right by 4px
├─ From: translateX(0)
├─ To: translateX(4px)
├─ Duration: Instant
└─ Creates depth effect
```

### Button Interaction
```
On Hover:
├─ Scale: 1.0 → 1.05
├─ Duration: 200ms
└─ Easing: smooth

On Tap:
├─ Scale: 1.0 → 0.95
├─ Duration: 100ms
└─ Feedback: tactile
```

## 🔄 INTERACTIVE ELEMENTS

### Search Input
```
┌────────────────────────────────────┐
│ 🔍  Search campaigns...             │
└────────────────────────────────────┘
  ├─ Icon (left): FiSearch
  ├─ Placeholder: Gray
  ├─ Focus border: Primary color
  └─ Typing: Real-time filter
```

### Filter Dropdown
```
┌──────────────────┐
│ All Status   ▼   │
├──────────────────┤
│ All Status       │ ← Selected
│ Active           │
│ Pending Approval │
│ Completed        │
│ Paused           │
└──────────────────┘
```

### Action Buttons
```
Create Campaign Button
┌─────────────────────────┐
│ ➕ Create Campaign       │
└─────────────────────────┘
├─ Background: Primary-600
├─ Hover: Primary-700
├─ Icon: FiPlus
└─ Text: White

Export Report Button
┌─────────────────────────┐
│ ⬇️ Export Report        │
└─────────────────────────┘
├─ Background: Blue-600/20
├─ Hover: Blue-600/30
├─ Text: Blue-400
└─ Icon: FiDownload
```

## 🎯 VISUAL HIERARCHY

### Title & Description
```
Dashboard (Large, Bold)
├─ Font: font-heading
├─ Size: text-3xl
├─ Weight: font-bold
└─ Color: text-white

Manage your NGO operations... (Small, Muted)
├─ Font: System
├─ Size: text-sm
├─ Weight: font-normal
└─ Color: text-slate-400
```

### Information Layers
```
Primary: White (#ffffff)
├─ Headlines
├─ Important data
└─ Active elements

Secondary: Slate-300 (#cbd5e1)
├─ Body text
├─ Data values
└─ Labels

Tertiary: Slate-400 (#94a3b8)
├─ Supporting text
├─ Timestamps
└─ Descriptions

Disabled: Slate-500 (#64748b)
├─ Inactive elements
├─ Placeholder text
└─ Muted information
```

---

**Visual Design Version**: 1.0
**Date**: March 17, 2026
**Status**: Production Ready

