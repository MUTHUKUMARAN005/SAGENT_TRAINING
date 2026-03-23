import React, { createContext, useContext, useState, useEffect } from 'react';
import { normalizeRole } from '../utils/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const sanitizeUser = (userData) => {
    if (!userData) return null;
    return {
      ...userData,
      role: normalizeRole(userData.role),
    };
  };

  useEffect(() => {
    const stored = localStorage.getItem('kindwave_user');
    if (stored) {
      try {
        setUser(sanitizeUser(JSON.parse(stored)));
      } catch (_error) {
        localStorage.removeItem('kindwave_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const sanitized = sanitizeUser(userData);
    setUser(sanitized);
    localStorage.setItem('kindwave_user', JSON.stringify(sanitized));
  };

  const updateUser = (partialUserData) => {
    setUser((current) => {
      const next = sanitizeUser({ ...(current || {}), ...(partialUserData || {}) });
      if (next) {
        localStorage.setItem('kindwave_user', JSON.stringify(next));
      } else {
        localStorage.removeItem('kindwave_user');
      }
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kindwave_user');
  };

  const value = {
    user,
    login,
    updateUser,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isNGO: user?.role === 'ngo',
    isDonor: user?.role === 'donor',
    isVolunteer: user?.role === 'volunteer',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
