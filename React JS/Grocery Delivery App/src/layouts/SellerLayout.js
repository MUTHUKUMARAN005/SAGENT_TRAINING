import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import FloatingParticles from '../components/common/FloatingParticles';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig } from '../utils/roleConfig';

const SellerLayout = () => {
  const { user } = useAuth();
  const config = getRoleConfig(user?.role);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      <Sidebar menuItems={config.sidebar} role={user?.role} />
      <main style={{ flex: 1, marginLeft: 280, padding: 32, position: 'relative', overflow: 'hidden' }}>
        <FloatingParticles />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;