import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiZap } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

const ROLE_OPTIONS = [
  { role: 'CUSTOMER', label: 'Customer', icon: '🛒', desc: 'Shop & order products', color: '#6366f1' },
  { role: 'SELLER', label: 'Seller', icon: '🏪', desc: 'Manage your store', color: '#f59e0b' },
  { role: 'DELIVERY_PARTNER', label: 'Delivery', icon: '🚚', desc: 'Deliver orders', color: '#10b981' },
  { role: 'ADMIN', label: 'Admin', icon: '👑', desc: 'Full system access', color: '#ef4444' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password, selectedRole);
      toast.success(`Welcome back, ${user.name}! 🎉`);

      const routes = {
        ADMIN: '/admin',
        SELLER: '/seller',
        CUSTOMER: '/',
        DELIVERY_PARTNER: '/delivery',
      };
      navigate(routes[user.role] || '/');
    } catch (err) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setLoading(true);
    try {
      const emails = {
        CUSTOMER: 'ananya.desai@gmail.com',
        SELLER: 'priya.sharma@store.com',
        ADMIN: 'rajesh.kumar@store.com',
        DELIVERY_PARTNER: 'raju.yadav@freshmart.com',
      };
      const user = await login(emails[role], 'demo123', role);
      toast.success(`Logged in as ${user.name}! 🎉`);
      const routes = { ADMIN: '/admin', SELLER: '/seller', CUSTOMER: '/', DELIVERY_PARTNER: '/delivery' };
      navigate(routes[user.role]);
    } catch {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Animation */}
      <div className="login-bg">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="login-bg-circle"
            style={{
              width: Math.random() * 400 + 100,
              height: Math.random() * 400 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, -20, 30, 0],
              y: [0, -20, 30, -10, 0],
              scale: [1, 1.1, 0.9, 1.05, 1],
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="login-header">
          <motion.div
            className="login-logo"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <FiZap size={28} />
          </motion.div>
          <h1>Welcome to FreshMart</h1>
          <p>Sign in to continue shopping</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          {ROLE_OPTIONS.map((option) => (
            <motion.button
              key={option.role}
              className={`role-option ${selectedRole === option.role ? 'active' : ''}`}
              onClick={() => setSelectedRole(option.role)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={selectedRole === option.role ? { borderColor: option.color, background: `${option.color}10` } : {}}
            >
              <span className="role-icon">{option.icon}</span>
              <span className="role-label">{option.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <FiMail className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="forgot-link">Forgot password?</a>
          </div>

          <motion.button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.div
                className="btn-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <>
                Sign In <FiArrowRight size={18} />
              </>
            )}
          </motion.button>
        </form>

        {/* Quick Login */}
        <div className="quick-login">
          <p className="divider-text"><span>Quick Demo Login</span></p>
          <div className="quick-login-buttons">
            {ROLE_OPTIONS.map((option) => (
              <motion.button
                key={option.role}
                className="quick-login-btn"
                onClick={() => handleQuickLogin(option.role)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{ borderColor: `${option.color}40` }}
                disabled={loading}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Register Link */}
        <p className="login-footer-text">
          New to FreshMart? <Link to="/register" className="register-link">Create Account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
