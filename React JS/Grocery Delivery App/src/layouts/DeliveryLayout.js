import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig } from '../utils/roleConfig';

const DeliveryLayout = () => {
  const { user } = useAuth();
  const config = getRoleConfig(user?.role);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
      <Sidebar menuItems={config.sidebar} role={user?.role} />
      <main style={{ flex: 1, marginLeft: 280, padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default DeliveryLayout;