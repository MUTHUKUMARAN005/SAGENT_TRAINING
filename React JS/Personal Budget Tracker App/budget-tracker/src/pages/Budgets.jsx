import React, { useState, useEffect, useCallback } from 'react';
import { budgetAPI, categoryAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const Budgets = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const canCreate = usePermission('CREATE_BUDGET');
    const canDelete = usePermission('DELETE_BUDGET');
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ categoryId: '', monthYear: '', amountLimit: '', amountSpent: '0' });

    const loadData = useCallback(async () => {
        if (!userId) {
            setBudgets([]);
            setCategories([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [b, c] = await Promise.all([budgetAPI.getByUser(userId), categoryAPI.getAll()]);
            setBudgets(b.data);
            setCategories(c.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const u = await userAPI.getById(userId);
            const cat = categories.find(c => c.categoryId === parseInt(form.categoryId));
            await budgetAPI.create({ user: u.data, category: cat, monthYear: form.monthYear, amountLimit: parseFloat(form.amountLimit), amountSpent: parseFloat(form.amountSpent) });
            setShowModal(false); setForm({ categoryId: '', monthYear: '', amountLimit: '', amountSpent: '0' }); loadData();
        } catch(e){console.error(e);}
    };

    const handleDelete = async (id) => { if(!canDelete||!window.confirm('Delete?'))return; await budgetAPI.delete(id); loadData(); };
    const progressClass = (s,l) => { const p=(Number(s)/Number(l))*100; return p<60?'green':p<85?'yellow':'red'; };
    if(loading) return <div className="card"><div className="loading-content">⏳ Loading...</div></div>;

    return (
        <div><div className="card">
            <div className="card-header"><h3>📋 Budgets</h3>
                {canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Set Budget</button>}</div>
            {budgets.length > 0 ? budgets.map(b => {
                const limit=Number(b.amountLimit||1), spent=Number(b.amountSpent||0), pct=(spent/limit)*100, rem=limit-spent;
                return (<div key={b.budgetId} className="budget-item">
                    <div className="budget-header"><div><strong>{b.category?.categoryName||'Unknown'}</strong><span className="budget-month">{b.monthYear}</span></div>
                        <div className="budget-amounts"><span className={rem>=0?'amount-positive':'amount-negative'}>₹{spent.toLocaleString()} / ₹{limit.toLocaleString()}</span>
                            {canDelete && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.budgetId)}>🗑️</button>}</div></div>
                    <div className="progress-bar"><div className={`progress-fill ${progressClass(spent,limit)}`} style={{width:`${Math.min(pct,100)}%`}}/></div>
                    <div className="budget-footer"><span>{pct.toFixed(1)}% used</span><span className={rem>=0?'amount-positive':'amount-negative'}>{rem>=0?`₹${rem.toLocaleString()} left`:`₹${Math.abs(rem).toLocaleString()} over!`}</span></div>
                </div>);
            }) : <div className="empty-state"><div className="empty-icon">📋</div><p>No budgets</p></div>}
        </div>

        {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>➕ Set Budget</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label>Category *</label><select className="form-control" value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})} required>
                        <option value="">-- Select --</option>{categories.map(c=><option key={c.categoryId} value={c.categoryId}>{c.categoryName} ({c.categoryType})</option>)}</select></div>
                    <div className="form-row">
                        <div className="form-group"><label>Month *</label><input type="month" className="form-control" value={form.monthYear} onChange={e=>setForm({...form,monthYear:e.target.value})} required/></div>
                        <div className="form-group"><label>Limit (₹) *</label><input type="number" min="1" className="form-control" value={form.amountLimit} onChange={e=>setForm({...form,amountLimit:e.target.value})} required/></div>
                    </div>
                    <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">📋 Set</button></div>
                </form></div></div>)}
        </div>
    );
};
export default Budgets;
