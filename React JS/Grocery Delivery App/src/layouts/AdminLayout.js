import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import FloatingParticles from '../components/common/FloatingParticles';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig } from '../utils/roleConfig';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const config = getRoleConfig(user?.role);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      <Sidebar menuItems={config.sidebar} role={user?.role} />
      <main style={{ flex: 1, marginLeft: 280, padding: 32, position: 'relative', overflow: 'hidden' }}>
        <FloatingParticles />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: 16,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <FiLogOut size={16} />
            Logout
          </button>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
