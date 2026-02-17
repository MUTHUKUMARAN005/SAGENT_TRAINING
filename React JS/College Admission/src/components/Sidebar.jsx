import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHome, FiUsers, FiFileText, FiBook, FiGrid,
  FiCreditCard, FiBell, FiFolder, FiUserCheck,
  FiAward, FiMapPin, FiShield
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const iconMap = {
  FiHome, FiUsers, FiFileText, FiBook, FiGrid,
  FiCreditCard, FiBell, FiFolder, FiUserCheck,
  FiAward, FiMapPin, FiShield,
};

const menuItems = [
  {
    section: 'Main',
    items: [
      { path: '/', icon: 'FiHome', label: 'Dashboard', permission: 'DASHBOARD_VIEW' },
    ],
  },
  {
    section: 'Management',
    items: [
      { path: '/students', icon: 'FiUsers', label: 'Students', permission: 'STUDENT_VIEW' },
      { path: '/applications', icon: 'FiFileText', label: 'Applications', permission: 'APPLICATION_VIEW' },
      { path: '/colleges', icon: 'FiMapPin', label: 'Colleges', permission: 'COLLEGE_VIEW' },
      { path: '/departments', icon: 'FiGrid', label: 'Departments', permission: 'DEPARTMENT_VIEW' },
      { path: '/courses', icon: 'FiBook', label: 'Courses', permission: 'COURSE_VIEW' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { path: '/payments', icon: 'FiCreditCard', label: 'Payments', permission: 'PAYMENT_VIEW' },
      { path: '/notifications', icon: 'FiBell', label: 'Notifications', permission: 'NOTIFICATION_VIEW' },
      { path: '/documents', icon: 'FiFolder', label: 'Documents', permission: 'DOCUMENT_VIEW' },
      { path: '/officers', icon: 'FiUserCheck', label: 'Officers', permission: 'OFFICER_VIEW' },
      { path: '/academic-records', icon: 'FiAward', label: 'Records', permission: 'RECORD_VIEW' },
    ],
  },
  {
    section: 'Administration',
    items: [
      { path: '/user-management', icon: 'FiShield', label: 'User Management', permission: 'USER_MANAGE' },
    ],
  },
];

const sidebarVariants = {
  hidden: { x: -260 },
  visible: {
    x: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20, staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

const Sidebar = () => {
  const location = useLocation();
  const { hasPermission, user } = useAuth();

  return (
    <motion.aside
      className="sidebar"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* User Info */}
      <motion.div
        variants={itemVariants}
        style={{
          padding: '0 16px 20px',
          marginBottom: 8,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px',
          borderRadius: 'var(--radius)',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--gradient-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', color: 'white',
          }}>
            {user?.fullName?.charAt(0) || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              {user?.fullName || 'Guest'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              {user?.role || 'No Role'}
            </div>
          </div>
        </div>
      </motion.div>

      {menuItems.map((section, sIdx) => {
        const visibleItems = section.items.filter(
          (item) => hasPermission(item.permission)
        );

        if (visibleItems.length === 0) return null;

        return (
          <div key={sIdx} className="sidebar-section">
            <div className="sidebar-section-title">{section.section}</div>
            {visibleItems.map((item) => {
              const IconComponent = iconMap[item.icon] || FiHome;
              return (
                <motion.div key={item.path} variants={itemVariants}>
                  <NavLink
                    to={item.path}
                    className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    <motion.span
                      className="icon"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                    >
                      <IconComponent />
                    </motion.span>
                    {item.label}
                  </NavLink>
                </motion.div>
              );
            })}
          </div>
        );
      })}
    </motion.aside>
  );
};

export default Sidebar;