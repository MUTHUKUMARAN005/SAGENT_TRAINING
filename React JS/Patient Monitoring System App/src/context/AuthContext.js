import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const normalizeRole = (role) => String(role || '').toUpperCase().replace(/^ROLE_/, '');

const normalizeUserId = (rawUserId) => {
  if (rawUserId === null || rawUserId === undefined || rawUserId === '') return null;
  if (typeof rawUserId === 'number' && Number.isFinite(rawUserId)) return rawUserId;
  const text = String(rawUserId).trim();
  if (!text) return null;
  const numeric = Number(text);
  return Number.isFinite(numeric) ? numeric : text;
};

const normalizeAuthData = (data = {}) => {
  const token = data.token || data.accessToken || data.jwt || '';
  const email = data.email || data.user?.email || '';
  const role = normalizeRole(data.role || data.user?.role || '');
  const rawUserId = data.userId ?? data.id ?? data.user?.userId ?? data.user?.id;
  const userId = normalizeUserId(rawUserId);
  const name = data.name || data.user?.name || data.user?.fullName || '';

  return { token, email, role, userId, name };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');
    const userId = normalizeUserId(localStorage.getItem('userId'));
    const name = localStorage.getItem('name');

    if (token && email && role) {
      setUser({
        token,
        email,
        role: normalizeRole(role),
        userId,
        name,
      });
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    const authData = normalizeAuthData(data);

    if (!authData.token || !authData.email || !authData.role) {
      throw new Error('Invalid login response from server');
    }

    localStorage.setItem('token', authData.token);
    localStorage.setItem('email', authData.email);
    localStorage.setItem('role', authData.role);
    localStorage.setItem('userId', authData.userId === null ? '' : String(authData.userId));
    localStorage.setItem('name', authData.name || authData.email);
    setUser({
      ...authData,
      name: authData.name || authData.email,
    });
  };

  const updateUserProfile = (partialData = {}) => {
    setUser((prev) => {
      if (!prev) return prev;

      const nextUser = {
        ...prev,
        ...partialData,
      };

      if (typeof nextUser.token === 'string') localStorage.setItem('token', nextUser.token);
      if (typeof nextUser.email === 'string') localStorage.setItem('email', nextUser.email);
      if (typeof nextUser.role === 'string') {
        nextUser.role = normalizeRole(nextUser.role);
        localStorage.setItem('role', nextUser.role);
      }
      localStorage.setItem('userId', nextUser.userId === null ? '' : String(nextUser.userId));
      localStorage.setItem('name', nextUser.name || nextUser.email || 'User');
      return nextUser;
    });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
