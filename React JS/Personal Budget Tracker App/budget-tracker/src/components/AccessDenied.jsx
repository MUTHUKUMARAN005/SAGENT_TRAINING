import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const AccessDenied = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '60vh', textAlign: 'center'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔒</div>
            <h2 style={{ color: '#c62828', marginBottom: 12 }}>Access Denied</h2>
            <p style={{ color: '#666', marginBottom: 8 }}>
                You don't have permission to view this page.
            </p>
            <p style={{ color: '#999', fontSize: '0.85rem', marginBottom: 24 }}>
                Current Role: <strong>{currentUser?.role}</strong>
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default AccessDenied;