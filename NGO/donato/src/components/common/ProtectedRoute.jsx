// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardPathByRole, hasRequiredRole } from '../../utils/roles';
import Loader from './Loader';

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = '/login',
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (user && user.emailVerified === false && location.pathname !== '/verify-email') {
    return (
      <Navigate
        to="/verify-email"
        state={{ from: location, email: user.email, phone: user.phone }}
        replace
      />
    );
  }

  if (!hasRequiredRole(user?.role, allowedRoles)) {
    return (
      <Navigate
        to={getDashboardPathByRole(user?.role)}
        state={{ from: location, reason: 'role_forbidden' }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
