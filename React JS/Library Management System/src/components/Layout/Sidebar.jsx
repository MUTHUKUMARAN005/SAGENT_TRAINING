// src/components/Layout/Sidebar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { getNavigationForRole } from '../../auth/permissions';
import RoleBadge from '../Common/RoleBadge';

const Sidebar = () => {
  const { user, sidebarCollapsed, toggleSidebar, logout } = useAuth();
  const [hovered, setHovered] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);
  const hasAutoCollapsedOnMobile = useRef(false);
  const location = useLocation();

  const navItems = getNavigationForRole(user?.role);
  const userInitials = (user?.name || user?.username || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && !hasAutoCollapsedOnMobile.current) {
      if (!sidebarCollapsed) {
        toggleSidebar();
      }
      hasAutoCollapsedOnMobile.current = true;
      return;
    }

    if (!isMobile) {
      hasAutoCollapsedOnMobile.current = false;
    }
  }, [isMobile, sidebarCollapsed, toggleSidebar]);

  return (
    <>
      {isMobile && !sidebarCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 20, 0.48)',
            zIndex: 90
          }}
        />
      )}
      <motion.aside
      animate={{
        width: isMobile ? 272 : (sidebarCollapsed ? 88 : 272),
        x: isMobile && sidebarCollapsed ? -272 : 0
      }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        height: '100vh',
        background: 'linear-gradient(180deg, rgba(7, 18, 33, 0.98), rgba(10, 26, 45, 0.95))',
        backdropFilter: 'blur(18px)',
        borderRight: '1px solid rgba(157, 181, 209, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        overflow: 'hidden',
        boxShadow: isMobile ? '0 0 0 9999px rgba(0, 0, 0, 0)' : 'none'
      }}
    >
      <motion.div
        whileHover={{ backgroundColor: 'rgba(14, 165, 164, 0.08)' }}
        onClick={toggleSidebar}
        style={{
          padding: '18px 14px',
          borderBottom: '1px solid rgba(157, 181, 209, 0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
          cursor: 'pointer',
          minHeight: '72px'
        }}
      >
        <motion.div
          animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
          transition={{ duration: 0.4 }}
          style={{
            width: '42px',
            height: '42px',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0ea5a4, #3b82f6)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: '#eef7ff',
            fontWeight: 800,
            boxShadow: '0 10px 24px rgba(14, 165, 164, 0.25)'
          }}
        >
          LM
        </motion.div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#e8f1fb',
                  whiteSpace: 'nowrap'
                }}
              >
                Library Management
              </h1>
              <p style={{ fontSize: '10px', color: '#6f86a1', whiteSpace: 'nowrap' }}>
                Operations Console
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {!sidebarCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '14px 14px 12px',
              borderBottom: '1px solid rgba(157, 181, 209, 0.16)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0ea5a4, #3b82f6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#edf6ff'
                }}
              >
                {user?.avatar || userInitials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#dce8f6' }}>{user.name}</p>
                <p
                  style={{
                    fontSize: '10px',
                    color: '#7d93ad',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user.email}
                </p>
              </div>
            </div>
            <RoleBadge role={user.role} size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 7px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isMobile && !sidebarCollapsed) {
                  toggleSidebar();
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ x: 3, backgroundColor: 'rgba(16, 28, 48, 0.95)' }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHovered(item.path)}
                onHoverEnd={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '11px',
                  padding: (sidebarCollapsed && !isMobile) ? '10px 15px' : '10px 12px',
                  borderRadius: '10px',
                  position: 'relative',
                  background: isActive ? 'rgba(14, 165, 164, 0.14)' : 'transparent',
                  border: isActive ? '1px solid rgba(45, 212, 191, 0.32)' : '1px solid transparent',
                  transition: 'background 0.2s, border 0.2s'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '20%',
                      width: '3px',
                      height: '60%',
                      background: 'linear-gradient(180deg, #0ea5a4, #3b82f6)',
                      borderRadius: '0 3px 3px 0'
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: isActive ? 'rgba(45, 212, 191, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#9ff3e8' : '#95a9c0',
                    fontSize: '11px',
                    fontWeight: 800
                  }}
                >
                  {item.icon}
                </span>
                <AnimatePresence>
                  {(!sidebarCollapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        fontSize: '12px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#e8f1fb' : '#afc1d7',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {(sidebarCollapsed && !isMobile) && hovered === item.path && (
                    <motion.div
                      initial={{ opacity: 0, x: -8, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -8, scale: 0.9 }}
                      style={{
                        position: 'absolute',
                        left: '62px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#132842',
                        border: '1px solid rgba(157, 181, 209, 0.28)',
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#e8f1fb',
                        whiteSpace: 'nowrap',
                        zIndex: 200,
                        boxShadow: '0 14px 24px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '10px 7px', borderTop: '1px solid rgba(157, 181, 209, 0.16)' }}>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', x: 3 }}
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '11px',
            padding: (sidebarCollapsed && !isMobile) ? '10px 14px' : '10px 12px',
            borderRadius: '10px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#fda4a4',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <span style={{ fontSize: '11px', width: '26px', textAlign: 'center' }}>OUT</span>
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ whiteSpace: 'nowrap' }}
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
