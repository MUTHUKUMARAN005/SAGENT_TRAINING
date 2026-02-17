// src/components/Layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import RoleBadge from '../Common/RoleBadge';

const titles = {
  '/': 'Dashboard', '/books': 'Books', '/authors': 'Authors',
  '/members': 'Members', '/libraries': 'Libraries', '/librarians': 'Librarians',
  '/book-copies': 'Book Copies', '/catalog': 'Catalog',
  '/borrowings': 'Borrowings', '/fines': 'Fines',
  '/requests': 'Requests', '/notifications': 'Notifications',
  '/profile': 'My Profile'
};

const Header = () => {
  const location = useLocation();
  const { user, sidebarCollapsed } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.header initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
      style={{
        padding:'12px 24px',
        background:'rgba(15,23,42,0.5)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        display:'flex', justifyContent:'space-between', alignItems:'center',
        position:'sticky', top:0, zIndex:50,
        marginLeft: sidebarCollapsed ? '76px' : '256px',
        transition: 'margin-left 0.35s ease'
      }}
    >
      <div>
        <motion.h1 key={location.pathname} initial={{ opacity:0, x:-15 }} animate={{ opacity:1, x:0 }}
          style={{ fontSize:'20px', fontWeight:800,
            background:'linear-gradient(135deg, #f1f5f9, #94a3b8)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          {titles[location.pathname] || 'Library Management'}
        </motion.h1>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <RoleBadge role={user?.role} size="sm" />
        <motion.div animate={{ opacity:[0.6,1,0.6] }} transition={{ duration:3, repeat:Infinity }}
          style={{ padding:'6px 14px', background:'rgba(99,102,241,0.06)',
            border:'1px solid rgba(99,102,241,0.12)', borderRadius:'9px',
            fontSize:'11px', color:'#818cf8', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
          🕐 {time.toLocaleTimeString()}
        </motion.div>
        <motion.div whileHover={{ scale:1.08 }}
          style={{ width:'34px', height:'34px', background:'linear-gradient(135deg, #6366f1, #ec4899)',
            borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'14px', cursor:'pointer' }}>{user?.avatar || '👤'}</motion.div>
      </div>
    </motion.header>
  );
};

export default Header;