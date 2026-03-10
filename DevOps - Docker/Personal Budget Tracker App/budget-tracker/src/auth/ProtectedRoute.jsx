import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    return children;
};

export default ProtectedRoute;