import React, { useState, useEffect, useCallback } from 'react';
import { transferAPI, accountAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const Transfers = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const canCreate = usePermission('CREATE_TRANSFER');
    const canDelete = usePermission('DELETE_TRANSFER');
    const [transfers, setTransfers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ fromAccountId: '', toAccountId: '', amount: '', date: '', description: '' });

    const loadData = useCallback(async () => {
        if (!userId) {
            setTransfers([]);
            setAccounts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [t, a] = await Promise.all([transferAPI.getByUser(userId), accountAPI.getByUser(userId)]);
            setTransfers(t.data);
            setAccounts(a.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if(form.fromAccountId===form.toAccountId){setError('Cannot transfer to same account');return;}
        try {
            const from=accounts.find(a=>a.accountId===parseInt(form.fromAccountId));
            const to=accounts.find(a=>a.accountId===parseInt(form.toAccountId));
            await transferAPI.create({fromAccount:from,toAccount:to,amount:parseFloat(form.amount),date:form.date,description:form.description});
            setShowModal(false); setForm({fromAccountId:'',toAccountId:'',amount:'',date:'',description:''}); loadData();
        } catch(err){setError(err.response?.data?.message||'Failed');}
    };

    const handleDelete = async (id) => { if(!canDelete||!window.confirm('Delete?'))return; await transferAPI.delete(id); loadData(); };
    if(loading) return <div className="card"><div className="loading-content">⏳ Loading...</div></div>;

    return (
        <div><div className="card">
            <div className="card-header"><h3>🔄 Transfers</h3>{canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ New Transfer</button>}</div>
            {transfers.length > 0 ? (<table className="data-table">
                <thead><tr><th>Date</th><th>From</th><th>→</th><th>To</th><th>Amount</th><th>Description</th>{canDelete && <th>Actions</th>}</tr></thead>
                <tbody>{transfers.map(t=>(<tr key={t.transferId}><td>{t.date}</td><td>{t.fromAccount?.accountName}</td><td>→</td><td>{t.toAccount?.accountName}</td>
                    <td><strong>₹{Number(t.amount||0).toLocaleString()}</strong></td><td>{t.description||'-'}</td>
                    {canDelete && <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.transferId)}>🗑️</button></td>}</tr>))}</tbody>
            </table>) : <div className="empty-state"><div className="empty-icon">🔄</div><p>No transfers</p></div>}
        </div>

        {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>🔄 New Transfer</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            {error && <div className="error-message" style={{margin:'0 24px'}}>⚠️ {error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group"><label>From *</label><select className="form-control" value={form.fromAccountId} onChange={e=>setForm({...form,fromAccountId:e.target.value})} required>
                        <option value="">-- Select --</option>{accounts.map(a=><option key={a.accountId} value={a.accountId}>{a.accountName}</option>)}</select></div>
                    <div className="form-group"><label>To *</label><select className="form-control" value={form.toAccountId} onChange={e=>setForm({...form,toAccountId:e.target.value})} required>
                        <option value="">-- Select --</option>{accounts.map(a=><option key={a.accountId} value={a.accountId}>{a.accountName}</option>)}</select></div>
                </div>
                <div className="form-row">
                    <div className="form-group"><label>Amount *</label><input type="number" min="1" className="form-control" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></div>
                    <div className="form-group"><label>Date *</label><input type="date" className="form-control" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></div>
                </div>
                <div className="form-group"><label>Description</label><input className="form-control" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
                <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">🔄 Transfer</button></div>
            </form></div></div>)}
        </div>
    );
};
export default Transfers;
