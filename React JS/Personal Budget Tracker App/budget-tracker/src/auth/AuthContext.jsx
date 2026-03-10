import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hasPermission } from './permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('budgetUser');
            if (saved) setCurrentUser(JSON.parse(saved));
        } catch (e) {
            localStorage.removeItem('budgetUser');
        }
        setLoading(false);
    }, []);

    const login = useCallback((userData) => {
        setCurrentUser(userData);
        localStorage.setItem('budgetUser', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('budgetUser');
    }, []);

    const updateCurrentUser = useCallback((updates) => {
        setCurrentUser((previous) => {
            if (!previous) return previous;
            const next = { ...previous, ...updates };
            localStorage.setItem('budgetUser', JSON.stringify(next));
            return next;
        });
    }, []);

    const checkPermission = useCallback((permission) => {
        if (!currentUser) return false;
        return hasPermission(currentUser.role, permission);
    }, [currentUser]);

    const isAuthenticated = useCallback(() => {
        return currentUser !== null;
    }, [currentUser]);

    const hasRole = useCallback((role) => {
        if (!currentUser) return false;
        return currentUser.role === role;
    }, [currentUser]);

    return (
        <AuthContext.Provider value={{
            currentUser, loading, login, logout,
            updateCurrentUser, checkPermission, isAuthenticated, hasRole
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

export default AuthContext;
