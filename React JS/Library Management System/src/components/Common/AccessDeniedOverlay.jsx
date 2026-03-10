import React from 'react';

const AccessDeniedOverlay = ({ message = 'You do not have permission to view this section.' }) => (
  <div
    style={{
      width: '100%',
      border: '1px solid rgba(248, 113, 113, 0.35)',
      borderRadius: '16px',
      background: 'rgba(127, 29, 29, 0.22)',
      padding: '28px',
      textAlign: 'center',
    }}
  >
    <h3 style={{ margin: 0, color: '#fecaca' }}>Access Denied</h3>
    <p style={{ margin: '10px 0 0', color: '#fca5a5' }}>{message}</p>
  </div>
);

export default AccessDeniedOverlay;
