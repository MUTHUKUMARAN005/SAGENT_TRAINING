# NGO Admin Dashboard - Visual Reference & Component Map

## 📐 Layout Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVBAR (Fixed Top)                     │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│   SIDEBAR            │        MAIN CONTENT AREA            │
│   (280px / 80vw)     │      (Flex, Responsive)            │
│                      │                                      │
│  ┌────────────────┐  │  ┌──────────────────────────────┐  │
│  │ Main           │  │  │ Page Title & Actions         │  │
│  │ ├─ Dashboard   │  │  ├─ Refresh Button             │  │
│  │                │  │  └─ Mobile Menu Toggle          │  │
│  │ Campaigns      │  │                                  │  │
│  │ ├─ Campaigns   │  │  ┌──────────────────────────────┐  │
│  │ ├─ Create      │  │  │ DASHBOARD OVERVIEW           │  │
│  │ └─ Approve     │  │  │                              │  │
│  │                │  │  │ 5 Stats Cards (Grid)         │  │
│  │ Donations      │  │  │                              │  │
│  │ ├─ All         │  │  │ Chart Row (2/3 + 1/3)       │  │
│  │ ├─ Payment     │  │  │ ├─ Bar Chart                │  │
│  │ └─ Receipts    │  │  │ └─ Pie Chart                │  │
│  │                │  │  │                              │  │
│  │ Pickups        │  │  │ Activities (2 columns)       │  │
│  │ ├─ Requests    │  │  │ ├─ Recent Donations         │  │
│  │ ├─ Assign Vol  │  │  │ └─ Recent Pickups           │  │
│  │ └─ Users       │  │  │                              │  │
│  │                │  │  └──────────────────────────────┘  │
│  │ Operations     │  │                                      │
│  │ ├─ Volunteers  │  │                                      │
│  │ ├─ Tasks       │  │                                      │
│  │ └─ Urgent      │  │                                      │
│  │                │  │                                      │
│  │ Reports        │  │                                      │
│  │ ├─ Reports     │  │                                      │
│  │ ├─ Notif       │  │                                      │
│  │ └─ Settings    │  │                                      │
│  │                │  │                                      │
│  └────────────────┘  │                                      │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

## 🎯 Component Hierarchy

```
NGOAdminDashboard (Main Component)
├── Sidebar (Motion.aside)
│   ├── Menu Categories (6x)
│   │   ├── Category Title
│   │   └── Menu Items (3-4x each)
│   │       ├── Icon
│   │       ├── Label
│   │       └── Active Indicator
│   └── Mobile Backdrop (onClick close)
│
├── Main Content Area (Motion.main)
│   ├── Header Bar
│   │   ├── Title & Description
│   │   └── Action Buttons
│   │       ├── Refresh Button
│   │       └── Mobile Menu Toggle
│   │
│   └── Current Section Renderer
│       ├── DashboardOverview
│       │   ├── Stats Cards Grid (5x StatCard)
│       │   ├── Charts Row (BarChart + PieChart)
│       │   └── Activities Row (2 lists)
│       │
│       ├── CampaignsSection
│       │   ├── Header with Create Button
│       │   ├── Search & Filter Bar
│       │   └── Data Table
│       │
│       ├── DonationsSection
│       │   ├── Header with Export Button
│       │   └── Data Table
│       │
│       └── PlaceholderSection (for future sections)
```

## 📊 Data Flow

```
DashboardPage
    ↓
NGOAdminDashboard
    ├─ useAuth() → isNGO, user
    ├─ useState(currentSection)
    ├─ useEffect(() → fetchData())
    │   ├─ api.getNGOStats()
    │   └─ api.getNGOCampaigns()
    │       ↓
    │   [ngoStats, campaigns] → State
    │
    └─ renderSection()
        ├─ Dashboard → Charts + Stats
        ├─ Campaigns → Table
        └─ Donations → Table
```

## 🎨 Color Palette

```
Primary Colors:
├─ Primary-500: #3b82f6 (Main accent)
├─ Blue-500: #0ea5e9 (Secondary)
├─ Blue-600: #0284c7 (Darker)
├─ Primary-400: #60a5fa (Light accent)
└─ Primary-300: #93c5fd (Lighter)

Status Colors:
├─ Green-400: #4ade80 (Success/Completed)
├─ Green-500: #22c55e (Success/Active)
├─ Yellow-400: #facc15 (Warning/Pending)
├─ Yellow-500: #eab308 (Warning)
├─ Blue-400: #60a5fa (Info/Assigned)
├─ Purple-400: #c084fc (Info/Progress)
└─ Red-400: #f87171 (Error)

Background Colors:
├─ Dark-bg: #0f172a (Main background)
├─ Slate-300: #cbd5e1 (Light text)
├─ Slate-400: #94a3b8 (Medium text)
├─ Slate-500: #64748b (Dark text)
├─ White/5: rgba(255,255,255,0.05) (Dark cards)
├─ White/10: rgba(255,255,255,0.1) (Hover)
└─ White/20: rgba(255,255,255,0.2) (Borders)
```

## 📱 Responsive Breakpoints

```
Mobile (< 640px)
├─ Sidebar: Hidden (overlay on left)
├─ Toggle button: Visible
├─ Grid: 1 column
├─ Charts: Stacked vertically
└─ Font sizes: Reduced

Tablet (640px - 1024px)
├─ Sidebar: Visible
├─ Grid: 2 columns
├─ Charts: Side by side (if space)
└─ Font sizes: Normal

Desktop (> 1024px)
├─ Sidebar: Sticky left (280px)
├─ Grid: 3-5 columns
├─ Charts: Full width with 2-column layout
└─ Font sizes: Normal to large
```

