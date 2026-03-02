import React, { useState, useEffect } from 'react';
import { userAPI, accountAPI } from '../../api/axiosConfig';

const AdminDashboard = () => {

    const [stats, setStats] = useState({
        totalUsers: 0,
        totalAccounts: 0,
        users: []
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const usersRes = await userAPI.getAll();
            const accountsRes = await accountAPI.getAll();

            setStats({
                totalUsers: usersRes.data.length,
                totalAccounts: accountsRes.data.length,
                users: usersRes.data
            });
        } catch (err) {
            console.error(err);
        }
    };

    const getRoleCount = (role) => {
        return stats.users.filter(u => u.role === role).length;
    };

    return (
        <div>
            <h2 style={{ marginBottom: 24, color: '#1a237e' }}>
                ⚙️ Admin Dashboard
            </h2>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon balance">👥</div>
                    <div className="stat-info">
                        <h4>Total Users</h4>
                        <p>{stats.totalUsers}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon income">🏦</div>
                    <div className="stat-info">
                        <h4>Total Accounts</h4>
                        <p>{stats.totalAccounts}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon expense">🔑</div>
                    <div className="stat-info">
                        <h4>Admins</h4>
                        <p>{getRoleCount('ADMIN')}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon savings">👤</div>
                    <div className="stat-info">
                        <h4>Regular Users</h4>
                        <p>{getRoleCount('USER')}</p>
                    </div>
                </div>
            </div>

            {/* Users by Role */}
            <div className="card">
                <div className="card-header">
                    <h3>Users by Role</h3>
                </div>

                {['ADMIN', 'USER', 'VIEWER'].map((role) => {
                    const roleUsers = stats.users.filter(
                        u => u.role === role
                    );
                    return (
                        <div key={role} style={{ padding: '16px 20px' }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                            }}>
                                <span className={`role-badge role-${role.toLowerCase()}`}>
                                    {role}
                                </span>
                                <span style={{ color: '#999' }}>
                                    {roleUsers.length} users
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${
                                        role === 'ADMIN'
                                            ? 'red'
                                            : role === 'USER'
                                            ? 'green'
                                            : 'yellow'
                                    }`}
                                    style={{
                                        width: `${
                                            stats.totalUsers > 0
                                                ? (roleUsers.length / stats.totalUsers) * 100
                                                : 0
                                        }%`
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;