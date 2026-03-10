import React, { useState, useEffect, useCallback } from 'react';
import { goalAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const Goals = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const canCreate = usePermission('CREATE_GOAL');
    const canDelete = usePermission('DELETE_GOAL');
    const canContribute = usePermission('CONTRIBUTE_GOAL');
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [contModal, setContModal] = useState(null);
    const [contAmt, setContAmt] = useState('');
    const [form, setForm] = useState({ goalName: '', targetAmount: '', currentAmount: '0', targetDate: '' });

    const load = useCallback(async () => {
        if (!userId) {
            setGoals([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const r = await goalAPI.getByUser(userId);
            setGoals(r.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const u = await userAPI.getById(userId);
            await goalAPI.create({ user:u.data, goalName:form.goalName, targetAmount:parseFloat(form.targetAmount), currentAmount:parseFloat(form.currentAmount||0), targetDate:form.targetDate, status:'ACTIVE' });
            setShowModal(false); setForm({ goalName:'', targetAmount:'', currentAmount:'0', targetDate:'' }); load();
        } catch(e){console.error(e);}
    };

    const handleContribute = async () => {
        if(!contAmt||parseFloat(contAmt)<=0) return;
        try { await goalAPI.contribute(contModal, parseFloat(contAmt)); setContModal(null); setContAmt(''); load(); } catch(e){console.error(e);}
    };

    const handleDelete = async (id) => { if(!canDelete||!window.confirm('Delete?'))return; await goalAPI.delete(id); load(); };
    if(loading) return <div className="card"><div className="loading-content">⏳ Loading...</div></div>;

    return (
        <div><div className="card">
            <div className="card-header"><h3>🎯 Goals</h3>{canCreate && <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Goal</button>}</div>
            {goals.length > 0 ? (<div className="goals-grid">{goals.map(g => {
                const t=Number(g.targetAmount||1), c=Number(g.currentAmount||0), p=(c/t)*100, rem=t-c;
                return (<div key={g.goalId} className="goal-card">
                    <div className="goal-header"><h4>{g.goalName}</h4><span className={`status-badge ${g.status?.toLowerCase()}`}>{g.status}</span></div>
                    <div className="goal-details">
                        <div className="goal-detail-row"><span>🎯 Target:</span><strong>₹{t.toLocaleString()}</strong></div>
                        <div className="goal-detail-row"><span>💰 Saved:</span><strong className="amount-positive">₹{c.toLocaleString()}</strong></div>
                        <div className="goal-detail-row"><span>📅 Deadline:</span><strong>{g.targetDate}</strong></div>
                        <div className="goal-detail-row"><span>📊 Remaining:</span><strong>₹{rem.toLocaleString()}</strong></div>
                    </div>
                    <div className="progress-bar" style={{marginTop:12}}><div className={`progress-fill ${p>=100?'green':p>=50?'yellow':'red'}`} style={{width:`${Math.min(p,100)}%`}}/></div>
                    <div className="goal-progress-text">{p.toFixed(1)}%</div>
                    <div className="goal-actions">
                        {canContribute && g.status==='ACTIVE' && <button className="btn btn-success btn-sm" onClick={() => setContModal(g.goalId)}>💰 Contribute</button>}
                        {canDelete && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.goalId)}>🗑️</button>}
                    </div>
                </div>);
            })}</div>) : <div className="empty-state"><div className="empty-icon">🎯</div><p>No goals</p></div>}
        </div>

        {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>🎯 Create Goal</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
                <div className="form-group"><label>Name *</label><input className="form-control" value={form.goalName} onChange={e=>setForm({...form,goalName:e.target.value})} required/></div>
                <div className="form-row">
                    <div className="form-group"><label>Target (₹) *</label><input type="number" min="1" className="form-control" value={form.targetAmount} onChange={e=>setForm({...form,targetAmount:e.target.value})} required/></div>
                    <div className="form-group"><label>Date *</label><input type="date" className="form-control" value={form.targetDate} onChange={e=>setForm({...form,targetDate:e.target.value})} required/></div>
                </div>
                <div className="form-group"><label>Initial Saved</label><input type="number" min="0" className="form-control" value={form.currentAmount} onChange={e=>setForm({...form,currentAmount:e.target.value})}/></div>
                <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">🎯 Create</button></div>
            </form></div></div>)}

        {contModal && (<div className="modal-overlay" onClick={() => setContModal(null)}><div className="modal modal-sm" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h3>💰 Contribute</h3><button className="modal-close" onClick={() => setContModal(null)}>✕</button></div>
            <div className="form-group"><label>Amount (₹)</label><input type="number" min="1" className="form-control" value={contAmt} onChange={e=>setContAmt(e.target.value)} autoFocus/></div>
            <div className="modal-actions"><button className="btn btn-cancel" onClick={() => setContModal(null)}>Cancel</button><button className="btn btn-success" onClick={handleContribute}>💰 Contribute</button></div>
        </div></div>)}
        </div>
    );
};
export default Goals;
