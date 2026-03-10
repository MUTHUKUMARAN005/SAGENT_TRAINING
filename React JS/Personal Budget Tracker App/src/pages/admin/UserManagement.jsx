import React, { useState, useEffect } from 'react';
import { userAPI } from '../../api/axiosConfig';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../auth/permissions';
import { CURRENCY_OPTIONS } from '../../utils/currency';

const UserManagement = () => {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ name: '', email: '', role: 'USER', currencyPreference: 'INR' });

    useEffect(() => { load(); }, []);
    const load = async () => { try { const r = await userAPI.getAll(); setUsers(r.data); } catch(e){console.error(e);} };

    const edit = (u) => { 
        setEditUser(u); 
        setForm({name:u.name,email:u.email,role:u.role,currencyPreference:u.currencyPreference}); 
        setShowModal(true); 
    };
    const handleSubmit = async (e) => { e.preventDefault(); try { if(editUser) await userAPI.update(editUser.userId,form); setShowModal(false); setEditUser(null); load(); } catch(e){console.error(e);} };
    const del = async (id) => { if(id===currentUser.userId){alert('Cannot delete yourself!');return;} if(!window.confirm('Delete permanently?'))return; await userAPI.delete(id); load(); };

    const filtered = users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div><div className="card">
            <div className="card-header"><h3>👥 Users ({users.length})</h3>
                <input className="form-control" style={{width:250}} placeholder="🔍 Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <table className="data-table">
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Currency</th><th>Actions</th></tr></thead>
                <tbody>{filtered.map(u=>(<tr key={u.userId}>
                    <td>#{u.userId}</td>
                    <td><strong>{u.name}</strong>{u.userId===currentUser.userId && <span style={{marginLeft:8,fontSize:'0.7rem',color:'#1a237e'}}>(You)</span>}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                    <td>{u.currencyPreference}</td>
                    <td><div className="action-buttons">
                        <button className="btn btn-warning btn-sm" onClick={() => edit(u)}>✏️</button>
                        {u.userId!==currentUser.userId && <button className="btn btn-danger btn-sm" onClick={() => del(u.userId)}>🗑️</button>}
                    </div></td></tr>))}</tbody>
            </table>
        </div>

        {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>✏️ Edit User</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Name</label><input className="form-control" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
                <div className="form-group"><label>Email</label><input type="email" className="form-control" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
                <div className="form-row">
                    <div className="form-group"><label>Role</label><select className="form-control" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                        <option value={ROLES.ADMIN}>🔑 Admin</option><option value={ROLES.USER}>👤 User</option><option value={ROLES.VIEWER}>👁️ Viewer</option></select></div>
                    <div className="form-group"><label>Currency</label><select className="form-control" value={form.currencyPreference} onChange={e=>setForm({...form,currencyPreference:e.target.value})}>
                        {CURRENCY_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                </div>
                <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">💾 Update</button></div>
            </form></div></div>)}
        </div>
    );
};
export default UserManagement;
