import React from 'react';
import { useAuth } from './AuthContext';
import AccessDenied from '../components/AccessDenied';

const RoleGuard = ({ permission, children }) => {
    const { checkPermission } = useAuth();
    if (!checkPermission(permission)) return <AccessDenied />;
    return children;
};

export const usePermission = (permission) => {
    const { checkPermission } = useAuth();
    return checkPermission(permission);
};

export default RoleGuard;