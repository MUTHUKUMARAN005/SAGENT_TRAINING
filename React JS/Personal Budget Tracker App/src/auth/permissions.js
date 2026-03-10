export const ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
    VIEWER: 'VIEWER'
};

export const PERMISSIONS = {
    VIEW_DASHBOARD: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    VIEW_PROFILE: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    VIEW_ADMIN_DASHBOARD: [ROLES.ADMIN],
    MANAGE_USERS: [ROLES.ADMIN],

    VIEW_ACCOUNTS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_ACCOUNT: [ROLES.ADMIN, ROLES.USER],
    EDIT_ACCOUNT: [ROLES.ADMIN, ROLES.USER],
    DELETE_ACCOUNT: [ROLES.ADMIN, ROLES.USER],

    VIEW_INCOME: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_INCOME: [ROLES.ADMIN, ROLES.USER],
    EDIT_INCOME: [ROLES.ADMIN, ROLES.USER],
    DELETE_INCOME: [ROLES.ADMIN, ROLES.USER],

    VIEW_EXPENSES: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_EXPENSE: [ROLES.ADMIN, ROLES.USER],
    EDIT_EXPENSE: [ROLES.ADMIN, ROLES.USER],
    DELETE_EXPENSE: [ROLES.ADMIN, ROLES.USER],

    VIEW_BUDGETS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_BUDGET: [ROLES.ADMIN, ROLES.USER],
    EDIT_BUDGET: [ROLES.ADMIN, ROLES.USER],
    DELETE_BUDGET: [ROLES.ADMIN, ROLES.USER],

    VIEW_GOALS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_GOAL: [ROLES.ADMIN, ROLES.USER],
    EDIT_GOAL: [ROLES.ADMIN, ROLES.USER],
    DELETE_GOAL: [ROLES.ADMIN, ROLES.USER],
    CONTRIBUTE_GOAL: [ROLES.ADMIN, ROLES.USER],

    VIEW_TRANSFERS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_TRANSFER: [ROLES.ADMIN, ROLES.USER],
    DELETE_TRANSFER: [ROLES.ADMIN, ROLES.USER],

    VIEW_RECURRING: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_RECURRING: [ROLES.ADMIN, ROLES.USER],
    EDIT_RECURRING: [ROLES.ADMIN, ROLES.USER],
    DELETE_RECURRING: [ROLES.ADMIN, ROLES.USER],

    VIEW_CATEGORIES: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    CREATE_CATEGORY: [ROLES.ADMIN, ROLES.USER],
    DELETE_CATEGORY: [ROLES.ADMIN],

    VIEW_ALERTS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    MANAGE_ALERTS: [ROLES.ADMIN, ROLES.USER],

    VIEW_REPORTS: [ROLES.ADMIN, ROLES.USER, ROLES.VIEWER],
    GENERATE_REPORT: [ROLES.ADMIN, ROLES.USER],
    DELETE_REPORT: [ROLES.ADMIN, ROLES.USER]
};

export const hasPermission = (userRole, permission) => {
    if (!userRole || !permission) return false;
    const allowed = PERMISSIONS[permission];
    return allowed ? allowed.includes(userRole) : false;
};

export const getMenuItemsForRole = (role) => {
    const items = [
        { path: '/', label: 'Dashboard', icon: '📊', permission: 'VIEW_DASHBOARD' },
        { path: '/profile', label: 'Profile', icon: '👤', permission: 'VIEW_PROFILE' },
        { path: '/admin/dashboard', label: 'Admin Panel', icon: '⚙️', permission: 'VIEW_ADMIN_DASHBOARD' },
        { path: '/admin/users', label: 'User Management', icon: '👥', permission: 'MANAGE_USERS' },
        { path: '/accounts', label: 'Accounts', icon: '🏦', permission: 'VIEW_ACCOUNTS' },
        { path: '/income', label: 'Income', icon: '💰', permission: 'VIEW_INCOME' },
        { path: '/expenses', label: 'Expenses', icon: '💸', permission: 'VIEW_EXPENSES' },
        { path: '/budgets', label: 'Budgets', icon: '📋', permission: 'VIEW_BUDGETS' },
        { path: '/goals', label: 'Goals', icon: '🎯', permission: 'VIEW_GOALS' },
        { path: '/transfers', label: 'Transfers', icon: '🔄', permission: 'VIEW_TRANSFERS' },
        { path: '/recurring', label: 'Recurring', icon: '🔁', permission: 'VIEW_RECURRING' },
        { path: '/categories', label: 'Categories', icon: '🏷️', permission: 'VIEW_CATEGORIES' },
        { path: '/alerts', label: 'Alerts', icon: '🔔', permission: 'VIEW_ALERTS' },
        { path: '/reports', label: 'Reports', icon: '📈', permission: 'VIEW_REPORTS' }
    ];
    return items.filter(item => hasPermission(role, item.permission));
};
