import React from 'react';
import { useAuth } from './AuthContext';
import AccessDenied from '../components/AccessDenied';

// Guard component - checks permission before rendering
const RoleGuard = ({ permission, children, fallback }) => {

    const { checkPermission } = useAuth();

    if (!checkPermission(permission)) {
        return fallback || <AccessDenied />;
    }

    return children;
};

// HOC version for wrapping entire pages
export const withRoleGuard = (Component, permission) => {
    return function GuardedComponent(props) {
        const { checkPermission } = useAuth();

        if (!checkPermission(permission)) {
            return <AccessDenied />;
        }

        return <Component {...props} />;
    };
};

// Hook version for conditional rendering within components
export const usePermission = (permission) => {
    const { checkPermission } = useAuth();
    return checkPermission(permission);
};

export default RoleGuard;