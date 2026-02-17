import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiShoppingBag, FiUsers, FiShoppingCart, FiMapPin,
  FiPackage, FiCreditCard, FiTruck, FiUserCheck, FiBell,
  FiPercent, FiXCircle, FiMenu, FiX, FiZap
} from 'react-icons/fi';
import './Sidebar.css';

const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard', color: '#6366f1' },
  { path: '/products', icon: FiShoppingBag, label: 'Products', color: '#ec4899' },
  { path: '/customers', icon: FiUsers, label: 'Customers', color: '#3b82f6' },
  { path: '/orders', icon: FiShoppingCart, label: 'Orders', color: '#10b981' },
  { path: '/stores', icon: FiMapPin, label: 'Stores', color: '#f59e0b' },
  { path: '/inventory', icon: FiPackage, label: 'Inventory', color: '#8b5cf6' },
  { path: '/payments', icon: FiCreditCard, label: 'Payments', color: '#06b6d4' },
  { path: '/deliveries', icon: FiTruck, label: 'Deliveries', color: '#f97316' },
  { path: '/users', icon: FiUserCheck, label: 'Users', color: '#14b8a6' },
  { path: '/notifications', icon: FiBell, label: 'Notifications', color: '#a855f7' },
  { path: '/discounts', icon: FiPercent, label: 'Discounts', color: '#f43f5e' },
  { path: '/cancellations', icon: FiXCircle, label: 'Cancellations', color: '#ef4444' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Logo Section */}
      <div className="sidebar-logo">
        <motion.div
          className="logo-icon"
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.6 }}
        >
          <FiZap size={22} />
        </motion.div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              className="logo-text-container"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <span className="logo-text">FreshMart</span>
              <span className="logo-subtitle">Management</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {collapsed ? <FiMenu size={16} /> : <FiX size={16} />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
            >
              <NavLink
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {isActive && (
                  <motion.div
                    className="nav-active-bg"
                    layoutId="activeNavBg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    style={{
                      background: `${item.color}10`,
                      borderColor: `${item.color}30`,
                    }}
                  />
                )}

                <motion.div
                  className="nav-icon"
                  style={{ color: isActive ? item.color : '' }}
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Icon size={20} />
                </motion.div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      className="nav-label"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ color: isActive ? item.color : '' }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {isActive && !collapsed && (
                  <motion.div
                    className="nav-indicator"
                    layoutId="navIndicator"
                    style={{ background: item.color }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="sidebar-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p>© 2025 FreshMart</p>
            <p className="version">v1.0.0</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

export default Sidebar;