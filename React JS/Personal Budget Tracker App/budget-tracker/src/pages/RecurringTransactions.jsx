import React, { useState, useEffect, useCallback } from 'react';
import { recurringAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const RecurringTransactions = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const canCreate = usePermission('CREATE_RECURRING');
    const canDelete = usePermission('DELETE_RECURRING');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ transactionType: '', amount: '', frequency: 'MONTHLY', nextDate: '', isActive: true });

    const load = useCallback(async () => {
        if (!userId) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const r = await recurringAPI.getByUser(userId);
            setItems(r.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try { const u = await userAPI.getById(userId); await recurringAPI.create({user:u.data,...form,amount:parseFloat(form.amount)});
            setShowModal(false); setForm({transactionType:'',amount:'',frequency:'MONTHLY',nextDate:'',isActive:true}); load();
        } catch(e){console.error(e);}
    };

    const handleDelete = async (id) => { if(!canDelete||!window.confirm('Delete?'))return; await recurringAPI.delete(id); load(); };
    const monthlyTotal = items.filter(r=>r.frequency==='MONTHLY'&&r.isActive).reduce((s,r)=>s+Number(r.amount||0),0);
    if(loading) return <div className="card"><div className="loading-content">⏳ Loading...</div></div>;

    return (
        <div>
            <div className="stats-grid" style={{marginBottom:20}}>
                <div className="stat-card"><div className="stat-icon expense">🔁</div><div className="stat-info"><h4>Monthly Total</h4><p className="amount-negative">₹{monthlyTotal.toLocaleString()}</p></div></div>
                <div className="stat-card"><div className="stat-icon balance">📝</div><div className="stat-info"><h4>Total</h4><p>{items.length}</p></div></div>
                <div className="stat-card"><div className="stat-icon income">✅</div><div className="stat-info"><h4>Active</h4><p>{items.filter(r=>r.isActive).length}</p></div></div>
            </div>
            <div className="card">
                <div className="card-header"><h3>🔁 Recurring</h3>{canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add</button>}</div>
                {items.length > 0 ? (<table className="data-table">
                    <thead><tr><th>Type</th><th>Amount</th><th>Frequency</th><th>Next Date</th><th>Status</th>{canDelete && <th>Actions</th>}</tr></thead>
                    <tbody>{items.map(r=>(<tr key={r.recurringId}><td><strong>{r.transactionType}</strong></td><td>₹{Number(r.amount||0).toLocaleString()}</td>
                        <td><span className="type-badge">{r.frequency}</span></td><td>{r.nextDate}</td>
                        <td><span className={`status-badge ${r.isActive?'active':'inactive'}`}>{r.isActive?'✅ Active':'⏸️ Paused'}</span></td>
                        {canDelete && <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.recurringId)}>🗑️</button></td>}</tr>))}</tbody>
                </table>) : <div className="empty-state"><div className="empty-icon">🔁</div><p>No recurring items</p></div>}
            </div>

            {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
                <div className="modal-header"><h3>➕ Add Recurring</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group"><label>Type *</label><input className="form-control" value={form.transactionType} onChange={e=>setForm({...form,transactionType:e.target.value})} placeholder="Netflix, SIP..." required/></div>
                        <div className="form-group"><label>Amount *</label><input type="number" min="1" className="form-control" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label>Frequency</label><select className="form-control" value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}>
                            <option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></div>
                        <div className="form-group"><label>Next Date *</label><input type="date" className="form-control" value={form.nextDate} onChange={e=>setForm({...form,nextDate:e.target.value})} required/></div>
                    </div>
                    <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">➕ Create</button></div>
                </form></div></div>)}
        </div>
    );
};
export default RecurringTransactions;
