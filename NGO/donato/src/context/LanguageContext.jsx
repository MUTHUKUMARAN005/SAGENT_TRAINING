import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext(null);

// ============================================
// TRANSLATION DICTIONARIES
// ============================================
const translations = {
  // ==========================================
  // ENGLISH
  // ==========================================
  en: {
    // -- Common --
    app_name: 'KindWave',
    app_tagline: 'Make a Difference, Change Lives',
    loading: 'Loading...',
    search: 'Search',
    filter: 'Filter',
    view_all: 'View All',
    learn_more: 'Learn More',
    submit: 'Submit',
    cancel: 'Cancel',
    back: 'Back',
    next: 'Next',
    confirm: 'Confirm',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    share: 'Share',
    download: 'Download',
    print: 'Print',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    state: 'State',
    country: 'India',
    status: 'Status',
    date: 'Date',
    amount: 'Amount',
    total: 'Total',
    active: 'Active',
    completed: 'Completed',
    pending: 'Pending',
    verified: 'Verified',
    anonymous: 'Anonymous',
    optional: 'optional',
    required: 'required',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    no_results: 'No results found',
    try_again: 'Try Again',
    go_home: 'Go Home',
    go_back: 'Go Back',

    // -- Navigation --
    nav_home: 'Home',
    nav_campaigns: 'Campaigns',
    nav_map: 'Map',
    nav_about: 'About',
    nav_contact: 'Contact',
    nav_dashboard: 'Dashboard',
    nav_login: 'Sign In',
    nav_register: 'Get Started',
    nav_logout: 'Logout',
    nav_profile: 'Profile',

    // -- Hero Section --
    hero_title_1: 'Make a',
    hero_title_2: 'Difference',
    hero_title_3: 'Change',
    hero_type_1: 'Lives',
    hero_type_2: 'Communities',
    hero_type_3: 'Futures',
    hero_type_4: 'the World',
    hero_description: 'Donate seamlessly to verified campaigns. Track every rupee. See the real impact of your generosity through our transparent platform.',
    hero_cta_donate: 'Donate Now',
    hero_cta_how: 'See How It Works',
    hero_badge: 'Trusted by 4,200+ donors across India',
    hero_stat_donated: 'Donated',
    hero_stat_donors: 'Donors',
    hero_stat_ngos: 'NGOs',

    // -- Featured Campaigns --
    featured_badge: 'Featured Campaigns',
    featured_title: 'Support Causes That',
    featured_title_highlight: 'Matter',
    featured_description: 'Every donation creates ripples of change. Browse verified campaigns and contribute to causes close to your heart.',
    featured_view_all: 'View All Campaigns',
    featured_raised: 'raised',
    featured_goal: 'Goal',
    featured_donors: 'donors',
    featured_days_left: 'days left',
    featured_donate: 'Donate',

    // -- Impact Section --
    impact_badge: 'Our Impact',
    impact_title: 'Real Change,',
    impact_title_highlight: 'Real Numbers',
    impact_description: 'See how thousands of donors have transformed lives through KindWave\'s transparent and impactful donation platform.',
    impact_children: 'Children Educated',
    impact_meals: 'Meals Served',
    impact_projects: 'Projects Completed',
    impact_ngos: 'Partner NGOs',

    // -- Stats --
    stats_donations: 'Total Donations',
    stats_campaigns: 'Active Campaigns',
    stats_verified: 'Verified NGOs',
    stats_donors: 'Happy Donors',

    // -- Map --
    map_badge: 'Explore on Map',
    map_title: 'Find NGOs',
    map_title_highlight: 'Near You',
    map_description: 'Discover verified NGOs, ongoing campaigns, and donation centers across India on our interactive map.',
    map_explore: 'Explore Full Map',
    map_ngo_locations: 'NGO Locations',
    map_pickup_centers: 'Pickup Centers',
    map_campaign_areas: 'Campaign Areas',
    map_legend: 'Legend',
    map_search_placeholder: 'Search NGOs, cities, states...',
    map_layers: 'Map Layers',
    map_reset: 'Reset View',
    map_locate: 'Find my location',
    map_showing: 'Showing',
    map_ngos_in: 'NGOs in',

    // -- Gallery --
    gallery_badge: 'Our Gallery',
    gallery_title: 'Moments of',
    gallery_title_highlight: 'Impact',

    // -- Testimonials --
    testimonials_badge: 'Testimonials',
    testimonials_title: 'What People',
    testimonials_title_highlight: 'Say',

    // -- Campaigns Page --
    campaigns_title: 'Browse',
    campaigns_title_highlight: 'Campaigns',
    campaigns_description: 'Find verified campaigns and make your contribution count',
    campaigns_showing: 'Showing',
    campaigns_of: 'of',
    campaigns_all: 'All',
    campaigns_no_found: 'No campaigns found',
    campaigns_no_found_desc: 'Try adjusting your search or filter criteria',
    campaigns_clear: 'Clear All Filters',

    // -- Donation --
    donate_title: 'Donate to Campaign',
    donate_select_amount: 'Select Amount',
    donate_custom_amount: 'Enter custom amount',
    donate_type: 'Donation Type',
    donate_message: 'Message',
    donate_message_placeholder: 'Add a personal message to the campaign...',
    donate_anonymous: 'Donate anonymously (your name won\'t be shown publicly)',
    donate_continue: 'Continue to Payment',
    donate_payment_title: 'Payment Details',
    donate_payment_method: 'Payment Method',
    donate_upi_scan: 'Scan to Pay via UPI',
    donate_upi_txn: 'UPI Transaction ID',
    donate_upi_txn_placeholder: 'Enter 12-digit transaction ID',
    donate_screenshot: 'Upload Payment Screenshot',
    donate_pan: 'PAN Number (optional — for 80G tax receipt)',
    donate_confirm: 'Confirm Donation',
    donate_processing: 'Processing...',
    donate_success_title: 'Donation Successful!',
    donate_success_subtitle: 'Thank you for your generous contribution',
    donate_success_amount: 'Amount Donated',
    donate_success_impact: 'Your donation makes a real difference!',
    donate_success_tax: 'Eligible for tax deduction under Section 80G',
    donate_view_receipt: 'View Receipt',
    donate_donate_again: 'Donate Again',
    donate_browse_more: '← Browse More Campaigns',
    donate_security: 'Your payment information is encrypted and secure',
    donate_min_amount: 'Minimum donation amount is ₹10',
    donate_physical_title: 'Schedule a Pickup',
    donate_physical_desc: 'Select your location on the map and schedule a volunteer pickup for your physical donation items.',
    donate_monetary: 'Monetary Donation',
    donate_physical: 'Physical Donation',

    // -- Receipt --
    receipt_title: 'Donation Receipt',
    receipt_tax: 'TAX RECEIPT',
    receipt_80g: '80G Eligible',
    receipt_donor_info: 'Donor Information',
    receipt_donation_info: 'Donation Details',
    receipt_total: 'Total Amount',
    receipt_verified: 'Payment Verified & Confirmed',
    receipt_tax_info: 'Tax Deduction Information',
    receipt_tax_desc: 'This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.',
    receipt_computer_generated: 'This is a computer-generated receipt. No signature is required.',
    receipt_download_pdf: 'Download PDF',
    receipt_number: 'Receipt No.',
    receipt_campaign: 'Campaign',
    receipt_ngo: 'NGO',
    receipt_type: 'Type',
    receipt_payment: 'Payment',
    receipt_transaction: 'Transaction ID',
    receipt_name: 'Name',
    receipt_email: 'Email',
    receipt_phone: 'Phone',
    receipt_pan: 'PAN',

    // -- Dashboard --
    dashboard_welcome: 'Welcome back,',
    dashboard_admin: 'Admin Dashboard',
    dashboard_admin_desc: 'Monitor platform activity and manage operations',
    dashboard_ngo: 'NGO Dashboard',
    dashboard_ngo_desc: 'Manage campaigns and track donations',
    dashboard_donor: 'Donor Dashboard',
    dashboard_donor_desc: 'Track your contributions, view receipts, and discover new campaigns',
    dashboard_volunteer: 'Volunteer Dashboard',
    dashboard_volunteer_desc: 'Track your volunteer activities and find opportunities',
    dashboard_impact_title: 'Your Impact This Month',
    dashboard_donate_again: 'Donate Again',
    dashboard_explore_map: 'Explore Map',
    dashboard_view_receipt: 'View Latest Receipt',
    dashboard_tax_receipts: 'Tax Receipts',
    dashboard_pickup_history: 'Pickup History',
    dashboard_donation_history: 'Donation History',
    dashboard_recommended: 'Recommended for You',
    dashboard_nearby: 'NGOs Near You',
    dashboard_breakdown: 'Your Donation Breakdown',
    dashboard_quick_tip: 'Quick Tip:',
    dashboard_recurring_tip: 'Set up monthly recurring donations to maximize your impact!',
    dashboard_browse_all: 'Browse All Campaigns',
    dashboard_total: 'Total Donated',
    dashboard_campaigns: 'Campaigns Supported',
    dashboard_impact_score: 'Impact Score',
    dashboard_rank: 'Donor Rank',
    dashboard_opportunities: 'Opportunities Applied',
    dashboard_events: 'Events Attended',
    dashboard_hours: 'Hours Volunteered',
    dashboard_volunteer_opp: 'Volunteer Opportunities',

    // -- Blockchain --
    blockchain_badge: 'Blockchain Verified',
    blockchain_title: 'Transparent Donation',
    blockchain_title_highlight: 'Tracking',
    blockchain_description: 'Every donation is recorded on an immutable blockchain ledger. Track your donation journey from wallet to impact with full transparency.',
    blockchain_view_chain: 'View on Blockchain',
    blockchain_hash: 'Transaction Hash',
    blockchain_block: 'Block Number',
    blockchain_timestamp: 'Timestamp',
    blockchain_from: 'From',
    blockchain_to: 'To',
    blockchain_status: 'Status',
    blockchain_confirmed: 'Confirmed',
    blockchain_pending: 'Pending',
    blockchain_trail: 'Donation Trail',
    blockchain_donated: 'Donated',
    blockchain_received: 'Received by NGO',
    blockchain_allocated: 'Allocated to Campaign',
    blockchain_utilized: 'Utilized for Beneficiaries',
    blockchain_verified_on: 'Verified on chain',
    blockchain_smart_contract: 'Smart Contract',
    blockchain_immutable: 'Immutable Record',
    blockchain_transparent: '100% Transparent',
    blockchain_total_tracked: 'Total Tracked',
    blockchain_transactions: 'Transactions',
    blockchain_donors_tracked: 'Donors Tracked',

    // -- AR Visualization --
    ar_badge: 'AR Experience',
    ar_title: 'See Your Impact in',
    ar_title_highlight: 'Augmented Reality',
    ar_description: 'Point your camera at your surroundings to visualize where your donations go and the real-world impact they create.',
    ar_launch: 'Launch AR Experience',
    ar_not_supported: 'AR is not supported on this device',
    ar_loading: 'Loading AR Experience...',
    ar_scan: 'Scan your surroundings',
    ar_impact_marker: 'Impact Marker',
    ar_donation_flow: 'Donation Flow',
    ar_beneficiary: 'Beneficiary',
    ar_total_impact: 'Total Impact',
    ar_children_helped: 'children helped in this area',
    ar_meals_provided: 'meals provided this month',
    ar_view_details: 'View Details',

    // -- Carbon Footprint --
    carbon_badge: 'Environmental Impact',
    carbon_title: 'Your Green',
    carbon_title_highlight: 'Footprint',
    carbon_description: 'Track the environmental impact of your donations. See how your contributions help reduce carbon emissions and protect the planet.',
    carbon_saved: 'Carbon Saved',
    carbon_trees: 'Trees Equivalent',
    carbon_water: 'Water Saved (L)',
    carbon_energy: 'Energy Saved (kWh)',
    carbon_offset: 'Carbon Offset',
    carbon_total_saved: 'Total CO₂ Saved',
    carbon_this_month: 'This Month',
    carbon_this_year: 'This Year',
    carbon_all_time: 'All Time',
    carbon_kg: 'kg CO₂',
    carbon_breakdown: 'Impact Breakdown',
    carbon_food_waste: 'Food Waste Prevented',
    carbon_clothing_reuse: 'Clothing Reused',
    carbon_education: 'Digital Education (Paper Saved)',
    carbon_transport: 'Efficient Transport',
    carbon_equivalent: 'Equivalent to',
    carbon_car_trips: 'car trips saved',
    carbon_tree_planted: 'trees planted',
    carbon_plastic_bottles: 'plastic bottles recycled',
    carbon_tips: 'Green Tips',
    carbon_tip_1: 'Donate used items instead of discarding them',
    carbon_tip_2: 'Choose local NGOs to reduce transport emissions',
    carbon_tip_3: 'Opt for digital receipts to save paper',

    // -- Pickup --
    pickup_title: 'Select Pickup Location',
    pickup_desc: 'Click on the map to set your pickup address or use current location',
    pickup_current: 'Use My Current Location',
    pickup_address: 'Selected Address',
    pickup_fetching: 'Fetching address...',
    pickup_items: 'What are you donating?',
    pickup_schedule: 'Schedule Pickup',
    pickup_date: 'Pickup Date',
    pickup_time: 'Preferred Time Slot',
    pickup_contact: 'Contact Phone',
    pickup_notes: 'Special Notes',
    pickup_notes_placeholder: 'Any special instructions for pickup...',
    pickup_summary: 'Pickup Summary',
    pickup_confirm: 'Confirm Pickup',
    pickup_success: 'Pickup Scheduled!',
    pickup_success_desc: 'Our volunteer will arrive at your location on the scheduled date and time.',
    pickup_another: 'Schedule Another Pickup',

    // -- Auth --
    auth_login_title: 'Welcome Back',
    auth_login_desc: 'Sign in to continue making a difference',
    auth_register_title: 'Create Account',
    auth_register_desc: 'Join the community of givers',
    auth_email: 'Email Address',
    auth_password: 'Password',
    auth_name: 'Full Name',
    auth_remember: 'Remember me',
    auth_forgot: 'Forgot password?',
    auth_signin: 'Sign In',
    auth_signup: 'Create Account',
    auth_or: 'or continue with',
    auth_google: 'Google',
    auth_no_account: "Don't have an account?",
    auth_has_account: 'Already have an account?',
    auth_role_donor: 'Donor',
    auth_role_volunteer: 'Volunteer',
    auth_role_ngo: 'NGO',

    // -- About --
    about_badge: 'About KindWave',
    about_title_1: 'Bridging the Gap Between',
    about_title_2: 'Givers & Receivers',
    about_description: 'KindWave (Bridge of Giving) is a transparent digital platform that connects compassionate donors with verified NGOs and meaningful causes across India.',
    about_values_title: 'Our',
    about_values_highlight: 'Values',
    about_team_title: 'Meet Our',
    about_team_highlight: 'Team',
    about_transparency: 'Transparency',
    about_accountability: 'Accountability',
    about_compassion: 'Compassion',
    about_community: 'Community',
    about_impact: 'Impact',
    about_trust: 'Trust',

    // -- Contact --
    contact_badge: 'Contact Us',
    contact_title: 'Get In',
    contact_title_highlight: 'Touch',
    contact_description: "Have questions or need help? We'd love to hear from you.",
    contact_name: 'Your Name',
    contact_email: 'Email',
    contact_subject: 'Subject',
    contact_message: 'Message',
    contact_send: 'Send Message',
    contact_sent: 'Message sent successfully!',
    contact_quick_help: 'Quick Help',

    // -- Footer --
    footer_cta_title: 'Ready to Make a',
    footer_cta_highlight: 'Difference',
    footer_cta_desc: 'Join thousands of donors and volunteers creating positive change across India.',
    footer_start_donating: 'Start Donating',
    footer_become_volunteer: 'Become a Volunteer',
    footer_platform: 'Platform',
    footer_for_donors: 'For Donors',
    footer_for_ngos: 'For NGOs',
    footer_rights: 'All rights reserved.',
    footer_made_with: 'Made with',
    footer_in: 'in India',

    // -- 404 --
    not_found_title: 'Page Not Found',
    not_found_desc: "The page you're looking for doesn't exist or has been moved.",
    not_found_browse: 'Browse Campaigns',

    // -- ChatBot --
    chatbot_name: 'KindWave Bot',
    chatbot_online: 'Online',
    chatbot_placeholder: 'Type a message...',
    chatbot_quick_donate: 'How to donate?',
    chatbot_quick_campaigns: 'View campaigns',
    chatbot_quick_receipt: 'Get receipt',
    chatbot_quick_volunteer: 'Volunteer',
  },

  // ==========================================
  // HINDI (हिंदी)
  // ==========================================
  hi: {
    // -- Common --
    app_name: 'दानसेतु',
    app_tagline: 'बदलाव लाएं, जीवन बदलें',
    loading: 'लोड हो रहा है...',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    view_all: 'सभी देखें',
    learn_more: 'और जानें',
    submit: 'जमा करें',
    cancel: 'रद्द करें',
    back: 'वापस',
    next: 'अगला',
    confirm: 'पुष्टि करें',
    close: 'बंद करें',
    save: 'सहेजें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    share: 'साझा करें',
    download: 'डाउनलोड',
    print: 'प्रिंट',
    email: 'ईमेल',
    phone: 'फ़ोन',
    address: 'पता',
    city: 'शहर',
    state: 'राज्य',
    country: 'भारत',
    status: 'स्थिति',
    date: 'तारीख',
    amount: 'राशि',
    total: 'कुल',
    active: 'सक्रिय',
    completed: 'पूर्ण',
    pending: 'लंबित',
    verified: 'सत्यापित',
    anonymous: 'गुमनाम',
    optional: 'वैकल्पिक',
    required: 'आवश्यक',
    success: 'सफलता',
    error: 'त्रुटि',
    warning: 'चेतावनी',
    no_results: 'कोई परिणाम नहीं मिला',
    try_again: 'पुनः प्रयास करें',
    go_home: 'होम जाएं',
    go_back: 'वापस जाएं',

    // -- Navigation --
    nav_home: 'होम',
    nav_campaigns: 'अभियान',
    nav_map: 'मानचित्र',
    nav_about: 'हमारे बारे में',
    nav_contact: 'संपर्क',
    nav_dashboard: 'डैशबोर्ड',
    nav_login: 'साइन इन',
    nav_register: 'शुरू करें',
    nav_logout: 'लॉग आउट',
    nav_profile: 'प्रोफ़ाइल',

    // -- Hero --
    hero_title_1: 'एक',
    hero_title_2: 'बदलाव',
    hero_title_3: 'लाएं',
    hero_type_1: 'जीवन में',
    hero_type_2: 'समुदायों में',
    hero_type_3: 'भविष्य में',
    hero_type_4: 'दुनिया में',
    hero_description: 'सत्यापित अभियानों में सहजता से दान करें। हर रुपये को ट्रैक करें। हमारे पारदर्शी प्लेटफ़ॉर्म के माध्यम से अपनी उदारता का वास्तविक प्रभाव देखें।',
    hero_cta_donate: 'अभी दान करें',
    hero_cta_how: 'कैसे काम करता है देखें',
    hero_badge: 'भारत भर में 4,200+ दानदाताओं द्वारा विश्वसनीय',
    hero_stat_donated: 'दान किया',
    hero_stat_donors: 'दानदाता',
    hero_stat_ngos: 'एनजीओ',

    // -- Featured Campaigns --
    featured_badge: 'प्रमुख अभियान',
    featured_title: 'उन कारणों का समर्थन करें जो',
    featured_title_highlight: 'मायने रखते हैं',
    featured_description: 'हर दान बदलाव की लहरें पैदा करता है। सत्यापित अभियान ब्राउज़ करें और अपने दिल के करीब के कारणों में योगदान दें।',
    featured_view_all: 'सभी अभियान देखें',
    featured_raised: 'एकत्र',
    featured_goal: 'लक्ष्य',
    featured_donors: 'दानदाता',
    featured_days_left: 'दिन शेष',
    featured_donate: 'दान करें',

    // -- Impact --
    impact_badge: 'हमारा प्रभाव',
    impact_title: 'वास्तविक बदलाव,',
    impact_title_highlight: 'वास्तविक संख्या',
    impact_description: 'देखें कि हजारों दानदाताओं ने दानसेतु के पारदर्शी और प्रभावशाली दान प्लेटफ़ॉर्म के माध्यम से कैसे जीवन बदला है।',
    impact_children: 'शिक्षित बच्चे',
    impact_meals: 'भोजन परोसे',
    impact_projects: 'परियोजनाएं पूर्ण',
    impact_ngos: 'साझेदार एनजीओ',

    // -- Stats --
    stats_donations: 'कुल दान',
    stats_campaigns: 'सक्रिय अभियान',
    stats_verified: 'सत्यापित एनजीओ',
    stats_donors: 'खुश दानदाता',

    // -- Donation --
    donate_title: 'अभियान में दान करें',
    donate_select_amount: 'राशि चुनें',
    donate_custom_amount: 'कस्टम राशि दर्ज करें',
    donate_type: 'दान का प्रकार',
    donate_message: 'संदेश',
    donate_message_placeholder: 'अभियान के लिए एक व्यक्तिगत संदेश जोड़ें...',
    donate_anonymous: 'गुमनाम रूप से दान करें',
    donate_continue: 'भुगतान जारी रखें',
    donate_payment_title: 'भुगतान विवरण',
    donate_payment_method: 'भुगतान विधि',
    donate_upi_scan: 'UPI से भुगतान के लिए स्कैन करें',
    donate_upi_txn: 'UPI ट्रांजैक्शन आईडी',
    donate_confirm: 'दान की पुष्टि करें',
    donate_processing: 'प्रोसेसिंग...',
    donate_success_title: 'दान सफल!',
    donate_success_subtitle: 'आपके उदार योगदान के लिए धन्यवाद',
    donate_success_amount: 'दान की गई राशि',
    donate_view_receipt: 'रसीद देखें',
    donate_donate_again: 'फिर से दान करें',
    donate_monetary: 'मौद्रिक दान',
    donate_physical: 'वस्तु दान',

    // -- Receipt --
    receipt_title: 'दान रसीद',
    receipt_tax: 'कर रसीद',
    receipt_80g: '80G पात्र',
    receipt_donor_info: 'दानदाता जानकारी',
    receipt_donation_info: 'दान विवरण',
    receipt_total: 'कुल राशि',
    receipt_verified: 'भुगतान सत्यापित और पुष्टि',
    receipt_download_pdf: 'PDF डाउनलोड करें',

    // -- Blockchain --
    blockchain_badge: 'ब्लॉकचेन सत्यापित',
    blockchain_title: 'पारदर्शी दान',
    blockchain_title_highlight: 'ट्रैकिंग',
    blockchain_description: 'हर दान एक अपरिवर्तनीय ब्लॉकचेन लेज़र पर दर्ज किया जाता है। पूर्ण पारदर्शिता के साथ अपनी दान यात्रा को ट्रैक करें।',
    blockchain_trail: 'दान मार्ग',
    blockchain_donated: 'दान किया',
    blockchain_received: 'एनजीओ द्वारा प्राप्त',
    blockchain_allocated: 'अभियान में आवंटित',
    blockchain_utilized: 'लाभार्थियों के लिए उपयोग',
    blockchain_transparent: '100% पारदर्शी',

    // -- Carbon --
    carbon_badge: 'पर्यावरणीय प्रभाव',
    carbon_title: 'आपका हरित',
    carbon_title_highlight: 'पदचिह्न',
    carbon_description: 'अपने दान के पर्यावरणीय प्रभाव को ट्रैक करें।',
    carbon_saved: 'कार्बन बचाया',
    carbon_trees: 'पेड़ समकक्ष',
    carbon_water: 'पानी बचाया (ली)',
    carbon_energy: 'ऊर्जा बचाई',

    // -- AR --
    ar_badge: 'AR अनुभव',
    ar_title: 'अपने प्रभाव को देखें',
    ar_title_highlight: 'संवर्धित वास्तविकता में',
    ar_description: 'अपने कैमरे को अपने आसपास की ओर इंगित करें ताकि आप देख सकें कि आपका दान कहाँ जाता है।',
    ar_launch: 'AR अनुभव शुरू करें',

    // -- Footer --
    footer_cta_title: 'क्या आप',
    footer_cta_highlight: 'बदलाव',
    footer_cta_desc: 'भारत भर में सकारात्मक बदलाव ला रहे हजारों दानदाताओं और स्वयंसेवकों से जुड़ें।',
    footer_start_donating: 'दान शुरू करें',
    footer_become_volunteer: 'स्वयंसेवक बनें',

    // -- Auth --
    auth_login_title: 'वापसी पर स्वागत',
    auth_login_desc: 'बदलाव लाने के लिए साइन इन करें',
    auth_register_title: 'खाता बनाएं',
    auth_register_desc: 'दानदाताओं के समुदाय में शामिल हों',
    auth_signin: 'साइन इन',
    auth_signup: 'खाता बनाएं',

    // -- Dashboard --
    dashboard_welcome: 'वापसी पर स्वागत,',
    dashboard_donor: 'दानदाता डैशबोर्ड',
    dashboard_donor_desc: 'अपने योगदान को ट्रैक करें, रसीदें देखें और नए अभियान खोजें',
    dashboard_impact_title: 'इस महीने आपका प्रभाव',
    dashboard_donate_again: 'फिर से दान करें',
    dashboard_explore_map: 'मानचित्र देखें',
    dashboard_donation_history: 'दान इतिहास',
    dashboard_recommended: 'आपके लिए अनुशंसित',
    dashboard_nearby: 'आपके पास एनजीओ',
    dashboard_total: 'कुल दान',
    dashboard_campaigns: 'समर्थित अभियान',
    dashboard_browse_all: 'सभी अभियान देखें',

    // -- Contact --
    contact_badge: 'संपर्क करें',
    contact_title: 'संपर्क',
    contact_title_highlight: 'करें',
    contact_send: 'संदेश भेजें',

    // -- About --
    about_badge: 'दानसेतु के बारे में',
    about_title_1: 'देने वालों और',
    about_title_2: 'पाने वालों के बीच सेतु',

    // -- 404 --
    not_found_title: 'पृष्ठ नहीं मिला',
    not_found_desc: 'आप जिस पृष्ठ को ढूंढ रहे हैं वह मौजूद नहीं है।',
  },

  // ==========================================
  // TAMIL (தமிழ்)
  // ==========================================
  ta: {
    // -- Common --
    app_name: 'தான்சேது',
    app_tagline: 'மாற்றத்தை உருவாக்குங்கள், வாழ்க்கையை மாற்றுங்கள்',
    loading: 'ஏற்றுகிறது...',
    search: 'தேடுங்கள்',
    filter: 'வடிகட்டி',
    view_all: 'அனைத்தும் காண',
    learn_more: 'மேலும் அறிய',
    submit: 'சமர்ப்பிக்க',
    cancel: 'ரத்து செய்',
    back: 'பின்',
    next: 'அடுத்து',
    confirm: 'உறுதிப்படுத்து',
    close: 'மூடு',
    save: 'சேமி',
    share: 'பகிர்',
    download: 'பதிவிறக்கம்',
    print: 'அச்சிடு',
    email: 'மின்னஞ்சல்',
    phone: 'தொலைபேசி',
    address: 'முகவரி',
    city: 'நகரம்',
    state: 'மாநிலம்',
    country: 'இந்தியா',
    status: 'நிலை',
    date: 'தேதி',
    amount: 'தொகை',
    total: 'மொத்தம்',
    active: 'செயலில்',
    completed: 'நிறைவு',
    pending: 'நிலுவை',
    verified: 'சரிபார்க்கப்பட்டது',
    anonymous: 'அநாமதேயம்',
    success: 'வெற்றி',
    error: 'பிழை',
    no_results: 'முடிவுகள் இல்லை',
    try_again: 'மீண்டும் முயற்சிக்கவும்',
    go_home: 'முகப்புக்குச் செல்',
    go_back: 'பின் செல்',

    // -- Navigation --
    nav_home: 'முகப்பு',
    nav_campaigns: 'பிரச்சாரங்கள்',
    nav_map: 'வரைபடம்',
    nav_about: 'எங்களைப் பற்றி',
    nav_contact: 'தொடர்பு',
    nav_dashboard: 'கட்டுப்பாட்டுப் பலகை',
    nav_login: 'உள்நுழை',
    nav_register: 'தொடங்குங்கள்',
    nav_logout: 'வெளியேறு',

    // -- Hero --
    hero_title_1: 'ஒரு',
    hero_title_2: 'மாற்றத்தை',
    hero_title_3: 'உருவாக்குங்கள்',
    hero_type_1: 'வாழ்க்கையில்',
    hero_type_2: 'சமூகங்களில்',
    hero_type_3: 'எதிர்காலத்தில்',
    hero_type_4: 'உலகில்',
    hero_description: 'சரிபார்க்கப்பட்ட பிரச்சாரங்களுக்கு எளிதாக நன்கொடை அளியுங்கள். ஒவ்வொரு ரூபாயையும் கண்காணியுங்கள்.',
    hero_cta_donate: 'இப்போது நன்கொடை',
    hero_cta_how: 'எப்படி என்று பாருங்கள்',
    hero_badge: 'இந்தியா முழுவதும் 4,200+ நன்கொடையாளர்களால் நம்பகமானது',

    // -- Featured --
    featured_badge: 'சிறப்பு பிரச்சாரங்கள்',
    featured_title: 'முக்கியமான காரணங்களை',
    featured_title_highlight: 'ஆதரியுங்கள்',
    featured_view_all: 'அனைத்து பிரச்சாரங்களையும் காண',
    featured_raised: 'திரட்டியது',
    featured_donors: 'நன்கொடையாளர்கள்',
    featured_days_left: 'நாட்கள் மீதம்',
    featured_donate: 'நன்கொடை',

    // -- Impact --
    impact_badge: 'எங்கள் தாக்கம்',
    impact_title: 'உண்மையான மாற்றம்,',
    impact_title_highlight: 'உண்மையான எண்கள்',
    impact_children: 'கல்வி பெற்ற குழந்தைகள்',
    impact_meals: 'உணவு வழங்கியது',
    impact_projects: 'திட்டங்கள் நிறைவு',
    impact_ngos: 'கூட்டாளி NGO',

    // -- Stats --
    stats_donations: 'மொத்த நன்கொடைகள்',
    stats_campaigns: 'செயலில் உள்ள பிரச்சாரங்கள்',
    stats_verified: 'சரிபார்க்கப்பட்ட NGO',
    stats_donors: 'மகிழ்ச்சியான நன்கொடையாளர்கள்',

    // -- Donation --
    donate_title: 'பிரச்சாரத்திற்கு நன்கொடை',
    donate_select_amount: 'தொகையைத் தேர்ந்தெடுக்கவும்',
    donate_custom_amount: 'தனிப்பயன் தொகையை உள்ளிடவும்',
    donate_continue: 'கட்டணத்திற்குத் தொடரவும்',
    donate_confirm: 'நன்கொடையை உறுதிப்படுத்தவும்',
    donate_success_title: 'நன்கொடை வெற்றி!',
    donate_success_subtitle: 'உங்கள் பெருந்தன்மையான பங்களிப்புக்கு நன்றி',
    donate_view_receipt: 'ரசீதைக் காண',
    donate_donate_again: 'மீண்டும் நன்கொடை',
    donate_monetary: 'பண நன்கொடை',
    donate_physical: 'பொருள் நன்கொடை',

    // -- Receipt --
    receipt_title: 'நன்கொடை ரசீது',
    receipt_download_pdf: 'PDF பதிவிறக்கம்',

    // -- Blockchain --
    blockchain_badge: 'பிளாக்செயின் சரிபார்ப்பு',
    blockchain_title: 'வெளிப்படையான நன்கொடை',
    blockchain_title_highlight: 'கண்காணிப்பு',
    blockchain_description: 'ஒவ்வொரு நன்கொடையும் மாற்ற முடியாத பிளாக்செயின் பதிவேட்டில் பதிவு செய்யப்படுகிறது.',
    blockchain_trail: 'நன்கொடை பாதை',
    blockchain_transparent: '100% வெளிப்படை',

    // -- Carbon --
    carbon_badge: 'சுற்றுச்சூழல் தாக்கம்',
    carbon_title: 'உங்கள் பசுமை',
    carbon_title_highlight: 'அடிச்சுவடு',
    carbon_saved: 'கார்பன் சேமிக்கப்பட்டது',
    carbon_trees: 'மரங்கள் சமமானது',

    // -- AR --
    ar_badge: 'AR அனுபவம்',
    ar_title: 'உங்கள் தாக்கத்தைப் பாருங்கள்',
    ar_title_highlight: 'ஆக்மென்டட் ரியாலிட்டியில்',
    ar_launch: 'AR அனுபவத்தைத் தொடங்கு',

    // -- Dashboard --
    dashboard_welcome: 'மீண்டும் வரவேற்கிறோம்,',
    dashboard_donor: 'நன்கொடையாளர் கட்டுப்பாட்டுப் பலகை',
    dashboard_donate_again: 'மீண்டும் நன்கொடை',
    dashboard_explore_map: 'வரைபடத்தை ஆராய',
    dashboard_donation_history: 'நன்கொடை வரலாறு',
    dashboard_recommended: 'உங்களுக்கு பரிந்துரைக்கப்பட்டது',
    dashboard_nearby: 'அருகிலுள்ள NGO',
    dashboard_browse_all: 'அனைத்து பிரச்சாரங்களையும் காண',

    // -- Footer --
    footer_start_donating: 'நன்கொடை தொடங்கு',
    footer_become_volunteer: 'தன்னார்வலர் ஆகுங்கள்',

    // -- Auth --
    auth_login_title: 'மீண்டும் வரவேற்கிறோம்',
    auth_register_title: 'கணக்கை உருவாக்கு',
    auth_signin: 'உள்நுழை',
    auth_signup: 'கணக்கை உருவாக்கு',

    // -- Contact --
    contact_badge: 'தொடர்பு கொள்ளுங்கள்',
    contact_send: 'செய்தி அனுப்பு',

    // -- About --
    about_badge: 'தான்சேது பற்றி',

    // -- 404 --
    not_found_title: 'பக்கம் கிடைக்கவில்லை',
  },
};

// ============================================
// LANGUAGE METADATA
// ============================================
const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳', dir: 'ltr' },
];

// ============================================
// PROVIDER
// ============================================
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('kindwave_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('kindwave_lang', language);
    document.documentElement.setAttribute('lang', language);
    const langConfig = LANGUAGES.find((l) => l.code === language);
    if (langConfig) {
      document.documentElement.setAttribute('dir', langConfig.dir);
    }
  }, [language]);

  const t = useCallback(
    (key, fallback) => {
      const langDict = translations[language];
      if (langDict && langDict[key]) return langDict[key];
      // Fallback to English
      if (translations.en[key]) return translations.en[key];
      return fallback || key;
    },
    [language]
  );

  const switchLanguage = useCallback((langCode) => {
    if (translations[langCode]) {
      setLanguage(langCode);
    }
  }, []);

  const value = {
    language,
    setLanguage: switchLanguage,
    t,
    languages: LANGUAGES,
    currentLanguage: LANGUAGES.find((l) => l.code === language) || LANGUAGES[0],
    isRTL: LANGUAGES.find((l) => l.code === language)?.dir === 'rtl',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export { translations, LANGUAGES };
export default LanguageContext;