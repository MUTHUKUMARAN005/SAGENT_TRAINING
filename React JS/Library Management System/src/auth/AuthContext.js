import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { hasPermission, hasAnyPermission, ROLES, ROLE_CONFIG } from './permissions';

const AuthContext = createContext(null);

// Demo users for testing
const DEMO_USERS = {
  admin: {
    id: 'USR001',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    email: 'admin@library.org',
    role: ROLES.ADMIN,
    avatar: '👑',
    memberId: null,
    libraryId: null
  },
  librarian: {
    id: 'USR002',
    username: 'librarian',
    password: 'lib123',
    name: 'Sarah Mitchell',
    email: 'sarah@citylib.org',
    role: ROLES.LIBRARIAN,
    avatar: '📖',
    memberId: null,
    libraryId: 'LIB001'
  },
  member: {
    id: 'USR003',
    username: 'member',
    password: 'mem123',
    name: 'Alice Johnson',
    email: 'alice@email.com',
    role: ROLES.MEMBER,
    avatar: '👤',
    memberId: 'MEM001',
    libraryId: null
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('library_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('library_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = Object.values(DEMO_USERS).find(
          u => u.username === username && u.password === password
        );
        if (foundUser) {
          const userData = { ...foundUser };
          delete userData.password;
          setUser(userData);
          localStorage.setItem('library_user', JSON.stringify(userData));
          resolve(userData);
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 800); // Simulate API delay
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('library_user');
  }, []);

  const checkPermission = useCallback((permission) => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const checkAnyPermission = useCallback((permissions) => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user]);

  const isAuthenticated = !!user;
  const roleConfig = user ? ROLE_CONFIG[user.role] : null;

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, loading, isAuthenticated,
      login, logout,
      checkPermission, checkAnyPermission,
      roleConfig,
      sidebarCollapsed, toggleSidebar
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};