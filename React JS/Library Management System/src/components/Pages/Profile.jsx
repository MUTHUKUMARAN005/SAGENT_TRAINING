// src/components/Pages/Profile.jsx
import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import PageTransition from '../Common/PageTransition';
import AnimatedCard from '../Common/AnimatedCard';
import RoleBadge from '../Common/RoleBadge';
import { ROLE_CONFIG } from '../../auth/permissions';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const rc = ROLE_CONFIG[user?.role];
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    avatar: user?.avatar || 'MB'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await updateProfile(form);
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
              { label:'Member ID', value:user?.memberId || 'N/A' },
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
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <h3 style={{ fontSize:'14px', fontWeight:700, color:'#e2e8f0', marginBottom:0 }}>
              Profile Management
            </h3>
            {!editing && (
              <button
                onClick={() => {
                  setForm({
                    name: user?.name || '',
                    email: user?.email || '',
                    avatar: user?.avatar || 'MB'
                  });
                  setError('');
                  setSuccess('');
                  setEditing(true);
                }}
                style={{
                  border: '1px solid rgba(99,102,241,0.3)',
                  background: 'rgba(99,102,241,0.1)',
                  color: '#a5b4fc',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '6px 12px',
                  cursor: 'pointer'
                }}
              >
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSave} style={{ display:'grid', gap:'10px', marginBottom:'18px' }}>
              <input
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.35)',
                  background: 'rgba(15,23,42,0.55)',
                  color: '#e2e8f0',
                  outline: 'none'
                }}
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full name"
                required
              />
              <input
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.35)',
                  background: 'rgba(15,23,42,0.55)',
                  color: '#e2e8f0',
                  outline: 'none'
                }}
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email"
                required
              />
              <input
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(148,163,184,0.35)',
                  background: 'rgba(15,23,42,0.55)',
                  color: '#e2e8f0',
                  outline: 'none'
                }}
                value={form.avatar}
                onChange={(event) => setForm((prev) => ({ ...prev, avatar: event.target.value }))}
                placeholder="Avatar initials (example: MB)"
                required
              />
              {error && <p style={{ margin:0, color:'#f87171', fontSize:'12px' }}>{error}</p>}
              {success && <p style={{ margin:0, color:'#34d399', fontSize:'12px' }}>{success}</p>}
              <div style={{ display:'flex', gap:'8px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: 'none',
                    background: saving ? '#475569' : 'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  style={{
                    border: '1px solid rgba(148,163,184,0.35)',
                    background: 'transparent',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <p style={{ color:'#94a3b8', fontSize:'12px', marginBottom:'16px' }}>
              Update your name, email, and avatar initials from this page.
            </p>
          )}
        </AnimatedCard>
      </div>
    </PageTransition>
  );
};

export default Profile;
