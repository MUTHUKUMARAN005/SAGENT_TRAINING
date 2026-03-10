import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AIAssistant from './AIAssistant';

const Layout = ({ children }) => (
    <div className="app-layout">
        <Sidebar />
        <div className="main-content">
            <Navbar />
            <div className="page-content">{children}</div>
            <AIAssistant />
        </div>
    </div>
);

export default Layout;
