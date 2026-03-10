import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { alertAPI } from '../api/axiosConfig';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const userId = currentUser?.userId;
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const loadUnreadCount = useCallback(async () => {
        if (!userId) {
            setUnreadCount(0);
            return;
        }
        try {
            const res = await alertAPI.getUnreadCount(userId);
            setUnreadCount(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [userId]);

    useEffect(() => {
        loadUnreadCount();
    }, [loadUnreadCount]);

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="navbar">
            <div className="navbar-title">Personal Budget Tracker</div>
            <div className="navbar-actions">
                <div className="notification-badge" onClick={() => navigate('/alerts')}>
                    🔔
                    {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
                </div>

                <div className="user-dropdown" ref={dropdownRef}
                    onClick={() => setShowDropdown(!showDropdown)}>
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
                            <button className="dropdown-item" onClick={() => { navigate('/'); setShowDropdown(false); }}>
                                📊 Dashboard
                            </button>
                            <button className="dropdown-item" onClick={() => { navigate('/alerts'); setShowDropdown(false); }}>
                                🔔 Alerts {unreadCount > 0 && `(${unreadCount})`}
                            </button>
                            <button className="dropdown-item" onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                                👤 Profile
                            </button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item logout-item" onClick={handleLogout}>
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
