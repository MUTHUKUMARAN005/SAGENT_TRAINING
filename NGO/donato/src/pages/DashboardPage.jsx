import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import NGOAdminDashboard from '../components/dashboard/NGOAdminDashboard';
import DonorDashboard from '../components/dashboard/DonorDashboard';
import VolunteerDashboard from '../components/dashboard/VolunteerDashboard';
import { pageTransition } from '../animations/variants';
import { DASHBOARD_ENABLED_ROLES, getDashboardPathByRole, normalizeRole } from '../utils/roles';

const DashboardPage = () => {
  const { user, isAuthenticated, isAdmin, isNGO, isDonor, isVolunteer } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedRole = normalizeRole(user?.role);
  if (!DASHBOARD_ENABLED_ROLES.has(normalizedRole)) {
    return <Navigate to="/campaigns" replace />;
  }

  const roleDashboardPath = getDashboardPathByRole(user?.role);
  const displayName = String(user?.name || '').trim() || String(user?.email || '').trim() || 'User';
  const displayEmail = String(user?.email || '').trim();

  if (location.pathname === '/dashboard') {
    return <Navigate to={roleDashboardPath} replace />;
  }

  const getDashboard = () => {
    if (isAdmin) return <AdminDashboard />;
    if (isNGO) return <NGOAdminDashboard />;
    if (isDonor) return <DonorDashboard />;
    return <VolunteerDashboard />;
  };

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-glow-gradient opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isAdmin && !isVolunteer && (
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 
                            flex items-center justify-center text-white text-lg font-bold shadow-glow">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-slate-400 text-sm">Welcome back,</p>
                <h2 className="text-white font-heading font-bold text-lg">{displayName}</h2>
                {displayEmail ? <p className="text-slate-400 text-xs">{displayEmail}</p> : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-primary-500/10 border border-primary-500/20 
                           text-primary-400 text-sm font-medium capitalize">
                {user?.role} Account
              </span>
            </div>
          </div>
        )}

        {getDashboard()}
      </div>
    </motion.div>
  );
};

export default DashboardPage;
