// ============================================
// DAANSETU - Application Constants & Mock Data
// ============================================

// ============================================
// NAVIGATION
// ============================================
export const NAVIGATION_LINKS = [
  { name: 'Home', path: '/' },
  { name: 'Campaigns', path: '/campaigns' },
  { name: 'Map', path: '/map' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export const DASHBOARD_NAV_LINKS = {
  admin: [
    { name: 'Overview', path: '/dashboard/admin', icon: '📊' },
    { name: 'Campaigns', path: '/dashboard/admin/campaigns', icon: '🎯' },
    { name: 'Donations', path: '/dashboard/admin/donations', icon: '💰' },
    { name: 'Pickup Requests', path: '/dashboard/admin/pickups', icon: '📦' },
    { name: 'Users', path: '/dashboard/admin/users', icon: '👥' },
    { name: 'Volunteers', path: '/dashboard/admin/volunteers', icon: '🚚' },
    { name: 'Urgent Needs', path: '/dashboard/admin/alerts', icon: '🚨' },
    { name: 'Reports', path: '/dashboard/admin/reports', icon: '📈' },
    { name: 'Settings', path: '/dashboard/admin/settings', icon: '⚙️' },
  ],
  ngo: [
    { name: 'Overview', path: '/dashboard', icon: '📊' },
    { name: 'My Campaigns', path: '/dashboard/campaigns', icon: '🎯' },
    { name: 'Donations', path: '/dashboard/donations', icon: '💰' },
    { name: 'Volunteers', path: '/dashboard/volunteers', icon: '🤝' },
  ],
  donor: [
    { name: 'Overview', path: '/dashboard', icon: '📊' },
    { name: 'My Donations', path: '/dashboard/donations', icon: '💰' },
    { name: 'Receipts', path: '/dashboard/receipts', icon: '🧾' },
    { name: 'Favorites', path: '/dashboard/favorites', icon: '❤️' },
  ],
  volunteer: [
    { name: 'Overview', path: '/dashboard', icon: '📊' },
    { name: 'Opportunities', path: '/dashboard/opportunities', icon: '🤝' },
    { name: 'My Tasks', path: '/dashboard/tasks', icon: '✅' },
    { name: 'Schedule', path: '/dashboard/schedule', icon: '📅' },
  ],
};

// ============================================
// IMAGES
// ============================================
export const CAMPAIGN_IMAGES = [
  'https://picsum.photos/seed/kindwave-campaign-1/1200/800',
  'https://picsum.photos/seed/kindwave-campaign-2/1200/800',
  'https://picsum.photos/seed/kindwave-campaign-3/1200/800',
  'https://picsum.photos/seed/kindwave-campaign-4/1200/800',
  'https://picsum.photos/seed/kindwave-campaign-5/1200/800',
  'https://picsum.photos/seed/kindwave-campaign-6/1200/800',
];

export const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1920&q=85',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1920&q=85',
  'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1920&q=85',
];

export const IMPACT_IMAGES = [
  'https://picsum.photos/seed/kindwave-impact-1/900/600',
  'https://picsum.photos/seed/kindwave-impact-2/900/600',
  'https://picsum.photos/seed/kindwave-impact-3/900/600',
  'https://picsum.photos/seed/kindwave-impact-4/900/600',
];

export const GALLERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=700&q=80',
    alt: 'Volunteers serving food to children at a community meal drive',
    title: 'Mid-Day Meal Support',
    subtitle: 'Daily nutrition for school children',
  },
  {
    src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=700&q=80',
    alt: 'Healthcare volunteer checking blood pressure in a rural medical camp',
    title: 'Rural Health Camp',
    subtitle: 'Free checkups and medicine distribution',
  },
  {
    src: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=700&q=80',
    alt: 'Community volunteers distributing food donation kits',
    title: 'Relief Kit Distribution',
    subtitle: 'Essentials reaching families in need',
  },
  {
    src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=700&q=80',
    alt: 'NGO team and donors standing together for a social impact drive',
    title: 'Donor and NGO Collaboration',
    subtitle: 'Transparent giving, visible impact',
  },
  {
    src: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?auto=format&fit=crop&w=700&q=80',
    alt: 'Students receiving books during an education support event',
    title: 'Education for All',
    subtitle: 'Books and learning kits for students',
  },
  {
    src: 'https://images.unsplash.com/photo-1524069290683-0457abfe42c3?auto=format&fit=crop&w=700&q=80',
    alt: 'Childcare support session run by NGO volunteers',
    title: 'Child Welfare Program',
    subtitle: 'Safe spaces and guided care sessions',
  },
  {
    src: 'https://images.unsplash.com/photo-1518398046578-8cca57782e17?auto=format&fit=crop&w=700&q=80',
    alt: 'People arranging donated clothes and supplies',
    title: 'Clothes Donation Drive',
    subtitle: 'Seasonal clothing support for families',
  },
  {
    src: 'https://images.unsplash.com/photo-1509099863731-ef4bff19e808?auto=format&fit=crop&w=700&q=80',
    alt: 'Volunteer helping beneficiaries at a local community center',
    title: 'Community Outreach',
    subtitle: 'Volunteer-led neighborhood assistance',
  },
];

