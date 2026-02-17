import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasPermission } from './permissions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on app start
    useEffect(() => {
        const savedUser = localStorage.getItem('budgetUser');
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('budgetUser');
            }
        }
        setLoading(false);
    }, []);

    // Login
    const login = (userData) => {
        setCurrentUser(userData);
        localStorage.setItem('budgetUser', JSON.stringify(userData));
    };

    // Logout
    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('budgetUser');
    };

    // Check permission
    const checkPermission = (permission) => {
        if (!currentUser) return false;
        return hasPermission(currentUser.role, permission);
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return currentUser !== null;
    };

    // Check if user has specific role
    const hasRole = (role) => {
        if (!currentUser) return false;
        return currentUser.role === role;
    };

    const value = {
        currentUser,
        loading,
        login,
        logout,
        checkPermission,
        isAuthenticated,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;