## 🎬 Animation Timings

```
Container Animations:
├─ staggerContainer: stagger effect
├─ fadeInUp: 0.5s ease-out
├─ fadeInLeft: 0.5s ease-out (sidebar)
└─ fadeInRight: 0.5s ease-out (content)

Component Animations:
├─ Menu items: whileHover={{ x: 4 }}
├─ Buttons: whileHover={{ scale: 1.05 }}
├─ Buttons: whileTap={{ scale: 0.95 }}
├─ Sidebar: transition-transform duration-300
└─ Backdrop: initial={{ opacity: 0 }} → animate={{ opacity: 1 }}

Delays:
├─ Stats cards: 0, 0.1, 0.2, 0.3, 0.4s
└─ Other elements: 0.1-0.3s stagger
```

## 📊 Chart Specifications

### Bar Chart (Monthly Donations)
```
Data Format:
[
  { month: 'Jan', donations: 45000, target: 50000 },
  { month: 'Feb', donations: 52000, target: 50000 },
  ...
]

Display:
├─ Height: 300px
├─ Bars: 2 (donations, target)
├─ X-Axis: Month names
├─ Y-Axis: Currency amount
├─ Grid: Dashed, semi-transparent
├─ Colors: Blue (#3b82f6), Gray (#64748b)
└─ Tooltip: Dark background, border
```

### Pie Chart (Donation Types)
```
Data Format:
[
  { name: 'Money', value: 65 },
  { name: 'Food', value: 20 },
  { name: 'Clothes', value: 10 },
  { name: 'Books', value: 5 }
]

Display:
├─ Height: 300px
├─ Type: Donut (with inner radius)
├─ Colors: [Blue, Green, Orange, Red]
├─ Labels: name + percentage
└─ Tooltip: Dark background, border
```

## 🔄 State Management

```
NGOAdminDashboard States:

currentSection: string
├─ Values: 'dashboard', 'campaigns', 'donations', etc.
└─ Used for: Conditional rendering of sections

ngoStats: object | null
├─ Fields: total_donations, active_campaigns, etc.
└─ Source: api.getNGOStats()

campaigns: array
├─ Fields: campaign_id, title, target_amount, etc.
└─ Source: api.getNGOCampaigns()

sidebarOpen: boolean
├─ Default: true (desktop), false (mobile toggle)
└─ Used for: Sidebar visibility on mobile

searchQuery: string
├─ Default: ''
└─ Used for: Campaign search filtering

filterStatus: string
├─ Values: 'all', 'active', 'pending', 'completed', 'paused'
└─ Used for: Campaign status filtering
```

## 🎯 Interactive Elements

### Buttons
```
Primary Action Button (Create, Submit)
└─ Class: bg-primary-600 text-white hover:bg-primary-700

Secondary Action Button (Export, Filter)
└─ Class: bg-blue-600/20 text-blue-400 hover:bg-blue-600/30

Icon Button (Refresh, Edit, Delete)
└─ Class: p-3 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white

Menu Button (Active)
└─ Class: bg-primary-500/20 text-primary-400 border border-primary-500/30

Menu Button (Inactive)
└─ Class: text-slate-400 hover:text-white hover:bg-white/5
```

### Input Fields
```
Search Input
├─ Icon: FiSearch (left)
├─ Placeholder: "Search campaigns..."
├─ Focus: border-primary-500
└─ Class: pl-11 pr-4

Select Dropdown
├─ Options: All Status, Active, Pending, etc.
├─ Default: 'all'
└─ Focus: border-primary-500
```

### Cards
```
Stat Card
├─ Icon + Gradient background
├─ Title + Value
└─ Animation: fadeInUp with delay

Table Row
├─ Border-bottom: border-white/5
├─ Hover: bg-white/3
└─ Transition: smooth color change

Activity Card
├─ p-4 rounded-xl bg-white/3 border border-white/5
├─ Hover: border-white/10
└─ Transition: smooth border change
```

## 📋 Table Structure

### Campaigns Table
```
Columns:
├─ Campaign Name
├─ Type
├─ Progress (visual bar)
├─ Donations (₹ amount)
├─ Status (badge)
└─ Actions (edit, approve buttons)

Row Features:
├─ Hover effect
├─ Status badge colors
├─ Progress bar animation
└─ Action buttons
```

### Donations Table
```
Columns:
├─ Donor Name
├─ Amount
├─ Campaign
├─ Type
├─ Date
└─ Status (badge)

Features:
├─ Sortable columns
├─ Status color-coded
└─ Responsive overflow-x
```

## 🎓 Key Component Props

### StatCard
```javascript
{
  icon: FiIcon,           // React Icon component
  title: "Total Donations",  // Display title
  value: "₹5,45,000",     // Metric value
  color: "from-blue-500 to-cyan-500",  // Tailwind gradient
  delay: 0                // Animation delay (0.1 * index)
}
```

### Menu Item
```javascript
{
  id: 'dashboard',        // Unique identifier
  label: 'Dashboard',     // Display label
  icon: FiHome,          // React Icon component
  badge: null            // Optional badge count
}
```

---

**Created**: March 17, 2026
**Dashboard Version**: 1.0.0
**Status**: ✅ Production Ready

