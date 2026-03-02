import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiAlertTriangle } from 'react-icons/fi';

const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredPermissions,
  requiredRole,
  requiredRoles,
  requireAll = false,
  fallback = null,
}) => {
  const { isAuthenticated, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="spinner"
        />
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ color: 'var(--text-muted)' }}
        >
          Verifying access...
        </motion.p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || <AccessDenied />;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return fallback || <AccessDenied />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <AccessDenied />;
  }

  // Check multiple permissions
  if (requiredPermissions) {
    const hasAccess = requireAll
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    if (!hasAccess) {
      return fallback || <AccessDenied />;
    }
  }

  return children;
};

const AccessDenied = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: 'spring', stiffness: 200 }}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: 40,
    }}
  >
    <motion.div
      animate={{
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      style={{
        width: 100,
        height: 100,
        borderRadius: 24,
        background: 'rgba(239, 68, 68, 0.1)',
        border: '2px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}
    >
      <FiLock size={40} color="var(--danger)" />
    </motion.div>
    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
      Access Denied
    </h2>
    <p style={{ color: 'var(--text-muted)', maxWidth: 400, marginBottom: 24 }}>
      You don't have permission to access this page. Contact your administrator if you believe this is an error.
    </p>
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 12,
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        color: 'var(--warning)',
        fontSize: '0.85rem',
      }}
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <FiAlertTriangle size={16} />
      Insufficient privileges
    </motion.div>
  </motion.div>
);

export default ProtectedRoute;