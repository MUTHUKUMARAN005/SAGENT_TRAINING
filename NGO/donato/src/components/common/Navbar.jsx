import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDashboardPathByRole, normalizeRole, USER_ROLES } from '../../utils/roles';
import LanguageSelector from './LanguageSelector';
import ProfileDropdown from './ProfileDropdown';
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiHeart,
  FiSettings,
  FiGrid,
  FiMap,
  FiBell,
  FiSearch,
  FiFileText,
} from 'react-icons/fi';

const Navbar = () => {
  // ============================================
  // State & Hooks
  // ============================================
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(3); // Simulated notification count

  const { user, isAuthenticated, logout } = useAuth();
  const { t, language, setLanguage, languages } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedUserRole = normalizeRole(user?.role);
  const isAdminUser = isAuthenticated && normalizedUserRole === 'admin';
  const isVolunteerUser = isAuthenticated && normalizedUserRole === USER_ROLES.VOLUNTEER;
  const dashboardPath = getDashboardPathByRole(user?.role);
  const shouldShowPublicNavigation = !isAdminUser;

  // ============================================
  // Navigation Links (translated)
  // ============================================
  const navigationLinks = shouldShowPublicNavigation
    ? [
        { name: t('nav_home'), path: '/' },
        { name: t('nav_campaigns'), path: '/campaigns' },
        { name: t('nav_map'), path: '/map' },
        { name: t('nav_about'), path: '/about' },
        { name: t('nav_contact'), path: '/contact' },
      ]
    : [];

  // ============================================
  // Scroll Detection
  // ============================================
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================
  // Close menus on route change
  // ============================================
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setSearchQuery('');
  }, [location]);

  // ============================================
  // Keyboard shortcut for search (Ctrl+K)
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        if (isAdminUser) return;
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isAdminUser]);

  // ============================================
  // Lock body scroll when mobile menu open
  // ============================================
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (isAdminUser) {
      setSearchOpen(false);
    }
  }, [isAdminUser]);

  // ============================================
  // Handlers
  // ============================================
  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (isAdminUser) {
        navigate(dashboardPath);
        setSearchOpen(false);
        return;
      }

      if (searchQuery.trim()) {
        navigate(`/campaigns?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
        setSearchQuery('');
      }
    },
    [dashboardPath, isAdminUser, navigate, searchQuery]
  );

  // ============================================
  // Profile Menu Items
  // ============================================
  const profileMenuItems = [
    {
      icon: FiGrid,
      label: t('nav_dashboard'),
      path: dashboardPath,
      color: 'text-slate-300',
    },
    ...(!isAdminUser && !isVolunteerUser
      ? [
          {
            icon: FiFileText,
            label: t('receipt_title'),
            path: '/receipt',
            color: 'text-slate-300',
          },
          {
            icon: FiMap,
            label: t('nav_map'),
            path: '/map',
            color: 'text-slate-300',
          },
      ]
      : []),
    {
      icon: FiSettings,
      label: 'Settings',
      path: '/settings',
      color: 'text-slate-300',
    },
  ];

  // ============================================
  // Render
  // ============================================
  return (
    <>
      {/* ========== Main Navbar ========== */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10'
            : 'bg-transparent'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* ---- Logo ---- */}
            <Link to={isAdminUser ? dashboardPath : '/'} className="flex items-center gap-2.5 group shrink-0" aria-label="KindWave Home">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl 
                           flex items-center justify-center shadow-glow group-hover:shadow-glow-lg 
                           transition-shadow"
              >
                <FiHeart className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-xl font-heading font-bold leading-none text-white">KindWave</span>
                <span className="text-[9px] text-slate-500 font-medium tracking-wider hidden sm:block">
                  {t('app_tagline')}
                </span>
              </div>
            </Link>

            {/* ---- Desktop Navigation Links ---- */}
            {shouldShowPublicNavigation && (
              <div className="hidden lg:flex items-center gap-1">
                {navigationLinks.map((link) => {
                  const isActive =
                    link.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(link.path);

                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-300 
                             group rounded-lg ${
                               isActive
                                 ? 'text-white'
                                 : 'text-slate-400 hover:text-white'
                             }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.name}

                      {/* Active Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavIndicator"
                          className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r 
                                 from-primary-500 to-blue-400 rounded-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}

                      {/* Hover Indicator */}
                      <span
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500/30 
                               rounded-full scale-x-0 group-hover:scale-x-100 
                               transition-transform duration-300 origin-left"
                      />
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ---- Right Side Actions ---- */}
            <div className="flex items-center gap-2">
              {/* Search Button (Desktop) */}
              {shouldShowPublicNavigation && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchOpen(true)}
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 
                         border border-white/10 hover:border-white/20 transition-all text-sm 
                         text-slate-400 hover:text-slate-300"
                  aria-label="Search campaigns"
                >
                  <FiSearch className="w-4 h-4" />
                  <span className="text-xs">{t('search')}...</span>
                  <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 
                             rounded bg-white/5 text-[10px] text-slate-500 font-mono 
                             border border-white/10">
                    ⌘K
                  </kbd>
                </motion.button>
              )}

              {/* Language Selector (Desktop) */}
              <div className="hidden md:block">
                <LanguageSelector />
              </div>

              {/* Notification Bell */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(isAuthenticated ? '/notifications' : '/login')}
                className="relative p-2 rounded-xl bg-white/5 border border-white/10 
                         text-slate-400 hover:text-white hover:border-white/20 
                         transition-all flex"
                aria-label={
                  notifications > 0
                    ? `${notifications} notifications`
                    : 'Notifications'
                }
              >
                <FiBell className="w-4 h-4" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full 
                                 text-[9px] text-white font-bold flex items-center justify-center 
                                 border-2 border-dark-bg">
                    {notifications}
                  </span>
                )}
              </motion.button>

              {/* Auth Buttons / Profile */}
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white 
                               transition-colors rounded-xl hover:bg-white/5"
                    >
                      {t('nav_login')}
                    </motion.button>
                  </Link>
                  <Link to="/register">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-primary-600 
                               to-blue-600 text-white rounded-xl shadow-glow hover:shadow-glow-lg 
                               transition-all"
                    >
                      {t('nav_register')}
                    </motion.button>
                  </Link>
                </div>
              )}

              {/* Mobile Search */}
              {shouldShowPublicNavigation && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400 
                         hover:text-white transition-colors"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  <FiSearch className="w-5 h-5" />
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                <AnimatePresence mode="wait">
                  {mobileOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FiX className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <FiMenu className="w-6 h-6 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ========== Search Overlay (Command Palette Style) ========== */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
            onClick={() => setSearchOpen(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Search Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl mx-4 glass-card shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSearch}>
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <FiSearch className="w-5 h-5 text-primary-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`${t('search')} ${t('nav_campaigns').toLowerCase()}, NGOs...`}
                    className="flex-1 bg-transparent text-white placeholder-slate-500 
                             focus:outline-none text-base"
                    autoFocus
                  />
                  <kbd className="hidden sm:inline-flex px-2 py-1 rounded-md bg-white/5 
                               text-[10px] text-slate-500 font-mono border border-white/10">
                    ESC
                  </kbd>
                </div>
              </form>

              {/* Quick Links */}
              {shouldShowPublicNavigation && (
                <div className="p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium 
                           px-2 mb-2">
                    Quick Links
                  </p>
                  {[
                    { icon: FiGrid, label: t('nav_campaigns'), path: '/campaigns' },
                    { icon: FiMap, label: t('nav_map'), path: '/map' },
                    { icon: FiHeart, label: t('donate_title'), path: '/donate' },
                    { icon: FiFileText, label: t('receipt_title'), path: '/receipt' },
                  ].map((link, idx) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={idx}
                        to={link.path}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm 
                             text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========== Mobile Sidebar Menu ========== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 bottom-0 w-[300px] sm:w-[340px] bg-dark-bg 
                       border-l border-white/5 overflow-y-auto"
            >
              {/* Mobile Header */}
              <div className="sticky top-0 bg-dark-bg/95 backdrop-blur-xl z-10 px-5 pt-5 pb-3 
                            border-b border-white/5">
                <div className="flex items-center justify-between">
                  <Link
                    to={isAdminUser ? dashboardPath : '/'}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-blue-600 
                                  rounded-lg flex items-center justify-center">
                      <FiHeart className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-heading font-bold text-white">KindWave</span>
                  </Link>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
                    aria-label="Close menu"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* User Info (if authenticated) */}
              {isAuthenticated && (
                <div className="px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 
                                  to-blue-600 flex items-center justify-center text-white 
                                  font-bold text-lg">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{user?.name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full 
                                   bg-primary-500/10 text-primary-400 text-[10px] font-medium 
                                   capitalize">
                        {user?.role}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              {shouldShowPublicNavigation && (
                <div className="px-4 py-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium 
                           px-2 mb-2">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {navigationLinks.map((link, idx) => {
                      const isActive =
                        link.path === '/'
                          ? location.pathname === '/'
                          : location.pathname.startsWith(link.path);

                      return (
                        <motion.div
                          key={link.path}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <Link
                            to={link.path}
                            onClick={() => setMobileOpen(false)}
                            className={`block px-4 py-3 rounded-xl text-base font-medium 
                                   transition-all ${
                                     isActive
                                       ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                                       : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                   }`}
                          >
                            {link.name}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {isAuthenticated && !isAdminUser && !isVolunteerUser && (
                <div className="px-4 py-3 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium 
                             px-2 mb-2">
                    Quick Actions
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: FiHeart, label: t('hero_cta_donate'), path: '/donate' },
                      { icon: FiMap, label: t('nav_map'), path: '/map' },
                      { icon: FiFileText, label: t('receipt_title'), path: '/receipt' },
                    ].map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <Link
                          key={idx}
                          to={action.path}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 p-3 rounded-xl bg-white/3 
                                 hover:bg-white/5 transition-colors"
                        >
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-primary-200" />
                          </span>
                          <span className="text-xs text-slate-300">{action.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Language Selector (Mobile) */}
              <div className="px-4 py-4 border-t border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium 
                           px-2 mb-2">
                  Language
                </p>
                <div className="flex gap-2 px-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium text-center 
                               transition-all ${
                                 language === lang.code
                                   ? 'bg-primary-600 text-white shadow-glow'
                                   : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                               }`}
                    >
                      <span className="block text-lg mb-0.5">{lang.flag}</span>
                      <span className="text-xs">{lang.nativeLabel}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth Buttons / Logout */}
              <div className="px-4 py-4 border-t border-white/5">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      to={dashboardPath}
                      onClick={() => setMobileOpen(false)}
                      className="block w-full"
                    >
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        className="w-full btn-primary py-3 text-sm flex items-center 
                                 justify-center gap-2"
                      >
                        <FiGrid className="w-4 h-4" />
                        {t('nav_dashboard')}
                      </motion.button>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full py-3 border border-red-500/30 text-red-400 rounded-xl 
                               text-sm font-medium hover:bg-red-500/10 transition-colors 
                               flex items-center justify-center gap-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      {t('nav_logout')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full"
                    >
                      <button className="w-full btn-secondary py-3 text-sm">
                        {t('nav_login')}
                      </button>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full"
                    >
                      <button className="w-full btn-primary py-3 text-sm">
                        {t('nav_register')}
                      </button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer Info */}
              <div className="px-6 py-4 text-center">
                <p className="text-[10px] text-slate-600">
                  © {new Date().getFullYear()} KindWave. {t('footer_made_with')} {t('footer_in')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
