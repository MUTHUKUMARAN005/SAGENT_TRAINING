import React from 'react';

const LoadingSpinner = ({ message = 'Loading...' }) => (
    <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        height: '100vh', background: '#f0f2f5'
    }}>
        <div className="spinner" />
        <p style={{ marginTop: 16, color: '#666' }}>{message}</p>
    </div>
);

export default LoadingSpinner;