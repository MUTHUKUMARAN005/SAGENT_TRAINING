import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingCart,
  FiUser,
  FiSearch,
  FiHeart,
  FiBell,
  FiLogOut,
  FiPackage,
  FiMenu,
  FiX,
  FiCreditCard,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import './CustomerNavbar.css';

const CustomerNavbar = ({ onCartClick }) => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
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
                  <Link to="/payments" className="dropdown-item">
                    <FiCreditCard size={16} /> Payments
                  </Link>
                  <Link to="/notifications" className="dropdown-item">
                    <FiBell size={16} /> Notifications
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
                key={totalItems}
              >
                {totalItems}
              </motion.span>
            </div>
            <span className="action-label">Cart</span>
          </motion.button>

          {/* Notifications */}
          <div
            className="navbar-user-menu"
            onMouseEnter={() => setShowNotificationMenu(true)}
            onMouseLeave={() => setShowNotificationMenu(false)}
          >
            <motion.button className="nav-action-btn" whileHover={{ scale: 1.05 }}>
              <div className="cart-icon-wrap">
                <FiBell size={20} />
                {unreadCount > 0 && <span className="cart-count">{unreadCount}</span>}
              </div>
            </motion.button>

            <AnimatePresence>
              {showNotificationMenu && (
                <motion.div
                  className="user-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="dropdown-header" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <strong>Notifications</strong>
                      <p>{unreadCount} unread</p>
                    </div>
                    <button className="dropdown-item" onClick={markAllAsRead} style={{ width: 'auto', padding: 6 }}>
                      Mark all
                    </button>
                  </div>
                  <div className="dropdown-divider" />
                  {(notifications || []).slice(0, 5).map((notification) => (
                    <Link
                      key={notification.id}
                      to={notification.orderId ? `/order/${notification.orderId}` : '/notifications'}
                      className="dropdown-item"
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id);
                        setShowNotificationMenu(false);
                      }}
                      style={{
                        background: notification.read ? 'transparent' : '#eef2ff',
                        alignItems: 'flex-start',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <strong style={{ fontSize: '0.82rem' }}>{notification.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{notification.message}</span>
                    </Link>
                  ))}
                  {notifications.length === 0 && (
                    <div className="dropdown-item" style={{ color: '#64748b' }}>No notifications</div>
                  )}
                  <div className="dropdown-divider" />
                  <Link to="/notifications" className="dropdown-item" onClick={() => setShowNotificationMenu(false)}>
                    View all notifications
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
