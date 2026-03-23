import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { getDashboardPathByRole, normalizeRole, USER_ROLES } from '../../utils/roles';
import {
  FiGrid,
  FiSettings,
  FiLogOut,
  FiChevronDown,
} from 'react-icons/fi';

const ProfileDropdown = () => {

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const normalizedUserRole = normalizeRole(user?.role);
  const isAdminUser = isAuthenticated && normalizedUserRole === 'admin';
  const isVolunteerUser = isAuthenticated && normalizedUserRole === USER_ROLES.VOLUNTEER;
  const dashboardPath = getDashboardPathByRole(user?.role);

  const profileMenuItems = [
    {
      icon: FiGrid,
      label: t('nav_dashboard'),
      path: dashboardPath,
      color: 'text-slate-300',
      divider: false,
    },
    {
      icon: FiSettings,
      label: 'Settings',
      path: '/settings',
      color: 'text-slate-300',
      divider: true,
    },
  ];


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);


  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  const handleMenuItemClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  if (!isAuthenticated) {
    return null;
  }


  return (
    <div className="relative profile-dropdown-container" ref={dropdownRef}>
      {/* Profile Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 
                 border border-white/10 hover:border-primary-500/30 transition-all group"
      >
        {/* User Avatar */}
        <div
          className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 
                    flex items-center justify-center text-white text-sm font-bold 
                    shadow-md group-hover:shadow-lg transition-shadow"
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        {/* User Info */}
        <div className="hidden lg:block text-left">
          <p className="text-xs text-white font-medium leading-none">
            {user?.name || 'User'}
          </p>
          <p className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">
            {user?.role || 'donor'}
          </p>
        </div>

        {/* Chevron Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="hidden lg:block ml-1"
        >
          <FiChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-dark-bg/95 
                     backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden 
                     z-50 origin-top-right"
          >
            {/* User Info Header */}
            <div className="px-4 py-4 border-b border-white/5 bg-white/3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 
                            flex items-center justify-center text-white font-bold text-base"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-semibold truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-1 rounded-md 
                               bg-primary-500/15 text-primary-300 text-[10px] font-medium 
                               capitalize">
                    {user?.role || 'donor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {profileMenuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index}>
                    <motion.button
                      whileHover={{ x: 4 }}
                      onClick={() => handleMenuItemClick(item.path)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-sm 
                               text-slate-300 hover:text-white hover:bg-white/5 
                               transition-all text-left group"
                    >
                      <span className="w-5 h-5 flex items-center justify-center 
                                   text-slate-500 group-hover:text-primary-400 
                                   transition-colors">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-slate-600">→</span>
                    </motion.button>

                    {/* Divider */}
                    {item.divider && (
                      <div className="my-2 border-t border-white/5" />
                    )}
                  </div>
                );
              })}

              {/* Logout Button */}
              <motion.button
                whileHover={{ x: 4 }}
                onClick={handleLogout}
                className="w-full px-4 py-3 flex items-center gap-3 text-sm 
                         text-red-300 hover:text-red-200 hover:bg-red-500/10 
                         transition-all text-left group border-t border-white/5"
              >
                <span className="w-5 h-5 flex items-center justify-center 
                             text-red-500/70 group-hover:text-red-400 
                             transition-colors">
                  <FiLogOut className="w-4 h-4" />
                </span>
                <span className="flex-1">Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;

