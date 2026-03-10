// src/components/Layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import RoleBadge from '../Common/RoleBadge';

const titles = {
  '/': 'Dashboard', '/books': 'Books', '/authors': 'Authors',
  '/members': 'Students', '/categories': 'Categories', '/libraries': 'Libraries', '/librarians': 'Librarians',
  '/book-copies': 'Book Copies', '/catalog': 'Catalog',
  '/borrowings': 'Borrowings', '/fines': 'Fines',
  '/requests': 'Requests', '/notifications': 'Notifications', '/reports': 'Reports',
  '/profile': 'My Profile'
};

const Header = () => {
  const location = useLocation();
  const { user, toggleSidebar, sidebarCollapsed } = useAuth();
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

  const initials = (user?.name || user?.username || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.header initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
      style={{
        padding: isMobile ? '12px 16px' : '14px 28px',
        background:'rgba(8, 18, 32, 0.7)',
        backdropFilter:'blur(18px)',
        borderBottom:'1px solid rgba(157, 181, 209, 0.16)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        position:'sticky', top:0, zIndex:50,
        width:'100%'
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        {isMobile && (
          <button
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
            style={{
              width:'34px',
              height:'34px',
              borderRadius:'9px',
              border:'1px solid rgba(157, 181, 209, 0.28)',
              background:'rgba(13, 31, 53, 0.72)',
              color:'#cfe0f1',
              fontSize:'10px',
              fontWeight:800,
              cursor:'pointer',
              flexShrink:0
            }}
          >
            {sidebarCollapsed ? 'MENU' : 'CLOSE'}
          </button>
        )}
        <div>
        <motion.h1 key={location.pathname} initial={{ opacity:0, x:-15 }} animate={{ opacity:1, x:0 }}
          style={{ fontSize: isMobile ? '18px' : '22px', fontWeight:700, color:'#e8f1fb' }}>
          {titles[location.pathname] || 'Library Management'}
        </motion.h1>
        <p style={{ color:'#89a0ba', fontSize:'12px', marginTop:'2px', display: isMobile ? 'none' : 'block' }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        {!isMobile && <RoleBadge role={user?.role} size="sm" />}
        <motion.div animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:3, repeat:Infinity }}
          style={{ padding:'6px 14px', background:'rgba(14, 165, 164, 0.12)',
            border:'1px solid rgba(45, 212, 191, 0.3)', borderRadius:'10px',
            fontSize:'11px', color:'#7ee4d7', fontWeight:600, fontVariantNumeric:'tabular-nums',
            letterSpacing:'0.03em', display: isMobile ? 'none' : 'block' }}>
          {time.toLocaleTimeString()}
        </motion.div>
        <motion.div whileHover={{ scale:1.08 }}
          style={{ width:'36px', height:'36px', background:'linear-gradient(135deg, #0ea5a4, #3b82f6)',
            borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'12px', cursor:'pointer', color:'#f2f8ff', fontWeight:800 }}>{initials || 'U'}</motion.div>
      </div>
    </motion.header>
  );
};

export default Header;
