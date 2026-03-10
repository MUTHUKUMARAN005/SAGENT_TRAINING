import React, { useState, useEffect, useCallback } from 'react';
import { incomeAPI, accountAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

const parseIncomeDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
};

const getYearFromDate = (value) => parseIncomeDate(value)?.getFullYear();
const ALLOWED_INCOME_TYPES = ['Salary', 'Business', 'Other'];

const Income = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const currencyPreference = currentUser?.currencyPreference || 'INR';
    const currencySymbol = getCurrencySymbol(currencyPreference);
    const canCreate = usePermission('CREATE_INCOME');
    const canEdit = usePermission('EDIT_INCOME');
    const canDelete = usePermission('DELETE_INCOME');

    const [incomes, setIncomes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
    const [form, setForm] = useState({
        accountId: '',
        amount: '',
        incomeType: 'Salary',
        description: '',
        dateReceived: '',
        isRecurring: false
    });

    const loadData = useCallback(async () => {
        if (!userId) {
            setIncomes([]);
            setAccounts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [iRes, aRes] = await Promise.all([incomeAPI.getByUser(userId), accountAPI.getByUser(userId)]);
            setIncomes(iRes.data);
            setAccounts(aRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { loadData(); }, [loadData]);

    const resetForm = () => {
        setEditId(null);
        setError('');
        setForm({
            accountId: '',
            amount: '',
            incomeType: 'Salary',
            description: '',
            dateReceived: '',
            isRecurring: false
        });
    };

    const openEdit = (income) => {
        if (!canEdit) return;
        const normalizedIncomeType = ALLOWED_INCOME_TYPES.includes(income.incomeType) ? income.incomeType : 'Other';
        setEditId(income.incomeId);
        setForm({
            accountId: income.account?.accountId || '',
            amount: income.amount,
            incomeType: normalizedIncomeType,
            description: income.description,
            dateReceived: income.dateReceived,
            isRecurring: income.isRecurring
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userRes = await userAPI.getById(userId);
            const account = accounts.find((a) => a.accountId === parseInt(form.accountId, 10));
            const payload = {
                user: userRes.data,
                account,
                amount: parseFloat(form.amount),
                incomeType: form.incomeType,
                description: form.description,
                dateReceived: form.dateReceived,
                isRecurring: form.isRecurring
            };
            if (editId) await incomeAPI.update(editId, payload);
            else await incomeAPI.create(payload);
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!canDelete || !window.confirm('Delete?')) return;
        await incomeAPI.delete(id);
        loadData();
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const total = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const currentMonthTotal = incomes.reduce((sum, item) => {
        const date = parseIncomeDate(item.dateReceived);
        if (!date) return sum;
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth
            ? sum + Number(item.amount || 0)
            : sum;
    }, 0);
    const currentYearTotal = incomes.reduce((sum, item) => {
        const year = getYearFromDate(item.dateReceived);
        return year === currentYear ? sum + Number(item.amount || 0) : sum;
    }, 0);

    const availableYears = Array.from(
        new Set(
            incomes
                .map((item) => getYearFromDate(item.dateReceived))
                .filter((year) => Number.isInteger(year))
        )
    ).sort((a, b) => b - a);

    if (!availableYears.includes(currentYear)) {
        availableYears.unshift(currentYear);
    }

    useEffect(() => {
        if (!availableYears.includes(historyYear)) {
            setHistoryYear(availableYears[0] || currentYear);
        }
    }, [availableYears, historyYear, currentYear]);

    const historyItems = incomes.filter((item) => getYearFromDate(item.dateReceived) === historyYear);
    const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short' });
    const monthlyHistory = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthItems = historyItems.filter((item) => {
            const date = parseIncomeDate(item.dateReceived);
            return date && date.getMonth() === monthIndex;
        });
        return {
            month: monthLabel.format(new Date(historyYear, monthIndex, 1)),
            records: monthItems.length,
            amount: monthItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
        };
    });

    const sortedIncomes = [...incomes].sort((a, b) => {
        const left = parseIncomeDate(a.dateReceived)?.getTime() || 0;
        const right = parseIncomeDate(b.dateReceived)?.getTime() || 0;
        return right - left;
    });

    if (loading) return <div className="card"><div className="loading-content">⏳ Loading...</div></div>;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card"><div className="stat-icon income">📅</div><div className="stat-info"><h4>Monthly Income</h4><p className="amount-positive">{formatCurrency(currentMonthTotal, currencyPreference)}</p></div></div>
                <div className="stat-card"><div className="stat-icon savings">📊</div><div className="stat-info"><h4>Yearly Income</h4><p className="amount-positive">{formatCurrency(currentYearTotal, currencyPreference)}</p></div></div>
                <div className="stat-card"><div className="stat-icon income">💰</div><div className="stat-info"><h4>Total Income</h4><p className="amount-positive">{formatCurrency(total, currencyPreference)}</p></div></div>
                <div className="stat-card"><div className="stat-icon balance">📝</div><div className="stat-info"><h4>Income Records</h4><p>{incomes.length}</p></div></div>
            </div>

            <div className="card">
                <div className="card-header"><h3>💰 Income Records</h3>
                    {canCreate && <button className="btn btn-success" onClick={() => { resetForm(); setShowModal(true); }}>➕ Add Income</button>}</div>
                {sortedIncomes.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Account</th><th>Amount</th><th>Recurring</th>{(canEdit || canDelete) && <th>Actions</th>}</tr></thead>
                        <tbody>{sortedIncomes.map((income) => (
                            <tr key={income.incomeId}>
                                <td>{income.dateReceived}</td><td><span className="type-badge">{income.incomeType}</span></td>
                                <td>{income.description || '-'}</td><td>{income.account?.accountName || '-'}</td>
                                <td className="amount-positive">+{formatCurrency(income.amount, currencyPreference)}</td>
                                <td>{income.isRecurring ? '🔁 Yes' : '—'}</td>
                                {(canEdit || canDelete) && <td><div className="action-buttons">
                                    {canEdit && <button className="btn btn-warning btn-sm" onClick={() => openEdit(income)}>✏️</button>}
                                    {canDelete && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(income.incomeId)}>🗑️</button>}
                                </div></td>}
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <div className="empty-state"><div className="empty-icon">💰</div><p>No income records</p></div>}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>📊 Income Tracking</h3>
                    <div className="income-history-controls">
                        <label>Year</label>
                        <select className="form-control" value={historyYear} onChange={(e) => setHistoryYear(Number(e.target.value))}>
                            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </div>
                <table className="data-table">
                    <thead><tr><th>Month</th><th>Records</th><th>Total Income</th></tr></thead>
                    <tbody>{monthlyHistory.map((row) => (
                        <tr key={`${historyYear}-${row.month}`}>
                            <td>{row.month}</td>
                            <td>{row.records}</td>
                            <td className="amount-positive">{formatCurrency(row.amount, currencyPreference)}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editId ? '✏️ Edit' : '➕ Add'} Income</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        {error && <div className="error-message" style={{ margin: '0 24px' }}>⚠️ {error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group"><label>Type *</label>
                                    <select className="form-control" value={form.incomeType} onChange={(e) => setForm({ ...form, incomeType: e.target.value })}>
                                        <option value="Salary">💼 Salary</option>
                                        <option value="Business">🏢 Business</option>
                                        <option value="Other">📦 Other</option>
                                    </select></div>
                                <div className="form-group"><label>Amount ({currencySymbol}) *</label>
                                    <input type="number" step="0.01" min="0.01" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                            </div>
                            <div className="form-group"><label>Account *</label>
                                <select className="form-control" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                                    <option value="">-- Select --</option>
                                    {accounts.map((account) => <option key={account.accountId} value={account.accountId}>{account.accountName} ({formatCurrency(account.currentBalance, currencyPreference)})</option>)}
                                </select></div>
                            <div className="form-group"><label>Description</label>
                                <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Date *</label>
                                    <input type="date" className="form-control" value={form.dateReceived} onChange={(e) => setForm({ ...form, dateReceived: e.target.value })} required /></div>
                                <div className="form-group checkbox-group"><label className="checkbox-label">
                                    <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} /><span>🔁 Recurring</span></label></div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">{editId ? '💾 Update' : '➕ Add'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;
