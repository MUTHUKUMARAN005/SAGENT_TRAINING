import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { hasPermission, hasAnyPermission, ROLES, ROLE_CONFIG } from './permissions';

const AuthContext = createContext(null);
const USERS_STORAGE_KEY = 'library_users';
const ACTIVE_USER_STORAGE_KEY = 'library_user';
const LOGIN_SECURITY_STORAGE_KEY = 'library_login_security';
const ADMIN_MAX_FAILED_ATTEMPTS = 5;
const ADMIN_LOCK_WINDOW_MS = 5 * 60 * 1000;

// Demo users for testing
const DEMO_USERS = {
  admin: {
    id: 'USR001',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    email: 'admin@library.org',
    role: ROLES.ADMIN,
    avatar: 'SA',
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
    avatar: 'SM',
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
    avatar: 'AJ',
    memberId: 'MEM001',
    libraryId: null
  }
};

const DEFAULT_USERS = Object.values(DEMO_USERS);

const sanitizeUser = (rawUser) => {
  if (!rawUser) return null;
  const userData = { ...rawUser };
  delete userData.password;
  return userData;
};

const parseNumericId = (value, prefix) => {
  if (typeof value !== 'string' || !value.startsWith(prefix)) return null;
  const parsed = Number.parseInt(value.slice(prefix.length), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const generateNextId = (users, fieldName, prefix) => {
  const next = users.reduce((max, item) => {
    const numeric = parseNumericId(item?.[fieldName], prefix);
    return numeric && numeric > max ? numeric : max;
  }, 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

const normalizeUsersPayload = (rawUsers) => (
  Array.isArray(rawUsers) && rawUsers.length
    ? rawUsers
    : DEFAULT_USERS
);

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [loginSecurity, setLoginSecurity] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    let parsedUsers = DEFAULT_USERS;

    if (savedUsers) {
      try {
        parsedUsers = normalizeUsersPayload(JSON.parse(savedUsers));
      } catch {
        parsedUsers = DEFAULT_USERS;
      }
    }

    setUsers(parsedUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsedUsers));

    const savedLoginSecurity = localStorage.getItem(LOGIN_SECURITY_STORAGE_KEY);
    if (savedLoginSecurity) {
      try {
        setLoginSecurity(JSON.parse(savedLoginSecurity));
      } catch {
        localStorage.removeItem(LOGIN_SECURITY_STORAGE_KEY);
      }
    }

    const saved = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        const activeUser = parsedUsers.find((item) => item.id === parsedUser.id);
        if (activeUser) {
          setUser(sanitizeUser(activeUser));
        } else {
          localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persistUsers = useCallback((nextUsers) => {
    setUsers(nextUsers);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
  }, []);

  const updateLoginSecurity = useCallback((updater) => {
    setLoginSecurity((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem(LOGIN_SECURITY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const login = useCallback((username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const normalizedUsername = username?.trim().toLowerCase();
        const securityState = loginSecurity[normalizedUsername];
        const now = Date.now();

        if (securityState?.lockedUntil && now < securityState.lockedUntil) {
          const waitSeconds = Math.ceil((securityState.lockedUntil - now) / 1000);
          reject(new Error(`Admin account temporarily locked. Try again in ${waitSeconds}s`));
          return;
        }

        const foundUser = users.find(
          u => u.username?.toLowerCase() === normalizedUsername && u.password === password
        );
        if (foundUser) {
          if (loginSecurity[normalizedUsername]) {
            updateLoginSecurity((prev) => {
              const next = { ...prev };
              delete next[normalizedUsername];
              return next;
            });
          }
          const userData = sanitizeUser(foundUser);
          setUser(userData);
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(userData));
          resolve(userData);
        } else {
          const targetUser = users.find((item) => item.username?.toLowerCase() === normalizedUsername);
          const isAdminAttempt = normalizedUsername === 'admin' || targetUser?.role === ROLES.ADMIN;

          if (isAdminAttempt && normalizedUsername) {
            updateLoginSecurity((prev) => {
              const current = prev[normalizedUsername] || { failedCount: 0, lockedUntil: null };
              const failedCount = current.failedCount + 1;
              const shouldLock = failedCount >= ADMIN_MAX_FAILED_ATTEMPTS;
              return {
                ...prev,
                [normalizedUsername]: {
                  failedCount: shouldLock ? 0 : failedCount,
                  lockedUntil: shouldLock ? now + ADMIN_LOCK_WINDOW_MS : null
                }
              };
            });
          }
          reject(new Error('Invalid username or password'));
        }
      }, 600); // Simulate API delay
    });
  }, [loginSecurity, updateLoginSecurity, users]);

  const register = useCallback((payload) => {
    const safePayload = payload || {};
    const name = safePayload.name?.trim();
    const email = safePayload.email?.trim().toLowerCase();
    const username = safePayload.username?.trim().toLowerCase();
    const password = safePayload.password;

    if (!name || !email || !username || !password) {
      throw new Error('All registration fields are required');
    }

    const existingUser = users.find((item) => (
      item.username?.toLowerCase() === username || item.email?.toLowerCase() === email
    ));
    if (existingUser) {
      throw new Error('Username or email is already in use');
    }

    const nextUser = {
      id: generateNextId(users, 'id', 'USR'),
      username,
      password,
      name,
      email,
      role: ROLES.MEMBER,
      avatar: 'MB',
      memberId: generateNextId(users.filter((item) => item.memberId), 'memberId', 'MEM'),
      libraryId: null
    };

    const nextUsers = [...users, nextUser];
    persistUsers(nextUsers);

    return sanitizeUser(nextUser);
  }, [persistUsers, users]);

  const resetPassword = useCallback((identifier, newPassword) => {
    const normalizedIdentifier = identifier?.trim().toLowerCase();
    if (!normalizedIdentifier || !newPassword) {
      throw new Error('Username or email and a new password are required');
    }

    const targetIndex = users.findIndex((item) => (
      item.username?.toLowerCase() === normalizedIdentifier || item.email?.toLowerCase() === normalizedIdentifier
    ));
    if (targetIndex < 0) {
      throw new Error('No account found for the provided username/email');
    }

    const nextUsers = users.map((item, index) => (
      index === targetIndex ? { ...item, password: newPassword } : item
    ));
    persistUsers(nextUsers);
  }, [persistUsers, users]);

  const updateProfile = useCallback((payload) => {
    if (!user) throw new Error('You must be logged in');

    const nextName = payload?.name?.trim();
    const nextEmail = payload?.email?.trim().toLowerCase();
    const nextAvatar = payload?.avatar || (payload?.name ? payload.name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') : 'MB');

    if (!nextName || !nextEmail) {
      throw new Error('Name and email are required');
    }

    const duplicateEmailUser = users.find((item) => (
      item.id !== user.id && item.email?.toLowerCase() === nextEmail
    ));
    if (duplicateEmailUser) {
      throw new Error('Email is already in use by another account');
    }

    const nextUsers = users.map((item) => {
      if (item.id !== user.id) return item;
      return {
        ...item,
        name: nextName,
        email: nextEmail,
        avatar: nextAvatar
      };
    });

    persistUsers(nextUsers);

    const updatedLoggedInUser = sanitizeUser(nextUsers.find((item) => item.id === user.id));
    setUser(updatedLoggedInUser);
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(updatedLoggedInUser));
    return updatedLoggedInUser;
  }, [persistUsers, user, users]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
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
      register, resetPassword, updateProfile,
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
