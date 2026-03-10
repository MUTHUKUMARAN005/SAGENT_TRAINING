import React, { useState, useEffect } from 'react';
import { userAPI, accountAPI } from '../../api/axiosConfig';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalAccounts: 0, users: [] });

    useEffect(() => { load(); }, []);
    const load = async () => {
        try { const [u,a] = await Promise.all([userAPI.getAll(), accountAPI.getAll()]);
            setStats({ totalUsers:u.data.length, totalAccounts:a.data.length, users:u.data });
        } catch(e){console.error(e);}
    };

    const roleCount = (r) => stats.users.filter(u=>u.role===r).length;

    return (
        <div>
            <div className="page-title"><h2>⚙️ Admin Dashboard</h2></div>
            <div className="stats-grid">
                <div className="stat-card"><div className="stat-icon balance">👥</div><div className="stat-info"><h4>Users</h4><p>{stats.totalUsers}</p></div></div>
                <div className="stat-card"><div className="stat-icon income">🏦</div><div className="stat-info"><h4>Accounts</h4><p>{stats.totalAccounts}</p></div></div>
                <div className="stat-card"><div className="stat-icon expense">🔑</div><div className="stat-info"><h4>Admins</h4><p>{roleCount('ADMIN')}</p></div></div>
                <div className="stat-card"><div className="stat-icon savings">👤</div><div className="stat-info"><h4>Users</h4><p>{roleCount('USER')}</p></div></div>
            </div>
            <div className="card">
                <div className="card-header"><h3>Users by Role</h3></div>
                {['ADMIN','USER','VIEWER'].map(role => {
                    const c=roleCount(role), p=stats.totalUsers>0?(c/stats.totalUsers)*100:0;
                    return (<div key={role} style={{padding:'16px 20px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                            <span className={`role-badge role-${role.toLowerCase()}`}>{role}</span>
                            <span style={{color:'#999'}}>{c} ({p.toFixed(0)}%)</span></div>
                        <div className="progress-bar"><div className={`progress-fill ${role==='ADMIN'?'red':role==='USER'?'green':'yellow'}`} style={{width:`${p}%`}}/></div>
                    </div>);
                })}
            </div>
        </div>
    );
};
export default AdminDashboard;