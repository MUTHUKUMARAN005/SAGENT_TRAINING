import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  clearAuthToken,
  createCustomer,
  createUser,
  getCustomers,
  getDeliveryPersons,
  getAuthToken,
  getCurrentUser,
  getUsers,
  loginUser,
  registerUserApi,
  setAuthToken,
} from '../api/api';

const AuthContext = createContext(null);
const VALID_ROLES = ['ADMIN', 'SELLER', 'CUSTOMER', 'DELIVERY_PARTNER'];
const ROLE_ALIASES = {
  MANAGER: 'SELLER',
  STAFF: 'SELLER',
  DELIVERY: 'DELIVERY_PARTNER',
  DELIVERY_PERSON: 'DELIVERY_PARTNER',
  USER: 'CUSTOMER',
};
const USER_STORAGE_KEY = 'freshmart_user';
const DEMO_AUTH_ENABLED = process.env.REACT_APP_ENABLE_DEMO_AUTH === 'true';

const normalizeRole = (role) => {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toUpperCase();
  if (ROLE_ALIASES[normalized]) return ROLE_ALIASES[normalized];
  return VALID_ROLES.includes(normalized) ? normalized : null;
};

const extractPayload = (response) => response?.data?.data || response?.data || {};
const extractToken = (payload) =>
  payload?.token ||
  payload?.accessToken ||
  payload?.jwt ||
  payload?.authToken ||
  payload?.data?.token ||
  null;
const extractUser = (payload) =>
  payload?.user ||
  payload?.profile ||
  payload?.account ||
  payload?.data?.user ||
  payload?.data?.profile ||
  (payload?.id ? payload : null);

const getDisplayName = (rawUser, fallbackEmail) => {
  if (rawUser?.name) return rawUser.name;
  if (rawUser?.fullName) return rawUser.fullName;
  if (fallbackEmail) return fallbackEmail.split('@')[0];
  return 'User';
};

const normalizeUser = (rawUser = {}, fallback = {}) => {
  const sourceUser = rawUser || {};
  const email = sourceUser.email || fallback.email || '';
  const role = normalizeRole(sourceUser.role || sourceUser.userType || sourceUser.type || fallback.role) || 'CUSTOMER';
  const name = getDisplayName(sourceUser, email);
  const avatar = sourceUser.avatar || name.substring(0, 2).toUpperCase();

  return {
    ...sourceUser,
    email,
    name,
    role,
    avatar,
  };
};

const persistUser = (user, setUserState) => {
  setUserState(user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

const clearSession = (setUserState) => {
  setUserState(null);
  localStorage.removeItem(USER_STORAGE_KEY);
  clearAuthToken();
};

const findByEmail = (items = [], email = '') => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;
  return items.find((item) => item?.email?.trim().toLowerCase() === normalizedEmail) || null;
};

const findDeliveryByEmailHint = (items = [], email = '') => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return items[0] || null;

  const prefix = normalizedEmail.split('@')[0];
  const compactPrefix = prefix.replace(/[._-]/g, '');
  const byName = items.find((person) => {
    const normalizedName = (person?.name || '').toLowerCase().replace(/\s+/g, '');
    return normalizedName && (compactPrefix.includes(normalizedName) || normalizedName.includes(compactPrefix));
  });

  return byName || items[0] || null;
};

const fetchBackendUserByRole = async (email, role) => {
  const requestedRole = normalizeRole(role) || 'CUSTOMER';

  if (requestedRole === 'CUSTOMER') {
    const response = await getCustomers();
    const user = findByEmail(response?.data, email);
    return user ? normalizeUser(user, { email, role: requestedRole }) : null;
  }

  if (requestedRole === 'DELIVERY_PARTNER') {
    const response = await getDeliveryPersons();
    const person = findDeliveryByEmailHint(response?.data, email);
    return person ? normalizeUser({ ...person, email, role: requestedRole }, { email, role: requestedRole }) : null;
  }

  const response = await getUsers();
  const exactEmailUser = findByEmail(response?.data, email);
  if (exactEmailUser) {
    return normalizeUser(exactEmailUser, { email, role: requestedRole });
  }

  const roleMatch = (response?.data || []).find((item) => normalizeRole(item?.userType || item?.role) === requestedRole);
  return roleMatch ? normalizeUser(roleMatch, { email, role: requestedRole }) : null;
};

