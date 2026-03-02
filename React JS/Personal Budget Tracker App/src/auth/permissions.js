// ============================================
// ROLE-BASED PERMISSIONS CONFIGURATION
// ============================================

export const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    VIEWER: 'VIEWER'
};

// Define permissions for each page/feature
export const PERMISSIONS = {

    // Dashboard
    VIEW_DASHBOARD: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    VIEW_ADMIN_DASHBOARD: [ROLES.ADMIN],

    // User Management
    MANAGE_USERS: [ROLES.ADMIN],
    VIEW_ALL_USERS: [ROLES.ADMIN],
    DELETE_USERS: [ROLES.ADMIN],

    // Accounts
    VIEW_ACCOUNTS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_ACCOUNT: [ROLES.ADMIN, ROLES.USER],
    EDIT_ACCOUNT: [ROLES.ADMIN, ROLES.USER],
    DELETE_ACCOUNT: [ROLES.ADMIN, ROLES.USER],

    // Income
    VIEW_INCOME: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_INCOME: [ROLES.ADMIN, ROLES.USER],
    EDIT_INCOME: [ROLES.ADMIN, ROLES.USER],
    DELETE_INCOME: [ROLES.ADMIN, ROLES.USER],

    // Expenses
    VIEW_EXPENSES: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_EXPENSE: [ROLES.ADMIN, ROLES.USER],
    EDIT_EXPENSE: [ROLES.ADMIN, ROLES.USER],
    DELETE_EXPENSE: [ROLES.ADMIN, ROLES.USER],

    // Budgets
    VIEW_BUDGETS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_BUDGET: [ROLES.ADMIN, ROLES.USER],
    EDIT_BUDGET: [ROLES.ADMIN, ROLES.USER],
    DELETE_BUDGET: [ROLES.ADMIN, ROLES.USER],

    // Goals
    VIEW_GOALS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_GOAL: [ROLES.ADMIN, ROLES.USER],
    EDIT_GOAL: [ROLES.ADMIN, ROLES.USER],
    DELETE_GOAL: [ROLES.ADMIN, ROLES.USER],
    CONTRIBUTE_GOAL: [ROLES.ADMIN, ROLES.USER],

    // Transfers
    VIEW_TRANSFERS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_TRANSFER: [ROLES.ADMIN, ROLES.USER],
    DELETE_TRANSFER: [ROLES.ADMIN, ROLES.USER],

    // Recurring Transactions
    VIEW_RECURRING: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_RECURRING: [ROLES.ADMIN, ROLES.USER],
    EDIT_RECURRING: [ROLES.ADMIN, ROLES.USER],
    DELETE_RECURRING: [ROLES.ADMIN, ROLES.USER],

    // Categories
    VIEW_CATEGORIES: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_CATEGORY: [ROLES.ADMIN, ROLES.USER],
    DELETE_CATEGORY: [ROLES.ADMIN],

    // Alerts
    VIEW_ALERTS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    MANAGE_ALERTS: [ROLES.ADMIN, ROLES.USER],

    // Reports
    VIEW_REPORTS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    GENERATE_REPORT: [ROLES.ADMIN, ROLES.USER],
    VIEW_ALL_REPORTS: [ROLES.ADMIN]
};

// Check if a role has a specific permission
export const hasPermission = (userRole, permission) => {
    if (!userRole || !permission) return false;
    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;
    return allowedRoles.includes(userRole);
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
    const permissions = {};
    Object.keys(PERMISSIONS).forEach(key => {
        permissions[key] = PERMISSIONS[key].includes(role);
    });
    return permissions;
};

// Sidebar menu items based on role
export const getMenuItemsForRole = (role) => {

    const allMenuItems = [
        {
            path: '/',
            label: 'Dashboard',
            icon: '📊',
            permission: 'VIEW_DASHBOARD'
        },
        {
            path: '/admin/dashboard',
            label: 'Admin Panel',
            icon: '⚙️',
            permission: 'VIEW_ADMIN_DASHBOARD'
        },
        {
            path: '/admin/users',
            label: 'User Management',
            icon: '👥',
            permission: 'MANAGE_USERS'
        },
        {
            path: '/accounts',
            label: 'Accounts',
            icon: '🏦',
            permission: 'VIEW_ACCOUNTS'
        },
        {
            path: '/income',
            label: 'Income',
            icon: '💰',
            permission: 'VIEW_INCOME'
        },
        {
            path: '/expenses',
            label: 'Expenses',
            icon: '💸',
            permission: 'VIEW_EXPENSES'
        },
        {
            path: '/budgets',
            label: 'Budgets',
            icon: '📋',
            permission: 'VIEW_BUDGETS'
        },
        {
            path: '/goals',
            label: 'Goals',
            icon: '🎯',
            permission: 'VIEW_GOALS'
        },
        {
            path: '/transfers',
            label: 'Transfers',
            icon: '🔄',
            permission: 'VIEW_TRANSFERS'
        },
        {
            path: '/recurring',
            label: 'Recurring',
            icon: '🔁',
            permission: 'VIEW_RECURRING'
        },
        {
            path: '/categories',
            label: 'Categories',
            icon: '🏷️',
            permission: 'VIEW_CATEGORIES'
        },
        {
            path: '/alerts',
            label: 'Alerts',
            icon: '🔔',
            permission: 'VIEW_ALERTS'
        },
        {
            path: '/reports',
            label: 'Reports',
            icon: '📈',
            permission: 'VIEW_REPORTS'
        }
    ];

    return allMenuItems.filter(item =>
        hasPermission(role, item.permission)
    );
};