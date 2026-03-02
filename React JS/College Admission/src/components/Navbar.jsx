import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiBell, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully 👋');
    navigate('/login');
  };

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <motion.div
          className="navbar-brand"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="logo-icon">
            <span>🎓</span>
          </div>
          AdmitFlow
        </motion.div>
      </Link>

      <div className="navbar-right">
        <div className="navbar-search">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Search..." />
        </div>

        {/* Role Badge */}
        <motion.div
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary-light)',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
          whileHover={{ scale: 1.05 }}
        >
          {user?.role || 'GUEST'}
        </motion.div>

        <motion.div
          className="notification-bell"
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
        >
          <FiBell size={18} />
          <span className="badge">3</span>
        </motion.div>

        <motion.div
          className="user-avatar"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={user?.fullName}
        >
          {user?.fullName?.charAt(0) || '?'}
        </motion.div>

        <motion.button
          onClick={handleLogout}
          className="btn btn-ghost btn-icon"
          whileHover={{ scale: 1.1, color: 'var(--danger)' }}
          whileTap={{ scale: 0.9 }}
          title="Logout"
          style={{ color: 'var(--text-secondary)' }}
        >
          <FiLogOut size={18} />
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;