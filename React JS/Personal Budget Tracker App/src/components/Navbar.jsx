import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { alertAPI } from '../api/axiosConfig';

const Navbar = () => {

    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadUnreadCount();
        }
    }, [currentUser]);

    const loadUnreadCount = async () => {
        try {
            const res = await alertAPI.getUnreadCount(currentUser.userId);
            setUnreadCount(res.data);
        } catch (err) {
            console.error('Error loading alerts:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar">
            <div className="navbar-title">
                Personal Budget Tracker
            </div>

            <div className="navbar-actions">
                {/* Notification Bell */}
                <div
                    className="notification-badge"
                    onClick={() => navigate('/alerts')}
                >
                    🔔
                    {unreadCount > 0 && (
                        <span className="badge-count">{unreadCount}</span>
                    )}
                </div>

                {/* User Dropdown */}
                <div
                    className="user-dropdown"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <span className="user-avatar">
                        {currentUser?.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <span className="user-name">{currentUser?.name}</span>
                    <span className={`role-badge role-${currentUser?.role?.toLowerCase()}`}>
                        {currentUser?.role}
                    </span>

                    {showDropdown && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <strong>{currentUser?.name}</strong>
                                <p>{currentUser?.email}</p>
                                <span className={`role-badge role-${currentUser?.role?.toLowerCase()}`}>
                                    {currentUser?.role}
                                </span>
                            </div>
                            <div className="dropdown-divider" />
                            <button
                                className="dropdown-item"
                                onClick={handleLogout}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;