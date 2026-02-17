import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        setPermissions(new Set(parsed.permissions || []));
      } catch (e) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    setPermissions(new Set(userData.permissions || []));
    localStorage.setItem('auth_user', JSON.stringify(userData));
    localStorage.setItem('auth_token', userData.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions(new Set());
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  }, []);

  const hasPermission = useCallback((permission) => {
    return permissions.has(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionList) => {
    return permissionList.some((p) => permissions.has(p));
  }, [permissions]);

  const hasAllPermissions = useCallback((permissionList) => {
    return permissionList.every((p) => permissions.has(p));
  }, [permissions]);

  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  const isAuthenticated = !!user;

  const value = {
    user,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;