export const VOLUNTEER_IMAGES = [
  'https://picsum.photos/seed/kindwave-volunteer-1/900/600',
  'https://picsum.photos/seed/kindwave-volunteer-2/900/600',
];

// ============================================
// DONATION TYPES
// ============================================
export const DONATION_TYPES = [
  { value: 'money', label: 'Money', icon: '💰', description: 'Monetary donation via UPI or card' },
  { value: 'food', label: 'Food', icon: '🍲', description: 'Non-perishable food items and groceries' },
  { value: 'clothes', label: 'Clothes', icon: '👕', description: 'Gently used or new clothing items' },
  { value: 'books', label: 'Books', icon: '📚', description: 'Educational books and study materials' },
];

export const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI Payment', icon: '📱', description: 'GPay, PhonePe, Paytm' },
  { id: 'card', label: 'Card Payment', icon: '💳', description: 'Credit / Debit Card' },
];

export const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];

// ============================================
// MOCK CAMPAIGNS DATA
// ============================================
export const MOCK_CAMPAIGNS = [
  {
    campaign_id: 1,
    title: 'Educate Underprivileged Children',
    description: 'Help provide quality education to children in rural areas who lack access to basic schooling facilities. Your donation funds books, teachers, and infrastructure.',
    donation_type: 'money',
    target_amount: 500000,
    collected_amount: 321000,
    start_date: '2024-01-15',
    end_date: '2024-06-30',
    campaign_status: 'active',
    ngo_name: 'Education For All Foundation',
    ngo_id: 1,
    image: CAMPAIGN_IMAGES[0],
    donors_count: 245,
    city: 'Mumbai',
    state: 'Maharashtra',
  },
  {
    campaign_id: 2,
    title: 'Disaster Relief: Flood Victims',
    description: 'Emergency relief for families affected by devastating floods. Your donation provides food, shelter, clean water, and medical aid to those who lost everything.',
    donation_type: 'money',
    target_amount: 1000000,
    collected_amount: 750000,
    start_date: '2024-02-01',
    end_date: '2024-04-30',
    campaign_status: 'active',
    ngo_name: 'Rapid Relief India',
    ngo_id: 2,
    image: CAMPAIGN_IMAGES[1],
    donors_count: 512,
    city: 'New Delhi',
    state: 'Delhi',
  },
  {
    campaign_id: 3,
    title: 'Food for the Hungry',
    description: 'Daily meal programs for homeless and underprivileged communities across major cities. Every meal counts in the fight against hunger.',
    donation_type: 'food',
    target_amount: 300000,
    collected_amount: 180000,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    campaign_status: 'active',
    ngo_name: 'Feed India Movement',
    ngo_id: 3,
    image: CAMPAIGN_IMAGES[2],
    donors_count: 189,
    city: 'Bangalore',
    state: 'Karnataka',
  },
  {
    campaign_id: 4,
    title: 'Clean Water Initiative',
    description: 'Installing water purification systems in villages lacking access to clean drinking water. Safe water is a basic human right.',
    donation_type: 'money',
    target_amount: 800000,
    collected_amount: 420000,
    start_date: '2024-03-01',
    end_date: '2024-09-30',
    campaign_status: 'active',
    ngo_name: 'WaterAid India',
    ngo_id: 4,
    image: CAMPAIGN_IMAGES[3],
    donors_count: 334,
    city: 'Chennai',
    state: 'Tamil Nadu',
  },
  {
    campaign_id: 5,
    title: 'Winter Clothing Drive',
    description: 'Collecting warm clothes for people living in extreme cold without proper winter wear. Keep someone warm this winter.',
    donation_type: 'clothes',
    target_amount: 200000,
    collected_amount: 95000,
    start_date: '2024-10-01',
    end_date: '2025-02-28',
    campaign_status: 'active',
    ngo_name: 'Warmth Foundation',
    ngo_id: 6,
    image: CAMPAIGN_IMAGES[4],
    donors_count: 156,
    city: 'Jaipur',
    state: 'Rajasthan',
  },
  {
    campaign_id: 6,
    title: 'Medical Aid for Rural Areas',
    description: 'Providing essential medicines and healthcare services to remote villages with no hospital access. Health is wealth.',
    donation_type: 'medicine',
    target_amount: 600000,
    collected_amount: 310000,
    start_date: '2024-02-15',
    end_date: '2024-08-15',
    campaign_status: 'active',
    ngo_name: 'Health First NGO',
    ngo_id: 5,
    image: CAMPAIGN_IMAGES[5],
    donors_count: 278,
    city: 'Kolkata',
    state: 'West Bengal',
  },
];

