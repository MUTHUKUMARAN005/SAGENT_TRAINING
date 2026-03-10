import React from 'react';
import { useAuth } from '../context/AuthContext';

const PermissionGate = ({
  children,
  permission,
  permissions,
  role,
  roles,
  requireAll = false,
  fallback = null,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } = useAuth();

  // Check role
  if (role && !hasRole(role)) return fallback;
  if (roles && !hasAnyRole(roles)) return fallback;

  // Check single permission
  if (permission && !hasPermission(permission)) return fallback;

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    if (!hasAccess) return fallback;
  }

  return <>{children}</>;
};

export default PermissionGate;