import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getMenuItemsForRole } from '../auth/permissions';

const Sidebar = () => {
    const { currentUser } = useAuth();
    const menuItems = getMenuItemsForRole(currentUser?.role);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>💰 Budget Tracker</h2>
                <p>{currentUser?.name}</p>
                <span className={`role-badge role-${currentUser?.role?.toLowerCase()}`}>
                    {currentUser?.role}
                </span>
            </div>
            <ul className="sidebar-nav">
                {menuItems.map((item) => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            className={({ isActive }) => isActive ? 'active' : ''}
                            end={item.path === '/'}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;