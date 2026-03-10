// src/components/Layout/Layout.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import FloatingParticles from '../Common/FloatingParticles';

const Layout = ({ children }) => {
  const { sidebarCollapsed } = useAuth();
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 88 : 272);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <FloatingParticles />
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        paddingLeft: `${sidebarWidth}px`,
        transition: 'padding-left 0.35s ease'
      }}>
        <Header />
        <main style={{
          flex: 1,
          padding: isMobile ? '16px' : '26px 28px',
          position: 'relative'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
