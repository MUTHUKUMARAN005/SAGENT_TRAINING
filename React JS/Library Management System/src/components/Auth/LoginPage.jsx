// src/components/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import FloatingParticles from '../Common/FloatingParticles';
import RoleBadge from '../Common/RoleBadge';
import LoadingSpinner from '../Common/LoadingSpinner';

const fieldStyle = {
  width: '100%',
  padding: '13px 16px 13px 44px',
  background: 'rgba(13, 31, 53, 0.78)',
  border: '1px solid rgba(157, 181, 209, 0.26)',
  borderRadius: '12px',
  color: '#e8f1fb',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.3s'
};

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '24px'
    }}>
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: '24px' }}
        >
          <div style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 14px',
            background: 'linear-gradient(135deg, #0ea5a4, #3b82f6)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '15px',
            fontWeight: 800,
            color: '#f4faff',
            boxShadow: '0 14px 32px rgba(14, 165, 164, 0.32)'
          }}>
            LM
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#e8f1fb' }}>
            Library Management
          </h1>
          <p style={{ color: '#8ca4bf', fontSize: '13px', marginTop: '5px' }}>
            Sign in to continue
          </p>
          <p style={{ color: '#6f86a1', fontSize: '11px', marginTop: '8px' }}>
            Admin login enforces temporary lockout after repeated failed attempts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'linear-gradient(165deg, rgba(17, 31, 52, 0.94), rgba(8, 20, 36, 0.96))',
            border: '1px solid rgba(157, 181, 209, 0.24)',
            borderRadius: '20px',
            padding: '30px',
            boxShadow: '0 26px 58px rgba(0, 0, 0, 0.42)'
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#9fb4ca',
                textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '7px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 800, color: '#84dcd2' }}>ID</span>
                <input
                  style={fieldStyle}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, color: '#9fb4ca',
                textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '7px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', fontWeight: 800, color: '#93c5fd' }}>PW</span>
                <input
                  style={fieldStyle}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(248, 113, 113, 0.28)',
                    color: '#fda4a4',
                    fontSize: '12px',
                    marginBottom: '16px'
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.015, boxShadow: '0 12px 26px rgba(14, 165, 164, 0.34)' }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? 'rgba(14, 165, 164, 0.35)' : 'linear-gradient(135deg, #0ea5a4, #3b82f6)',
                border: 'none',
                color: 'white',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? <LoadingSpinner size="small" /> : 'Sign In'}
            </motion.button>

            <div style={{
              marginTop: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <Link to="/forgot-password" style={{ color: '#8ec8ff', fontSize: '12px' }}>
                Forgot Password?
              </Link>
              <span style={{ color: '#7d93ad', fontSize: '12px' }}>
                New member? <Link to="/register" style={{ color: '#8df4d8' }}>Register</Link>
              </span>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{ marginTop: '18px' }}
        >
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowCredentials((prev) => !prev)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(12, 24, 40, 0.7)',
              border: '1px dashed rgba(157, 181, 209, 0.24)',
              borderRadius: '12px',
              color: '#8ca4bf',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {showCredentials ? 'Hide' : 'Show'} Demo Credentials
          </motion.button>

          <AnimatePresence>
            {showCredentials && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                  {[
                    { user: 'admin', pass: 'admin123', role: 'ADMIN', desc: 'Full system access' },
                    { user: 'librarian', pass: 'lib123', role: 'LIBRARIAN', desc: 'Manage books and members' },
                    { user: 'member', pass: 'mem123', role: 'MEMBER', desc: 'View and request books' },
                  ].map((cred, i) => (
                    <motion.div
                      key={cred.user}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ scale: 1.01, borderColor: 'rgba(45, 212, 191, 0.35)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => quickLogin(cred.user, cred.pass)}
                      style={{
                        padding: '11px 14px',
                        background: 'rgba(13, 31, 53, 0.76)',
                        border: '1px solid rgba(157, 181, 209, 0.2)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2edf9' }}>{cred.user}</span>
                          <span style={{ color: '#6f86a1', fontSize: '11px' }}>/ {cred.pass}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#8ca4bf' }}>{cred.desc}</span>
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
