import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { motion } from 'framer-motion';

// Component-level guard - hides content if no permission
export const PermissionGate = ({ permission, permissions, children, fallback = null, showDenied = false }) => {
  const { checkPermission, checkAnyPermission } = useAuth();

  let hasAccess = false;
  if (permission) {
    hasAccess = checkPermission(permission);
  } else if (permissions) {
    hasAccess = checkAnyPermission(permissions);
  }

  if (!hasAccess) {
    if (showDenied) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '40px', textAlign: 'center',
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: '16px', margin: '20px 0'
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: '48px', marginBottom: '12px' }}
          >
            🔒
          </motion.div>
          <p style={{ color: '#f87171', fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>
            Access Denied
          </p>
          <p style={{ color: '#64748b', fontSize: '13px' }}>
            You don't have permission to view this content
          </p>
        </motion.div>
      );
    }
    return fallback;
  }

  return children;
};

// Route-level guard - redirects if no permission
export const RouteGuard = ({ permission, permissions, children }) => {
  const { checkPermission, checkAnyPermission } = useAuth();

  let hasAccess = false;
  if (permission) {
    hasAccess = checkPermission(permission);
  } else if (permissions) {
    hasAccess = checkAnyPermission(permissions);
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// HOC for wrapping components with permission check
export const withPermission = (WrappedComponent, permission) => {
  return (props) => {
    const { checkPermission } = useAuth();
    if (!checkPermission(permission)) {
      return <Navigate to="/unauthorized" replace />;
    }
    return <WrappedComponent {...props} />;
  };
};