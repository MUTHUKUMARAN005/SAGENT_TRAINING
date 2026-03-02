import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiUser, FiSearch, FiHeart, FiBell, FiLogOut, FiPackage, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './CustomerNavbar.css';

const CustomerNavbar = ({ onCartClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav
      className="customer-navbar"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <motion.div
            className="logo-icon-customer"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            🛒
          </motion.div>
          <div className="logo-text-wrap">
            <span className="logo-name">FreshMart</span>
            <span className="logo-tagline">Explore <span className="highlight">Plus</span></span>
          </div>
        </Link>

        {/* Search Bar */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for products, brands and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <motion.button
            type="submit"
            className="search-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Search
          </motion.button>
        </form>

        {/* Right Actions */}
        <div className="navbar-actions">
          {/* User Menu */}
          <div className="navbar-user-menu" onMouseEnter={() => setShowUserMenu(true)} onMouseLeave={() => setShowUserMenu(false)}>
            <motion.button className="nav-action-btn" whileHover={{ scale: 1.05 }}>
              <FiUser size={20} />
              <span className="action-label">{user?.name?.split(' ')[0] || 'Account'}</span>
            </motion.button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="user-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="dropdown-header">
                    <div className="dropdown-avatar" style={{ background: 'var(--gradient-primary)' }}>
                      {user?.avatar || 'U'}
                    </div>
                    <div>
                      <strong>{user?.name}</strong>
                      <p>{user?.email}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <FiUser size={16} /> My Profile
                  </Link>
                  <Link to="/my-orders" className="dropdown-item">
                    <FiPackage size={16} /> My Orders
                  </Link>
                  <Link to="/wishlist" className="dropdown-item">
                    <FiHeart size={16} /> Wishlist
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <FiLogOut size={16} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Cart */}
          <motion.button
            className="nav-action-btn cart-btn"
            onClick={onCartClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="cart-icon-wrap">
              <FiShoppingCart size={20} />
              <motion.span
                className="cart-count"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                key="cart-count"
              >
                3
              </motion.span>
            </div>
            <span className="action-label">Cart</span>
          </motion.button>

          {/* Notifications */}
          <motion.button className="nav-action-btn" whileHover={{ scale: 1.05 }}>
            <FiBell size={20} />
          </motion.button>

          {/* Mobile Menu Toggle */}
          <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(!showMobileMenu)}>
            {showMobileMenu ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Category Bar */}
      <div className="category-bar">
        <div className="category-bar-inner">
          {['Groceries', 'Fruits', 'Vegetables', 'Beverages', 'Bakery', 'Dairy', 'Snacks', 'Personal Care'].map((cat, i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={`/products?category=${cat}`}
                className={`category-link ${location.search.includes(cat) ? 'active' : ''}`}
              >
                {cat}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default CustomerNavbar;