// ============================================
// MOCK STATS
// ============================================
export const MOCK_STATS = {
  total_donations: 1245000,
  active_campaigns: 27,
  ngos_registered: 58,
  total_users: 4210,
  children_educated: 5200,
  meals_served: 32000,
  projects_completed: 850,
  volunteers_active: 320,
};

// ============================================
// MOCK DONATION HISTORY
// ============================================
export const MOCK_DONATION_HISTORY = [
  {
    id: 1,
    donation_id: 'DON-10045',
    campaign: 'Support Child Education',
    campaign_id: 1,
    ngo_name: 'Education For All Foundation',
    amount: 10000,
    date: '2024-03-15',
    status: 'completed',
    type: 'money',
    payment_method: 'upi',
    receipt_number: 'REC-2024031501',
    transaction_id: 'TXN789456123',
  },
  {
    id: 2,
    donation_id: 'DON-10032',
    campaign: 'Flood Relief Fund',
    campaign_id: 2,
    ngo_name: 'Rapid Relief India',
    amount: 5000,
    date: '2024-03-10',
    status: 'completed',
    type: 'money',
    payment_method: 'card',
    receipt_number: 'REC-2024031001',
    transaction_id: 'TXN456789012',
  },
  {
    id: 3,
    donation_id: 'DON-10021',
    campaign: 'Food Drive',
    campaign_id: 3,
    ngo_name: 'Feed India Movement',
    amount: 2500,
    date: '2024-03-05',
    status: 'pending',
    type: 'food',
    payment_method: 'upi',
    receipt_number: 'REC-2024030501',
    transaction_id: 'TXN123456789',
  },
  {
    id: 4,
    donation_id: 'DON-10015',
    campaign: 'Winter Clothing Drive',
    campaign_id: 5,
    ngo_name: 'Warmth Foundation',
    amount: 3000,
    date: '2024-02-28',
    status: 'completed',
    type: 'clothes',
    payment_method: 'bank',
    receipt_number: 'REC-2024022801',
    transaction_id: 'TXN987654321',
  },
  {
    id: 5,
    donation_id: 'DON-10008',
    campaign: 'Medical Aid Rural',
    campaign_id: 6,
    ngo_name: 'Health First NGO',
    amount: 7500,
    date: '2024-02-20',
    status: 'completed',
    type: 'money',
    payment_method: 'upi',
    receipt_number: 'REC-2024022001',
    transaction_id: 'TXN654321987',
  },
];

