import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {

    const { isAuthenticated, loading } = useAuth();

    // Show loading while checking auth
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: '#666'
            }}>
                Loading...
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;