import {
  FiHome, FiShoppingBag, FiUsers, FiShoppingCart, FiMapPin,
  FiPackage, FiCreditCard, FiTruck, FiUserCheck, FiBell,
  FiPercent, FiXCircle, FiBarChart2, FiSettings, FiHeart,
  FiUser, FiNavigation, FiClock
} from 'react-icons/fi';

export const ROLE_CONFIG = {
  ADMIN: {
    label: 'Admin',
    theme: 'dark',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f97316)',
    icon: '👑',
    sidebar: [
      { path: '/admin', icon: FiHome, label: 'Dashboard', color: '#6366f1' },
      { path: '/admin/users', icon: FiUserCheck, label: 'Manage Users', color: '#3b82f6' },
      { path: '/admin/stores', icon: FiMapPin, label: 'Stores', color: '#f59e0b' },
      { path: '/admin/products', icon: FiShoppingBag, label: 'All Products', color: '#ec4899' },
      { path: '/admin/orders', icon: FiShoppingCart, label: 'All Orders', color: '#10b981' },
      { path: '/admin/inventory', icon: FiPackage, label: 'Inventory', color: '#8b5cf6' },
      { path: '/admin/payments', icon: FiCreditCard, label: 'Payments', color: '#06b6d4' },
      { path: '/admin/deliveries', icon: FiTruck, label: 'Deliveries', color: '#f97316' },
      { path: '/admin/discounts', icon: FiPercent, label: 'Discounts', color: '#f43f5e' },
      { path: '/admin/cancellations', icon: FiXCircle, label: 'Cancellations', color: '#ef4444' },
      { path: '/admin/notifications', icon: FiBell, label: 'Notifications', color: '#a855f7' },
    ],
  },
  SELLER: {
    label: 'Seller',
    theme: 'dark',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)',
    icon: '🏪',
    sidebar: [
      { path: '/seller', icon: FiHome, label: 'Dashboard', color: '#6366f1' },
      { path: '/seller/products', icon: FiShoppingBag, label: 'My Products', color: '#ec4899' },
      { path: '/seller/orders', icon: FiShoppingCart, label: 'Orders', color: '#10b981' },
      { path: '/seller/inventory', icon: FiPackage, label: 'Inventory', color: '#8b5cf6' },
      { path: '/seller/analytics', icon: FiBarChart2, label: 'Analytics', color: '#3b82f6' },
      { path: '/seller/notifications', icon: FiBell, label: 'Notifications', color: '#a855f7' },
    ],
  },
  CUSTOMER: {
    label: 'Customer',
    theme: 'light',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
    icon: '🛒',
    navbar: [
      { path: '/', label: 'Home' },
      { path: '/products', label: 'Products' },
      { path: '/my-orders', label: 'My Orders' },
      { path: '/profile', label: 'Profile' },
    ],
  },
  DELIVERY_PARTNER: {
    label: 'Delivery Partner',
    theme: 'dark',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
    icon: '🚚',
    sidebar: [
      { path: '/delivery', icon: FiHome, label: 'Dashboard', color: '#6366f1' },
      { path: '/delivery/assigned', icon: FiTruck, label: 'Assigned', color: '#10b981' },
      { path: '/delivery/history', icon: FiClock, label: 'History', color: '#3b82f6' },
      { path: '/delivery/profile', icon: FiUser, label: 'Profile', color: '#f59e0b' },
    ],
  },
};

export const getRoleConfig = (role) => ROLE_CONFIG[role] || ROLE_CONFIG.CUSTOMER;

export const getHomeRoute = (role) => {
  const routes = {
    ADMIN: '/admin',
    SELLER: '/seller',
    CUSTOMER: '/',
    DELIVERY_PARTNER: '/delivery',
  };
  return routes[role] || '/';
};