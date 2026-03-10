// ==========================================
// RBAC PERMISSIONS CONFIGURATION
// ==========================================

export const ROLES = {
  ADMIN: 'ADMIN',
  LIBRARIAN: 'LIBRARIAN',
  MEMBER: 'MEMBER'
};

export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  VIEW_FULL_STATS: 'VIEW_FULL_STATS',

  // Books
  VIEW_BOOKS: 'VIEW_BOOKS',
  CREATE_BOOK: 'CREATE_BOOK',
  EDIT_BOOK: 'EDIT_BOOK',
  DELETE_BOOK: 'DELETE_BOOK',

  // Authors
  VIEW_AUTHORS: 'VIEW_AUTHORS',
  CREATE_AUTHOR: 'CREATE_AUTHOR',
  EDIT_AUTHOR: 'EDIT_AUTHOR',
  DELETE_AUTHOR: 'DELETE_AUTHOR',

  // Members
  VIEW_MEMBERS: 'VIEW_MEMBERS',
  CREATE_MEMBER: 'CREATE_MEMBER',
  EDIT_MEMBER: 'EDIT_MEMBER',
  DELETE_MEMBER: 'DELETE_MEMBER',
  VIEW_OWN_PROFILE: 'VIEW_OWN_PROFILE',

  // Libraries
  VIEW_LIBRARIES: 'VIEW_LIBRARIES',
  CREATE_LIBRARY: 'CREATE_LIBRARY',
  EDIT_LIBRARY: 'EDIT_LIBRARY',
  DELETE_LIBRARY: 'DELETE_LIBRARY',

  // Librarians
  VIEW_LIBRARIANS: 'VIEW_LIBRARIANS',
  CREATE_LIBRARIAN: 'CREATE_LIBRARIAN',
  EDIT_LIBRARIAN: 'EDIT_LIBRARIAN',
  DELETE_LIBRARIAN: 'DELETE_LIBRARIAN',

  // Book Copies
  VIEW_BOOK_COPIES: 'VIEW_BOOK_COPIES',
  CREATE_BOOK_COPY: 'CREATE_BOOK_COPY',
  EDIT_BOOK_COPY: 'EDIT_BOOK_COPY',
  DELETE_BOOK_COPY: 'DELETE_BOOK_COPY',

  // Catalog
  VIEW_CATALOG: 'VIEW_CATALOG',
  MANAGE_CATALOG: 'MANAGE_CATALOG',

  // Categories
  VIEW_CATEGORIES: 'VIEW_CATEGORIES',
  CREATE_CATEGORY: 'CREATE_CATEGORY',
  EDIT_CATEGORY: 'EDIT_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',

  // Borrowings
  VIEW_BORROWINGS: 'VIEW_BORROWINGS',
  VIEW_OWN_BORROWINGS: 'VIEW_OWN_BORROWINGS',
  CREATE_BORROWING: 'CREATE_BORROWING',
  EDIT_BORROWING: 'EDIT_BORROWING',
  DELETE_BORROWING: 'DELETE_BORROWING',

  // Fines
  VIEW_FINES: 'VIEW_FINES',
  VIEW_OWN_FINES: 'VIEW_OWN_FINES',
  MANAGE_FINES: 'MANAGE_FINES',

  // Requests
  VIEW_REQUESTS: 'VIEW_REQUESTS',
  VIEW_OWN_REQUESTS: 'VIEW_OWN_REQUESTS',
  CREATE_REQUEST: 'CREATE_REQUEST',
  MANAGE_REQUESTS: 'MANAGE_REQUESTS',

  // Notifications
  VIEW_NOTIFICATIONS: 'VIEW_NOTIFICATIONS',
  VIEW_OWN_NOTIFICATIONS: 'VIEW_OWN_NOTIFICATIONS',
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',

  // Reports
  VIEW_REPORTS: 'VIEW_REPORTS',
  EXPORT_PDF: 'EXPORT_PDF',

  // Profile
  VIEW_PROFILE: 'VIEW_PROFILE',
  EDIT_PROFILE: 'EDIT_PROFILE',

  // AI Assistant
  USE_AI_ASSISTANT: 'USE_AI_ASSISTANT',

};

// Role -> Permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has ALL permissions
    ...Object.values(PERMISSIONS)
  ],

  [ROLES.LIBRARIAN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FULL_STATS,

    PERMISSIONS.VIEW_BOOKS, PERMISSIONS.CREATE_BOOK,
    PERMISSIONS.EDIT_BOOK, PERMISSIONS.DELETE_BOOK,

    PERMISSIONS.VIEW_AUTHORS, PERMISSIONS.CREATE_AUTHOR,
    PERMISSIONS.EDIT_AUTHOR, PERMISSIONS.DELETE_AUTHOR,

    PERMISSIONS.VIEW_MEMBERS,
    PERMISSIONS.CREATE_MEMBER, PERMISSIONS.EDIT_MEMBER,

    PERMISSIONS.VIEW_LIBRARIES,

    PERMISSIONS.VIEW_BOOK_COPIES, PERMISSIONS.CREATE_BOOK_COPY,
    PERMISSIONS.EDIT_BOOK_COPY, PERMISSIONS.DELETE_BOOK_COPY,

    PERMISSIONS.VIEW_CATALOG, PERMISSIONS.MANAGE_CATALOG,
    PERMISSIONS.VIEW_CATEGORIES, PERMISSIONS.CREATE_CATEGORY,
    PERMISSIONS.EDIT_CATEGORY, PERMISSIONS.DELETE_CATEGORY,

    PERMISSIONS.VIEW_BORROWINGS, PERMISSIONS.CREATE_BORROWING,
    PERMISSIONS.EDIT_BORROWING,

    PERMISSIONS.VIEW_FINES, PERMISSIONS.MANAGE_FINES,

    PERMISSIONS.VIEW_REQUESTS, PERMISSIONS.MANAGE_REQUESTS,

    PERMISSIONS.VIEW_NOTIFICATIONS, PERMISSIONS.SEND_NOTIFICATION,

    PERMISSIONS.VIEW_REPORTS, PERMISSIONS.EXPORT_PDF,

    PERMISSIONS.VIEW_PROFILE, PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.USE_AI_ASSISTANT,
  ],

  [ROLES.MEMBER]: [
    PERMISSIONS.VIEW_DASHBOARD,

    PERMISSIONS.VIEW_BOOKS,
    PERMISSIONS.VIEW_AUTHORS,
    PERMISSIONS.VIEW_LIBRARIES,
    PERMISSIONS.VIEW_BOOK_COPIES,
    PERMISSIONS.VIEW_CATALOG,
    PERMISSIONS.VIEW_CATEGORIES,

    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.VIEW_OWN_BORROWINGS,
    PERMISSIONS.VIEW_OWN_FINES,

    PERMISSIONS.VIEW_OWN_REQUESTS,
    PERMISSIONS.CREATE_REQUEST,

    PERMISSIONS.VIEW_OWN_NOTIFICATIONS,

    PERMISSIONS.VIEW_PROFILE, PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.USE_AI_ASSISTANT,
  ]
};

