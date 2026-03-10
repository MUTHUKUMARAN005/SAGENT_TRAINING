import React, { useState, useEffect, useCallback } from 'react';
import { accountAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';
import { formatCurrency } from '../utils/currency';

const Accounts = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const currencyPreference = currentUser?.currencyPreference || 'INR';
    const canCreate = usePermission('CREATE_ACCOUNT');
    const canEdit = usePermission('EDIT_ACCOUNT');
    const canDelete = usePermission('DELETE_ACCOUNT');

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ accountName: '', accountType: 'BANK', initialBalance: '', currentBalance: '', isActive: true });

    const loadAccounts = useCallback(async () => {
        if (!userId) {
            setAccounts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try { const res = await accountAPI.getByUser(userId); setAccounts(res.data); }
        catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [userId]);

    useEffect(() => { loadAccounts(); }, [loadAccounts]);

    const resetForm = () => {
        setEditId(null); setError('');
        setForm({ accountName: '', accountType: 'BANK', initialBalance: '', currentBalance: '', isActive: true });
    };

    const openCreate = () => { resetForm(); setShowModal(true); };
    const openEdit = (acc) => {
        if (!canEdit) return;
        setEditId(acc.accountId); setError('');
        setForm({ accountName: acc.accountName, accountType: acc.accountType,
            initialBalance: acc.initialBalance, currentBalance: acc.currentBalance, isActive: acc.isActive });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        try {
            const userRes = await userAPI.getById(userId);
            const payload = { ...form, user: userRes.data,
                initialBalance: parseFloat(form.initialBalance),
                currentBalance: parseFloat(form.currentBalance || form.initialBalance) };
            if (editId) await accountAPI.update(editId, payload);
            else await accountAPI.create(payload);
            setShowModal(false); resetForm(); loadAccounts();
        } catch (err) { setError(err.response?.data?.message || 'Operation failed'); }
    };

    const handleDelete = async (id) => {
        if (!canDelete || !window.confirm('Delete this account?')) return;
        try { await accountAPI.delete(id); loadAccounts(); }
        catch (err) { alert('Delete failed'); }
    };

    const totalBalance = accounts.reduce((s, a) => s + Number(a.currentBalance || 0), 0);
    if (loading) return <div className="card"><div className="loading-content">⏳ Loading accounts...</div></div>;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card"><div className="stat-icon balance">🏦</div>
                    <div className="stat-info"><h4>Total Balance</h4><p>{formatCurrency(totalBalance, currencyPreference)}</p></div></div>
                <div className="stat-card"><div className="stat-icon income">📁</div>
                    <div className="stat-info"><h4>Total Accounts</h4><p>{accounts.length}</p></div></div>
                <div className="stat-card"><div className="stat-icon savings">✅</div>
                    <div className="stat-info"><h4>Active</h4><p>{accounts.filter(a => a.isActive).length}</p></div></div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>🏦 My Accounts</h3>
                    {canCreate && <button className="btn btn-primary" onClick={openCreate}>➕ Add Account</button>}
                </div>
                {accounts.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Name</th><th>Type</th><th>Initial</th><th>Current</th><th>Status</th>
                            {(canEdit || canDelete) && <th>Actions</th>}</tr></thead>
                        <tbody>
                            {accounts.map(acc => (
                                <tr key={acc.accountId}>
                                    <td><strong>{acc.accountName}</strong></td>
                                    <td><span className="type-badge">{acc.accountType}</span></td>
                                    <td>{formatCurrency(acc.initialBalance, currencyPreference)}</td>
                                    <td className={Number(acc.currentBalance) >= Number(acc.initialBalance) ? 'amount-positive' : 'amount-negative'}>
                                        {formatCurrency(acc.currentBalance, currencyPreference)}</td>
                                    <td><span className={`status-badge ${acc.isActive ? 'active' : 'inactive'}`}>
                                        {acc.isActive ? '✅ Active' : '❌ Inactive'}</span></td>
                                    {(canEdit || canDelete) && <td><div className="action-buttons">
                                        {canEdit && <button className="btn btn-warning btn-sm" onClick={() => openEdit(acc)}>✏️</button>}
                                        {canDelete && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(acc.accountId)}>🗑️</button>}
                                    </div></td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <div className="empty-state"><div className="empty-icon">🏦</div><p>No accounts found</p></div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editId ? '✏️ Edit' : '➕ Add'} Account</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        {error && <div className="error-message" style={{ margin: '0 24px' }}>⚠️ {error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-group"><label>Account Name *</label>
                                <input className="form-control" value={form.accountName}
                                    onChange={e => setForm({ ...form, accountName: e.target.value })} placeholder="e.g., HDFC Savings" required /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Type *</label>
                                    <select className="form-control" value={form.accountType}
                                        onChange={e => setForm({ ...form, accountType: e.target.value })}>
                                        <option value="BANK">🏦 Bank</option><option value="CASH">💵 Cash</option>
                                        <option value="CREDIT_CARD">💳 Credit Card</option><option value="WALLET">👛 Wallet</option>
                                    </select></div>
                                <div className="form-group"><label>Status</label>
                                    <select className="form-control" value={String(form.isActive)}
                                        onChange={e => setForm({ ...form, isActive: e.target.value === 'true' })}>
                                        <option value="true">Active</option><option value="false">Inactive</option>
                                    </select></div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label>Initial Balance *</label>
                                    <input type="number" step="0.01" min="0" className="form-control" value={form.initialBalance}
                                        onChange={e => setForm({ ...form, initialBalance: e.target.value })} required /></div>
                                <div className="form-group"><label>Current Balance</label>
                                    <input type="number" step="0.01" className="form-control" value={form.currentBalance}
                                        onChange={e => setForm({ ...form, currentBalance: e.target.value })} placeholder="Same as initial" /></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editId ? '💾 Update' : '➕ Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;