// ============================================
// MOCK PICKUP HISTORY
// ============================================
export const MOCK_PICKUP_HISTORY = [
  {
    id: 1,
    pickup_id: 'PKP-10023',
    items: ['clothes', 'books'],
    date: '2024-03-12',
    time_slot: '10:00 AM - 12:00 PM',
    status: 'completed',
    address: '42, Andheri West, Mumbai',
    volunteer_name: 'Rahul M.',
  },
  {
    id: 2,
    pickup_id: 'PKP-10019',
    items: ['food', 'medicine'],
    date: '2024-03-18',
    time_slot: '2:00 PM - 4:00 PM',
    status: 'scheduled',
    address: '15, Bandra East, Mumbai',
    volunteer_name: 'Pending Assignment',
  },
];

// ============================================
// CHATBOT RESPONSES
// ============================================
export const CHATBOT_RESPONSES = {
  greeting: "Hello! 👋 I'm KindWave Bot, your donation assistant. How can I help you today?",
  donate: "You can donate by visiting any active campaign and clicking 'Donate Now'. We accept UPI, bank transfer, and card payments. For physical donations, use our pickup scheduling feature!",
  campaigns: "We have multiple active campaigns across education, healthcare, disaster relief, and more. Visit our Campaigns page or explore the Map to find causes near you!",
  receipt: "Tax receipts (80G) are automatically generated after successful donations. You can find them in your Donor Dashboard under 'Donation History'. Each receipt includes a QR code for verification.",
  volunteer: "To volunteer, register as a volunteer on our platform. You'll find available opportunities in your Volunteer Dashboard. We need help with pickups, distribution, and events!",
  ngo: "NGOs can register on our platform to create campaigns and manage donations. All NGOs are verified before activation. Visit the registration page to get started.",
  map: "Our interactive map shows all verified NGOs, active campaigns, and pickup centers across India. Visit the Map page to explore organizations near you!",
  pickup: "For physical donations (clothes, food, books, etc.), you can schedule a volunteer pickup from your location. Select your items, pick a date/time, and we'll send someone to collect them!",
  tax: "All monetary donations on KindWave are eligible for tax deduction under Section 80G of the Income Tax Act. Your receipt is auto-generated with all required details for tax filing.",
  track: "You can track all your donations in real-time from your Dashboard. Each donation shows its current status, receipt, and the campaign's overall progress.",
  default: "I'm not sure I understand. Could you try asking about donations, campaigns, receipts, volunteering, NGO registration, maps, pickup scheduling, or tax benefits?",
};

// ============================================
// TIME SLOTS FOR PICKUP
// ============================================
export const TIME_SLOTS = [
  '9:00 AM - 11:00 AM',
  '11:00 AM - 1:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
];

// ============================================
// ITEM CATEGORIES FOR PHYSICAL DONATION
// ============================================
export const ITEM_CATEGORIES = [
  { value: 'clothes', label: 'Clothes', icon: '👕' },
  { value: 'food', label: 'Food', icon: '🍲' },
  { value: 'books', label: 'Books', icon: '📚' },
];

// ============================================
// APP METADATA
// ============================================
export const APP_CONFIG = {
  name: 'KindWave',
  tagline: 'Make a Difference, Change Lives',
  description: 'Transparent donation platform connecting donors with verified NGOs across India.',
  url: 'https://kindwave.org',
  email: 'support@kindwave.org',
  phone: '+91 98765 43210',
  address: 'Mumbai, Maharashtra, India',
  social: {
    facebook: 'https://facebook.com/kindwave',
    twitter: 'https://twitter.com/kindwave',
    instagram: 'https://instagram.com/kindwave',
    linkedin: 'https://linkedin.com/company/kindwave',
    youtube: 'https://youtube.com/kindwave',
  },
  legal: {
    cin: 'U85100MH2024NPL123456',
    pan: 'AABCD1234E',
    section80g: '80G/2024/KindWave/001',
  },
};
