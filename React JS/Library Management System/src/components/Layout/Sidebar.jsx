// src/components/Layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { getNavigationForRole } from '../../auth/permissions';
import RoleBadge from '../Common/RoleBadge';

const Sidebar = () => {
  const { user, sidebarCollapsed, toggleSidebar, logout } = useAuth();
  const [hovered, setHovered] = useState(null);
  const location = useLocation();

  const navItems = getNavigationForRole(user?.role);

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 76 : 256 }}
      transition={{ duration: 0.35, ease: [0.25,0.46,0.45,0.94] }}
      style={{
        height: '100vh', background: 'linear-gradient(180deg, rgba(15,23,42,0.97), rgba(30,41,59,0.92))',
        backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, zIndex: 100, overflow: 'hidden'
      }}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ backgroundColor: 'rgba(99,102,241,0.06)' }}
        onClick={toggleSidebar}
        style={{
          padding: '18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '11px', cursor: 'pointer', minHeight: '68px'
        }}
      >
        <motion.div animate={{ rotate: sidebarCollapsed ? 180 : 0 }} transition={{ duration: 0.4 }}
          style={{ width: '40px', height: '40px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>📖</motion.div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
              <h1 style={{ fontSize:'16px', fontWeight:800, background:'linear-gradient(135deg,#f1f5f9,#cbd5e1)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', whiteSpace:'nowrap' }}>LibraryMS</h1>
              <p style={{ fontSize:'9px', color:'#475569', whiteSpace:'nowrap' }}>Role-Based Access</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* User Info */}
      <AnimatePresence>
        {!sidebarCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '14px 14px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px'
              }}>
                {user.avatar}
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{user.name}</p>
                <p style={{ fontSize: '10px', color: '#64748b' }}>{user.email}</p>
              </div>
            </div>
            <RoleBadge role={user.role} size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav style={{
        flex: 1, overflowY: 'auto', padding: '8px 6px',
        display: 'flex', flexDirection: 'column', gap: '2px'
      }}>
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink key={item.path} to={item.path}>
              <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ x: 3, backgroundColor: `${item.color}12` }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHovered(item.path)}
                onHoverEnd={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '11px',
                  padding: sidebarCollapsed ? '10px 16px' : '10px 12px',
                  borderRadius: '10px', position: 'relative',
                  background: isActive ? `${item.color}15` : 'transparent',
                  border: isActive ? `1px solid ${item.color}25` : '1px solid transparent',
                  transition: 'background 0.2s, border 0.2s'
                }}
              >
                {isActive && (
                  <motion.div layoutId="sidebar-active"
                    style={{ position:'absolute', left:0, top:'20%', width:'3px', height:'60%',
                      background:`linear-gradient(180deg, ${item.color}, ${item.color}80)`,
                      borderRadius:'0 3px 3px 0' }}
                    transition={{ type:'spring', stiffness:400, damping:30 }} />
                )}
                <span style={{ fontSize:'16px', flexShrink:0 }}>{item.icon}</span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      exit={{ opacity:0, x:-8 }} transition={{ duration:0.15 }}
                      style={{ fontSize:'12px', fontWeight:isActive?650:450,
                        color:isActive?'#f1f5f9':'#94a3b8', whiteSpace:'nowrap' }}>{item.label}</motion.span>
                  )}
                </AnimatePresence>
                {/* Collapsed tooltip */}
                <AnimatePresence>
                  {sidebarCollapsed && hovered === item.path && (
                    <motion.div initial={{ opacity:0, x:-8, scale:0.9 }} animate={{ opacity:1, x:0, scale:1 }}
                      exit={{ opacity:0, x:-8, scale:0.9 }}
                      style={{ position:'absolute', left:'58px', top:'50%', transform:'translateY(-50%)',
                        background:'#1e293b', border:'1px solid rgba(255,255,255,0.1)',
                        padding:'5px 12px', borderRadius:'8px', fontSize:'11px', fontWeight:600,
                        color:'#f1f5f9', whiteSpace:'nowrap', zIndex:200,
                        boxShadow:'0 8px 20px rgba(0,0,0,0.3)' }}>{item.label}</motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px 6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(239,68,68,0.1)', x: 3 }}
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '11px',
            padding: sidebarCollapsed ? '10px 16px' : '10px 12px',
            borderRadius: '10px', width: '100%',
            background: 'transparent', border: 'none',
            color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 600
          }}
        >
          <span style={{ fontSize: '16px' }}>🚪</span>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                style={{ whiteSpace: 'nowrap' }}>Sign Out</motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;