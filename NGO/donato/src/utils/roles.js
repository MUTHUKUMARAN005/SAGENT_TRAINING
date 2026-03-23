export const USER_ROLES = {
  ADMIN: 'admin',
  NGO: 'ngo',
  DONOR: 'donor',
  VOLUNTEER: 'volunteer',
};

export const DASHBOARD_ROUTE_BY_ROLE = {
  [USER_ROLES.ADMIN]: '/dashboard/admin',
  [USER_ROLES.NGO]: '/dashboard/ngo',
  [USER_ROLES.DONOR]: '/dashboard/donor',
  [USER_ROLES.VOLUNTEER]: '/dashboard/volunteer',
};

export const DASHBOARD_ENABLED_ROLES = new Set([
  USER_ROLES.ADMIN,
  USER_ROLES.NGO,
  USER_ROLES.DONOR,
  USER_ROLES.VOLUNTEER,
]);

const VALID_ROLES = new Set(Object.values(USER_ROLES));

export const normalizeRole = (role) => {
  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/^role[_\s-]?/, '');
  return VALID_ROLES.has(normalized) ? normalized : USER_ROLES.DONOR;
};

export const hasRequiredRole = (role, allowedRoles = []) => {
  if (!allowedRoles.length) return true;
  const normalizedRole = normalizeRole(role);
  return allowedRoles.map(normalizeRole).includes(normalizedRole);
};

export const getDashboardPathByRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return DASHBOARD_ROUTE_BY_ROLE[normalizedRole] || '/campaigns';
};
