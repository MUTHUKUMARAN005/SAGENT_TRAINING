// src/components/Pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PERMISSIONS, ROLE_CONFIG } from '../../auth/permissions';
import { PermissionGate } from '../../auth/RoleGuard';
import { getDashboardStats } from '../../api/api';
import AnimatedCard from '../Common/AnimatedCard';
import AnimatedCounter from '../Common/AnimatedCounter';
import PageTransition from '../Common/PageTransition';
import LoadingSpinner from '../Common/LoadingSpinner';
import RoleBadge from '../Common/RoleBadge';

const Dashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, checkPermission } = useAuth();
  const navigate = useNavigate();
  const rc = ROLE_CONFIG[user?.role];

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data))
      .catch(() => setStats({
        totalBooks:5, totalMembers:5, activeMembers:4, totalLibraries:5,
        activeBorrowings:3, overdueBorrowings:1, unpaidFines:2,
        totalUnpaidAmount:8.50, pendingRequests:2, availableCopies:3
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const adminStats = [
    { key:'totalBooks', label:'Total Books', icon:'📚', color:'#6366f1', link:'/books' },
    { key:'totalMembers', label:'Members', icon:'👥', color:'#ec4899', link:'/members' },
    { key:'activeMembers', label:'Active Members', icon:'✅', color:'#10b981', link:'/members' },
    { key:'totalLibraries', label:'Libraries', icon:'🏛️', color:'#06b6d4', link:'/libraries' },
    { key:'activeBorrowings', label:'Active Borrows', icon:'🔄', color:'#f59e0b', link:'/borrowings' },
    { key:'overdueBorrowings', label:'Overdue', icon:'⚠️', color:'#ef4444', link:'/borrowings' },
    { key:'unpaidFines', label:'Unpaid Fines', icon:'💰', color:'#f97316', link:'/fines' },
    { key:'pendingRequests', label:'Pending Requests', icon:'📩', color:'#8b5cf6', link:'/requests' },
    { key:'availableCopies', label:'Available Copies', icon:'📋', color:'#14b8a6', link:'/book-copies' },
  ];

  const memberStats = [
    { key:'totalBooks', label:'Books Available', icon:'📚', color:'#6366f1', link:'/books' },
    { key:'activeBorrowings', label:'My Active Borrows', icon:'🔄', color:'#f59e0b', link:'/borrowings' },
    { key:'unpaidFines', label:'My Fines', icon:'💰', color:'#ef4444', link:'/fines' },
    { key:'pendingRequests', label:'My Requests', icon:'📩', color:'#8b5cf6', link:'/requests' },
  ];

  const visibleStats = checkPermission(PERMISSIONS.VIEW_FULL_STATS) ? adminStats : memberStats;

  return (
    <PageTransition>
      {/* Welcome Banner */}
      <motion.div initial={{ opacity:0, y:-25 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6 }}
        style={{ background:`linear-gradient(135deg, ${rc?.color}15, ${rc?.color}08)`,
          border:`1px solid ${rc?.color}20`, borderRadius:'18px',
          padding:'30px 36px', marginBottom:'24px', position:'relative', overflow:'hidden' }}>
        <motion.div animate={{ x:[0,60,0], y:[0,-30,0] }}
          transition={{ duration:10, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'absolute', right:'-20px', top:'-20px', width:'150px', height:'150px',
            background:`radial-gradient(circle, ${rc?.color}20, transparent)`, borderRadius:'50%' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
            <motion.h2 initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}
              style={{ fontSize:'24px', fontWeight:800,
                background:`linear-gradient(135deg, #f1f5f9, #e2e8f0)`,
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Welcome back, {user?.name}
            </motion.h2>
            <RoleBadge role={user?.role} size="lg" />
          </div>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            style={{ color:'#94a3b8', fontSize:'13px' }}>
            {user?.role === 'ADMIN' && 'Full system administration access'}
            {user?.role === 'LIBRARIAN' && 'Manage books, members, and borrowings'}
            {user?.role === 'MEMBER' && 'Browse books, track your borrowings and requests'}
          </motion.p>
        </div>
      </motion.div>

      {/* RBAC Permission Indicator */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
        style={{ marginBottom:'20px', padding:'12px 18px',
          background:'rgba(99,102,241,0.04)', border:'1px solid rgba(99,102,241,0.1)',
          borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'14px' }}>🛡️</span>
        <span style={{ fontSize:'11px', color:'#94a3b8' }}>
          Role: <span style={{ color:rc?.color, fontWeight:700 }}>{rc?.label}</span> •
          You have access to <span style={{ color:'#6366f1', fontWeight:600 }}>{visibleStats.length}</span> dashboard metrics
        </span>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'16px', marginBottom:'24px' }}>
        {visibleStats.map((card, i) => (
          <AnimatedCard key={card.key} delay={i*0.06} onClick={() => navigate(card.link)} glowColor={`${card.color}40`}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:'10px', color:'#64748b', fontWeight:600, textTransform:'uppercase',
                  letterSpacing:'0.06em', marginBottom:'6px' }}>{card.label}</p>
                <div style={{ fontSize:'30px', fontWeight:800, color:card.color }}>
                  <AnimatedCounter end={stats[card.key]||0} />
                </div>
              </div>
              <motion.div whileHover={{ scale:1.15, rotate:8 }}
                style={{ width:'48px', height:'48px',
                  background:`linear-gradient(135deg, ${card.color}, ${card.color}90)`,
                  borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'22px', boxShadow:`0 6px 20px -6px ${card.color}50` }}>{card.icon}</motion.div>
            </div>
            <div style={{ marginTop:'12px', height:'3px', background:'rgba(255,255,255,0.04)',
              borderRadius:'2px', overflow:'hidden' }}>
              <motion.div initial={{ width:0 }}
                animate={{ width:`${Math.min(((stats[card.key]||0)/10)*100,100)}%` }}
                transition={{ duration:1.2, delay:i*0.08, ease:'easeOut' }}
                style={{ height:'100%', borderRadius:'2px',
                  background:`linear-gradient(90deg, ${card.color}, ${card.color}80)` }} />
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Admin-only: Total Unpaid */}
      <PermissionGate permission={PERMISSIONS.VIEW_FULL_STATS}>
        <AnimatedCard delay={0.6}>
          <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
            <motion.div animate={{ scale:[1,1.06,1] }} transition={{ duration:2, repeat:Infinity }}
              style={{ width:'60px', height:'60px', background:'linear-gradient(135deg, #f59e0b, #ef4444)',
                borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'28px', boxShadow:'0 6px 25px rgba(245,158,11,0.3)' }}>💵</motion.div>
            <div>
              <p style={{ fontSize:'10px', color:'#64748b', fontWeight:600, textTransform:'uppercase' }}>Total Unpaid Amount</p>
              <div style={{ fontSize:'36px', fontWeight:900, color:'#f59e0b' }}>
                $<AnimatedCounter end={Math.floor(stats.totalUnpaidAmount||0)} duration={2200} />
                <span style={{ fontSize:'18px', color:'rgba(245,158,11,0.5)' }}>
                  .{String(Math.round(((stats.totalUnpaidAmount||0)%1)*100)).padStart(2,'0')}
                </span>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </PermissionGate>

      {/* Member-only: Quick actions */}
      <PermissionGate permission={PERMISSIONS.CREATE_REQUEST}>
        <div style={{ marginTop:'24px' }}>
          <h3 style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', marginBottom:'12px' }}>Quick Actions</h3>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            {[
              { label:'Browse Books', icon:'📚', path:'/books', color:'#6366f1' },
              { label:'My Borrowings', icon:'🔄', path:'/borrowings', color:'#f59e0b' },
              { label:'New Request', icon:'📩', path:'/requests', color:'#8b5cf6' },
              { label:'My Profile', icon:'👤', path:'/profile', color:'#10b981' },
            ].map((a,i) => (
              <motion.button key={a.label}
                initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.8+i*0.1 }}
                whileHover={{ scale:1.05, y:-2, boxShadow:`0 8px 20px -8px ${a.color}50` }}
                whileTap={{ scale:0.95 }}
                onClick={() => navigate(a.path)}
                style={{ padding:'10px 18px', background:`${a.color}12`, border:`1px solid ${a.color}25`,
                  borderRadius:'11px', color:a.color, fontSize:'12px', fontWeight:600,
                  cursor:'pointer', display:'flex', alignItems:'center', gap:'7px' }}>
                <span>{a.icon}</span>{a.label}
              </motion.button>
            ))}
          </div>
        </div>
      </PermissionGate>
    </PageTransition>
  );
};

export default Dashboard;