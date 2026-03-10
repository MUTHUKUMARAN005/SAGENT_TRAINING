import React, { useState, useEffect } from 'react';
import { categoryAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const Categories = () => {
    const { currentUser } = useAuth();
    const canCreate = usePermission('CREATE_CATEGORY');
    const canDelete = usePermission('DELETE_CATEGORY');
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ categoryName: '', categoryType: 'EXPENSE' });
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { load(); }, []);
    const load = async () => { try { const r = await categoryAPI.getAll(); setCategories(r.data); } catch(e){console.error(e);} };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { const u = await userAPI.getById(currentUser.userId);
            await categoryAPI.create({categoryName:form.categoryName,categoryType:form.categoryType,user:u.data,isCustom:true});
            setShowModal(false); setForm({categoryName:'',categoryType:'EXPENSE'}); load();
        } catch(e){console.error(e);}
    };

    const handleDelete = async (id) => { if(!canDelete||!window.confirm('Delete?'))return; await categoryAPI.delete(id); load(); };
    const filtered = filter==='ALL'?categories:categories.filter(c=>c.categoryType===filter);

    return (
        <div><div className="card">
            <div className="card-header"><h3>🏷️ Categories</h3>
                <div style={{display:'flex',gap:8}}>
                    <select className="form-control" style={{width:'auto'}} value={filter} onChange={e=>setFilter(e.target.value)}>
                        <option value="ALL">All</option><option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select>
                    {canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add</button>}
                </div></div>
            <table className="data-table">
                <thead><tr><th>Name</th><th>Type</th><th>Custom</th><th>Owner</th>{canDelete && <th>Actions</th>}</tr></thead>
                <tbody>{filtered.map(c=>(<tr key={c.categoryId}><td><strong>{c.categoryName}</strong></td>
                    <td><span className={`status-badge ${c.categoryType==='INCOME'?'active':'completed'}`}>{c.categoryType}</span></td>
                    <td>{c.isCustom?'✅':'—'}</td><td>{c.user?c.user.name:'🌐 System'}</td>
                    {canDelete && <td>{c.isCustom && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.categoryId)}>🗑️</button>}</td>}</tr>))}</tbody>
            </table>
        </div>

        {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>➕ Add Category</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Name *</label><input className="form-control" value={form.categoryName} onChange={e=>setForm({...form,categoryName:e.target.value})} required/></div>
                <div className="form-group"><label>Type *</label><select className="form-control" value={form.categoryType} onChange={e=>setForm({...form,categoryType:e.target.value})}>
                    <option value="EXPENSE">Expense</option><option value="INCOME">Income</option></select></div>
                <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">➕ Create</button></div>
            </form></div></div>)}
        </div>
    );
};
export default Categories;