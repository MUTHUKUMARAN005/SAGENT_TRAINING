// src/components/Layout/Layout.jsx
import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import FloatingParticles from '../Common/FloatingParticles';

const Layout = ({ children }) => {
  const { sidebarCollapsed } = useAuth();
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <FloatingParticles />
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', position:'relative', zIndex:1 }}>
        <Header />
        <main style={{ flex:1, padding:'20px 24px',
          marginLeft: sidebarCollapsed ? '76px' : '256px',
          transition: 'margin-left 0.35s ease' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;