const getDemoUser = (email, role) => {
  const requestedRole = normalizeRole(role) || 'CUSTOMER';
  const byRole = {
    ADMIN: { id: 1, name: 'Admin User', email: 'admin@freshmart.com', role: 'ADMIN' },
    SELLER: { id: 2, name: 'Seller User', email: 'seller@freshmart.com', role: 'SELLER' },
    DELIVERY_PARTNER: { id: 3, name: 'Delivery User', email: 'delivery@freshmart.com', role: 'DELIVERY_PARTNER' },
    CUSTOMER: { id: 4, name: (email || 'customer').split('@')[0], email, role: 'CUSTOMER' },
  };
  return normalizeUser(byRole[requestedRole], { email, role: requestedRole });
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateSession = async () => {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const role = normalizeRole(parsedUser?.role);
          if (parsedUser && role) {
            setUser({ ...parsedUser, role });
          } else {
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }

      const token = getAuthToken();
      if (token) {
        try {
          const response = await getCurrentUser();
          const payload = extractPayload(response);
          const currentUser = normalizeUser(extractUser(payload) || payload);
          persistUser(currentUser, setUser);
        } catch (err) {
          if (err?.response?.status === 401) {
            clearSession(setUser);
          }
        }
      }

      setLoading(false);
    };

    hydrateSession();
  }, []);

  const login = async (email, password, role) => {
    const requestedRole = normalizeRole(role) || 'CUSTOMER';
    let loginError = null;

    try {
      const response = await loginUser({ email, password, role: requestedRole });
      const payload = extractPayload(response);
      const token = extractToken(payload);
      const currentUser = normalizeUser(extractUser(payload), { email, role: requestedRole });

      persistUser(currentUser, setUser);
      if (token) {
        setAuthToken(token);
      } else {
        clearAuthToken();
      }

      return currentUser;
    } catch (err) {
      loginError = err;
    }

    try {
      const backendUser = await fetchBackendUserByRole(email, requestedRole);
      if (backendUser) {
        persistUser(backendUser, setUser);
        clearAuthToken();
        return backendUser;
      }
    } catch (err) {
      if (!loginError) loginError = err;
    }

    if (!DEMO_AUTH_ENABLED) {
      throw loginError || new Error('Unable to login with backend');
    }

    const fallbackUser = getDemoUser(email, requestedRole);
    persistUser(fallbackUser, setUser);
    return fallbackUser;
  };

  const register = async (userData) => {
    const role = normalizeRole(userData?.role) || 'CUSTOMER';

    try {
      const response = await registerUserApi({ ...userData, role });
      const payload = extractPayload(response);
      const token = extractToken(payload);
      const currentUser = normalizeUser(extractUser(payload), {
        email: userData?.email,
        role,
      });

      persistUser(currentUser, setUser);
      if (token) {
        setAuthToken(token);
      } else {
        clearAuthToken();
      }

      return currentUser;
    } catch (err) {
      if (!DEMO_AUTH_ENABLED) {
        const payload = {
          name: userData?.name,
          email: userData?.email,
          phone: userData?.phone,
        };

        if (role === 'CUSTOMER') {
          await createCustomer(payload);
        } else {
          await createUser({ ...payload, userType: role === 'SELLER' ? 'MANAGER' : role });
        }

        const backendUser = await fetchBackendUserByRole(userData?.email, role);
        if (!backendUser) throw err;
        persistUser(backendUser, setUser);
        clearAuthToken();
        return backendUser;
      }

      const fallbackUser = normalizeUser(
        { id: Date.now(), ...userData, role, loyaltyPoints: 0 },
        { email: userData?.email, role }
      );
      persistUser(fallbackUser, setUser);
      return fallbackUser;
    }
  };

  const logout = () => {
    clearSession(setUser);
  };

  const updateProfile = (updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    persistUser(updatedUser, setUser);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') return user.role === roles;
    return roles.includes(user.role);
  };

  const isAdmin = () => hasRole('ADMIN');
  const isSeller = () => hasRole('SELLER');
  const isCustomer = () => hasRole('CUSTOMER');
  const isDelivery = () => hasRole('DELIVERY_PARTNER');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        hasRole,
        isAdmin,
        isSeller,
        isCustomer,
        isDelivery,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