// Check if a role has a specific permission
export const hasPermission = (role, permission) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

// Check if a role has ANY of the given permissions
export const hasAnyPermission = (role, permissions) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return permissions.some(p => ROLE_PERMISSIONS[role].includes(p));
};

// Check if a role has ALL given permissions
export const hasAllPermissions = (role, permissions) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return permissions.every(p => ROLE_PERMISSIONS[role].includes(p));
};

// Navigation items filtered by role
export const getNavigationForRole = (role) => {
  const allNav = [
    { path: '/', label: 'Dashboard', icon: 'DB', permission: PERMISSIONS.VIEW_DASHBOARD, color: '#0ea5a4' },
    { path: '/books', label: 'Books', icon: 'BK', permission: PERMISSIONS.VIEW_BOOKS, color: '#3b82f6' },
    { path: '/authors', label: 'Authors', icon: 'AU', permission: PERMISSIONS.VIEW_AUTHORS, color: '#22c55e' },
    { path: '/members', label: hasPermission(role, PERMISSIONS.VIEW_MEMBERS) ? 'Students' : 'My Member Details', icon: 'MB', permission: hasPermission(role, PERMISSIONS.VIEW_MEMBERS) ? PERMISSIONS.VIEW_MEMBERS : PERMISSIONS.VIEW_OWN_PROFILE, color: '#f59e0b' },
    { path: '/categories', label: 'Categories', icon: 'CT', permission: PERMISSIONS.VIEW_CATEGORIES, color: '#06b6d4' },
    { path: '/libraries', label: 'Libraries', icon: 'LB', permission: PERMISSIONS.VIEW_LIBRARIES, color: '#0ea5a4' },
    { path: '/librarians', label: 'Librarians', icon: 'LR', permission: PERMISSIONS.VIEW_LIBRARIANS, color: '#f59e0b' },
    { path: '/book-copies', label: 'Book Copies', icon: 'CP', permission: PERMISSIONS.VIEW_BOOK_COPIES, color: '#14b8a6' },
    { path: '/catalog', label: 'Catalog', icon: 'CG', permission: PERMISSIONS.VIEW_CATALOG, color: '#3b82f6' },
    { path: '/borrowings', label: 'Borrowings', icon: 'BR', permission: hasPermission(role, PERMISSIONS.VIEW_BORROWINGS) ? PERMISSIONS.VIEW_BORROWINGS : PERMISSIONS.VIEW_OWN_BORROWINGS, color: '#f97316' },
    { path: '/fines', label: 'Fines', icon: 'FN', permission: hasPermission(role, PERMISSIONS.VIEW_FINES) ? PERMISSIONS.VIEW_FINES : PERMISSIONS.VIEW_OWN_FINES, color: '#ef4444' },
    { path: '/requests', label: 'Requests', icon: 'RQ', permission: hasPermission(role, PERMISSIONS.VIEW_REQUESTS) ? PERMISSIONS.VIEW_REQUESTS : PERMISSIONS.VIEW_OWN_REQUESTS, color: '#8b5cf6' },
    { path: '/notifications', label: 'Notifications', icon: 'NT', permission: hasPermission(role, PERMISSIONS.VIEW_NOTIFICATIONS) ? PERMISSIONS.VIEW_NOTIFICATIONS : PERMISSIONS.VIEW_OWN_NOTIFICATIONS, color: '#ec4899' },
    { path: '/reports', label: 'Reports', icon: 'RP', permission: PERMISSIONS.VIEW_REPORTS, color: '#14b8a6' },
    { path: '/assistant', label: 'AI Assistant', icon: 'AI', permission: PERMISSIONS.USE_AI_ASSISTANT, color: '#22c55e' },
    { path: '/profile', label: 'My Profile', icon: 'PF', permission: PERMISSIONS.VIEW_PROFILE, color: '#3b82f6' },
  ];

  return allNav.filter(item => hasPermission(role, item.permission));
};

// Role display configuration
export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: 'Administrator',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    icon: 'AD',
    bgLight: 'rgba(239,68,68,0.12)'
  },
  [ROLES.LIBRARIAN]: {
    label: 'Librarian',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    icon: 'LB',
    bgLight: 'rgba(99,102,241,0.12)'
  },
  [ROLES.MEMBER]: {
    label: 'Member',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    icon: 'MB',
    bgLight: 'rgba(16,185,129,0.12)'
  }
};
