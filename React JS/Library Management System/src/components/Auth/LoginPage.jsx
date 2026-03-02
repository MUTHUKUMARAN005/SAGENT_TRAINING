// src/components/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import FloatingParticles from '../Common/FloatingParticles';
import RoleBadge from '../Common/RoleBadge';
import LoadingSpinner from '../Common/LoadingSpinner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(true);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const quickLogin = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  const inputStyle = {
    width: '100%', padding: '13px 16px 13px 44px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px', color: '#f1f5f9',
    fontSize: '14px', outline: 'none',
    transition: 'all 0.3s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', position: 'relative'
    }}>
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.25,0.46,0.45,0.94] }}
        style={{
          width: '100%', maxWidth: '460px', padding: '20px',
          position: 'relative', zIndex: 10
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          style={{ textAlign: 'center', marginBottom: '32px' }}
        >
          <motion.div
            animate={{ rotateY: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
            style={{
              width: '72px', height: '72px', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #6366f1, #ec4899)',
              borderRadius: '20px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '36px',
              boxShadow: '0 8px 30px rgba(99,102,241,0.4)'
            }}
          >
            📖
          </motion.div>
          <h1 style={{
            fontSize: '26px', fontWeight: 900,
            background: 'linear-gradient(135deg, #f1f5f9, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Library Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
            Sign in to your account
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px', padding: '32px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>👤</span>
                <input
                  style={inputStyle}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '7px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔒</span>
                <input
                  style={inputStyle}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  style={{
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#f87171', fontSize: '13px',
                    marginBottom: '18px', display: 'flex',
                    alignItems: 'center', gap: '8px'
                  }}
                >
                  ❌ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #ec4899)',
                border: 'none', color: 'white',
                borderRadius: '12px', fontSize: '15px',
                fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? <LoadingSpinner size="small" /> : '🚀 Sign In'}
            </motion.button>
          </form>
        </motion.div>

        {/* Quick Login Credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: '24px' }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCredentials(!showCredentials)}
            style={{
              width: '100%', padding: '10px',
              background: 'transparent',
              border: '1px dashed rgba(255,255,255,0.1)',
              borderRadius: '12px', color: '#64748b',
              fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            {showCredentials ? '🔽' : '▶️'} Demo Credentials
          </motion.button>

          <AnimatePresence>
            {showCredentials && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '8px',
                  marginTop: '12px'
                }}>
                  {[
                    { user: 'admin', pass: 'admin123', role: 'ADMIN', desc: 'Full system access' },
                    { user: 'librarian', pass: 'lib123', role: 'LIBRARIAN', desc: 'Manage books & members' },
                    { user: 'member', pass: 'mem123', role: 'MEMBER', desc: 'View & request books' },
                  ].map((cred, i) => (
                    <motion.div
                      key={cred.user}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, borderColor: 'rgba(99,102,241,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => quickLogin(cred.user, cred.pass)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(30,41,59,0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '12px', cursor: 'pointer',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>{cred.user}</span>
                          <span style={{ color: '#475569', fontSize: '11px' }}>/ {cred.pass}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{cred.desc}</span>
                      </div>
                      <RoleBadge role={cred.role} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;