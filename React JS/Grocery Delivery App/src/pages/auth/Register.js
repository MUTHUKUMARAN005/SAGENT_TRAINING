import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiArrowRight, FiZap } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'CUSTOMER',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to FreshMart 🎉');
      const routes = { ADMIN: '/admin', SELLER: '/seller', CUSTOMER: '/', DELIVERY_PARTNER: '/delivery' };
      navigate(routes[form.role] || '/');
    } catch (err) {
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="login-page">
      <div className="login-bg">
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} className="login-bg-circle"
            style={{ width: Math.random() * 300 + 100, height: Math.random() * 300 + 100,
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ x: [0, 20, -20, 0], y: [0, -20, 20, 0] }}
            transition={{ duration: 12 + Math.random() * 8, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div className="login-card" style={{ maxWidth: 520 }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        <div className="login-header">
          <motion.div className="login-logo" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
            <FiZap size={28} />
          </motion.div>
          <h1>Create Account</h1>
          <p>Join FreshMart today</p>
        </div>

        {/* Role Selection */}
        <div className="role-selector">
          {[
            { role: 'CUSTOMER', icon: '🛒', label: 'Customer' },
            { role: 'SELLER', icon: '🏪', label: 'Seller' },
            { role: 'DELIVERY_PARTNER', icon: '🚚', label: 'Delivery' },
          ].map(opt => (
            <motion.button key={opt.role}
              className={`role-option ${form.role === opt.role ? 'active' : ''}`}
              onClick={() => updateField('role', opt.role)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={form.role === opt.role ? { borderColor: '#6366f1', background: 'rgba(99,102,241,0.05)' } : {}}
            >
              <span className="role-icon">{opt.icon}</span>
              <span className="role-label">{opt.label}</span>
            </motion.button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <FiUser className="input-icon" />
            <input placeholder="Full Name" value={form.name}
              onChange={e => updateField('name', e.target.value)} required />
          </div>
          <div className="input-group">
            <FiMail className="input-icon" />
            <input type="email" placeholder="Email" value={form.email}
              onChange={e => updateField('email', e.target.value)} required />
          </div>
          <div className="input-group">
            <FiPhone className="input-icon" />
            <input placeholder="Phone Number" value={form.phone}
              onChange={e => updateField('phone', e.target.value)} />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Password" value={form.password}
              onChange={e => updateField('password', e.target.value)} required />
          </div>
          <div className="input-group">
            <FiLock className="input-icon" />
            <input type="password" placeholder="Confirm Password" value={form.confirmPassword}
              onChange={e => updateField('confirmPassword', e.target.value)} required />
          </div>

          <motion.button type="submit" className="login-submit-btn" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            {loading ? <motion.div className="btn-spinner" animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> :
              <>Create Account <FiArrowRight size={18} /></>}
          </motion.button>
        </form>

        <p className="login-footer-text">
          Already have an account? <Link to="/login" className="register-link">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;