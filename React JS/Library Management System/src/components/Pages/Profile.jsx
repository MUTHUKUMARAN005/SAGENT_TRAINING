// src/components/Pages/Profile.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import PageTransition from '../Common/PageTransition';
import AnimatedCard from '../Common/AnimatedCard';
import RoleBadge from '../Common/RoleBadge';
import { ROLE_PERMISSIONS, ROLE_CONFIG } from '../../auth/permissions';

const Profile = () => {
  const { user } = useAuth();
  const rc = ROLE_CONFIG[user?.role];
  const perms = ROLE_PERMISSIONS[user?.role] || [];

  return (
    <PageTransition>
      <div style={{ maxWidth:'700px' }}>
        <AnimatedCard delay={0}>
          <div style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'24px' }}>
            <motion.div whileHover={{ scale:1.1, rotate:5 }}
              style={{ width:'72px', height:'72px', background:rc?.gradient,
                borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'36px', boxShadow:`0 8px 25px ${rc?.color}40` }}>{user?.avatar}</motion.div>
            <div>
              <h2 style={{ fontSize:'22px', fontWeight:800 }}>{user?.name}</h2>
              <p style={{ color:'#94a3b8', fontSize:'13px', marginBottom:'6px' }}>{user?.email}</p>
              <RoleBadge role={user?.role} size="lg" />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'20px' }}>
            {[
              { label:'User ID', value:user?.id },
              { label:'Username', value:user?.username },
              { label:'Role', value:rc?.label },
              { label:'Permissions', value:`${perms.length} granted` },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:0.1+i*0.08 }}
                style={{ padding:'14px', background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.06)', borderRadius:'12px' }}>
                <p style={{ fontSize:'10px', color:'#64748b', fontWeight:600, textTransform:'uppercase',
                  letterSpacing:'0.06em', marginBottom:'4px' }}>{item.label}</p>
                <p style={{ fontSize:'14px', fontWeight:600, color:'#e2e8f0' }}>{item.value}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedCard>

        <AnimatedCard delay={0.2} style={{ marginTop:'16px' }}>
          <h3 style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', marginBottom:'12px' }}>
            🛡️ Your Permissions ({perms.length})
          </h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
            {perms.map((p, i) => (
              <motion.span key={p} initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
                transition={{ delay:0.3+i*0.02 }}
                style={{ padding:'3px 10px', borderRadius:'8px', fontSize:'9px', fontWeight:600,
                  background:'rgba(99,102,241,0.08)', color:'#818cf8',
                  border:'1px solid rgba(99,102,241,0.15)' }}>{p}</motion.span>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </PageTransition>
  );
};

export default Profile;