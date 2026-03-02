import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiMail, FiEye, FiEyeOff, FiArrowRight, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '', password: '', email: '', fullName: '', roleName: 'STUDENT',
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const getApiErrorMessage = (error, fallback) => {
    const responseData = error?.response?.data;
    const status = error?.response?.status;
    const requestUrl = (error?.config?.url || '').toLowerCase();
    const isRegisterRequest = requestUrl.includes('/auth/register');

    if (status === 500 && isRegisterRequest) {
      return 'Registration is temporarily unavailable on the backend. Please contact the backend admin.';
    }

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }
    if (responseData?.message) {
      return responseData.message;
    }
    if (responseData?.error) {
      return responseData.error;
    }
    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
      const firstError = responseData.errors[0];
      if (typeof firstError === 'string') {
        return firstError;
      }
      if (firstError?.message) {
        return firstError.message;
      }
    }

    return status ? `${fallback} (HTTP ${status})` : fallback;
  };

  const normalizeAuthPayload = (data = {}) => {
    const nestedUser = data.user && typeof data.user === 'object' ? data.user : {};
    const token = data.token
      || data.accessToken
      || data.jwt
      || data.jwtToken
      || nestedUser.token
      || nestedUser.accessToken;

    if (!token) {
      return null;
    }

    return {
      ...nestedUser,
      ...data,
      token,
      username: data.username || nestedUser.username || '',
      fullName: data.fullName || nestedUser.fullName || data.name || nestedUser.name || '',
      role: data.role || data.roleName || nestedUser.role || nestedUser.roleName || '',
      permissions: Array.isArray(data.permissions)
        ? data.permissions
        : (Array.isArray(nestedUser.permissions) ? nestedUser.permissions : []),
    };
  };

  const resolveRoleId = async (roleName) => {
    const roleHints = {
      STUDENT: ['student'],
      VIEWER: ['viewer', 'read-only', 'read only'],
    };

    try {
      const response = await API.get('/roles');
      const roles = Array.isArray(response.data) ? response.data : [];
      if (!roles.length) {
        return null;
      }

      const normalizedRoleName = roleName.toUpperCase();
      const exactMatch = roles.find(
        (role) => (role.roleName || '').toUpperCase() === normalizedRoleName
      );
      if (exactMatch?.roleID) {
        return exactMatch.roleID;
      }

      const hints = roleHints[normalizedRoleName] || [normalizedRoleName.toLowerCase()];
      const descriptionMatch = roles.find((role) => {
        const haystack = `${role.roleName || ''} ${role.description || ''}`.toLowerCase();
        return hints.some((hint) => haystack.includes(hint.toLowerCase()));
      });

      return descriptionMatch?.roleID || null;
    } catch {
      return null;
    }
  };

  const buildRegisterPayloads = (data, roleId) => {
    const basePayload = {
      username: data.username.trim(),
      password: data.password,
      email: data.email.trim(),
      fullName: data.fullName.trim(),
    };

    const payloads = [
      roleId ? { ...basePayload, roleId, confirmPassword: data.password } : null,
      roleId ? { ...basePayload, roleId } : null,
      { ...basePayload, roleName: data.roleName, confirmPassword: data.password },
      { ...basePayload, roleName: data.roleName },
      { ...basePayload, role: data.roleName, confirmPassword: data.password },
      { ...basePayload, role: data.roleName },
      { ...basePayload, name: data.fullName.trim(), roleName: data.roleName },
      roleId ? { ...basePayload, role: roleId } : null,
      roleId ? { ...basePayload, name: data.fullName.trim(), roleId } : null,
    ].filter(Boolean);

    const uniquePayloads = [];
    const seen = new Set();
    payloads.forEach((payload) => {
      const signature = JSON.stringify(payload);
      if (!seen.has(signature)) {
        seen.add(signature);
        uniquePayloads.push(payload);
      }
    });
    return uniquePayloads;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/auth/login', loginData);
      const authPayload = normalizeAuthPayload(response.data);

      if (authPayload) {
        login(authPayload);
        toast.success(`Welcome back, ${authPayload.fullName || authPayload.username || 'User'}! 🎉`);
        navigate(from, { replace: true });
      } else {
        toast.error(response?.data?.message || 'Login failed: invalid server response');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const roleId = await resolveRoleId(registerData.roleName);
      const registerPayloads = buildRegisterPayloads(registerData, roleId);
      let response = null;
      let lastError = null;

      for (const payload of registerPayloads) {
        try {
          response = await API.post('/auth/register', payload);
          break;
        } catch (error) {
          lastError = error;
          const status = error?.response?.status;
          if (status === 500) {
            break;
          }
          if (![400, 404, 409, 415, 422, 500].includes(status)) {
            throw error;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Registration failed');
      }

      const authPayload = normalizeAuthPayload(response.data);
      if (authPayload) {
        login(authPayload);
        toast.success(`Welcome, ${authPayload.fullName || authPayload.username || 'User'}! 🚀`);
        navigate('/', { replace: true });
      } else {
        toast.success(response?.data?.message || 'Registration successful. Please sign in.');
        setIsLogin(true);
        setLoginData({ username: registerData.username, password: '' });
        setShowPassword(false);
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Registration failed. Please check your details.'),
        { toastId: 'register-error' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick login buttons for demo
  const quickLogin = async (username) => {
    setLoginData({ username, password: 'demo' });
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { username, password: 'demo' });
      const authPayload = normalizeAuthPayload(response.data);
      if (authPayload) {
        login(authPayload);
        toast.success(`Welcome, ${authPayload.fullName || authPayload.username || 'User'}! 🎉`);
        navigate('/', { replace: true });
      } else {
        toast.error('Quick login failed: invalid server response');
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Quick login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
    }}>
      <ParticleBackground />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          width: '100%',
          maxWidth: 460,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <motion.div
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
              fontSize: '1.8rem',
            }}
          >
            🎓
          </motion.div>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 800,
            background: 'var(--gradient-1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>
            AdmitFlow
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            College Admission Management System
          </p>
        </div>

        {/* Toggle Tabs */}
        <div style={{
          display: 'flex', padding: '16px 32px 0',
          gap: 8,
        }}>
          {['Login', 'Register'].map((tab, idx) => (
            <motion.button
              key={tab}
              onClick={() => setIsLogin(idx === 0)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                flex: 1, padding: '10px 0',
                borderRadius: 'var(--radius)',
                border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.9rem',
                fontFamily: 'inherit',
                background: (idx === 0 ? isLogin : !isLogin) ? 'var(--gradient-1)' : 'var(--bg-tertiary)',
                color: (idx === 0 ? isLogin : !isLogin) ? 'white' : 'var(--text-secondary)',
                transition: 'var(--transition)',
              }}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '24px 32px 32px' }}>
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
              >
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div style={{ position: 'relative' }}>
                    <FiUser style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 42 }}
                      type="text"
                      placeholder="Enter username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 42, paddingRight: 42 }}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: 0,
                      }}
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '12px', marginTop: 8, fontSize: '0.95rem' }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                    />
                  ) : (
                    <>Sign In <FiArrowRight /></>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleRegister}
              >
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Enter full name"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <FiMail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 42 }}
                      type="email"
                      placeholder="Enter email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="Choose username"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Create password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={registerData.roleName}
                    onChange={(e) => setRegisterData({ ...registerData, roleName: e.target.value })}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </div>

                <motion.button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ width: '100%', padding: '12px', marginTop: 8, fontSize: '0.95rem' }}
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                    />
                  ) : (
                    <>Create Account <FiUserPlus /></>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Quick Login Demo Buttons */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Quick Demo Login
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { user: 'superadmin', label: '👑 Super', color: '#f59e0b' },
                { user: 'admin', label: '🔧 Admin', color: '#6366f1' },
                { user: 'sarah_officer', label: '👮 Officer', color: '#ec4899' },
                { user: 'alice_student', label: '🎓 Student', color: '#10b981' },
                { user: 'viewer_user', label: '👁️ Viewer', color: '#06b6d4' },
              ].map((item) => (
                <motion.button
                  key={item.user}
                  onClick={() => quickLogin(item.user)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '8px 6px', borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${item.color}30`,
                    background: `${item.color}10`,
                    color: item.color, cursor: 'pointer',
                    fontSize: '0.72rem', fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  {item.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
