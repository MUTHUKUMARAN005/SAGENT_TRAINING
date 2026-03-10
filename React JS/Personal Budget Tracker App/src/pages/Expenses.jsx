import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { expenseAPI, accountAPI, categoryAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';
import { formatCurrency } from '../utils/currency';

const COLORS = ['#c62828', '#ef6c00', '#1a237e', '#2e7d32', '#6a1b9a', '#00838f', '#455a64'];
const categoryIconMap = {
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    bill: '💡',
    education: '🎓',
    other: '📦'
};

const toDate = (value) => {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
};

const normalizeCategoryType = (label) => {
    const name = String(label || '').toLowerCase();
    if (name.includes('food') || name.includes('grocery') || name.includes('meal') || name.includes('restaurant')) return 'Food';
    if (name.includes('transport') || name.includes('travel') || name.includes('fuel') || name.includes('commute')) return 'Transport';
    if (name.includes('shop') || name.includes('purchase') || name.includes('cloth') || name.includes('mart')) return 'Shopping';
    if (name.includes('bill') || name.includes('electric') || name.includes('rent') || name.includes('utility')) return 'Bills';
    if (name.includes('education') || name.includes('school') || name.includes('college') || name.includes('course')) return 'Education';
    return 'Others';
};

const getCategoryIcon = (categoryName) => {
    const type = normalizeCategoryType(categoryName);
    if (type === 'Food') return categoryIconMap.food;
    if (type === 'Transport') return categoryIconMap.transport;
    if (type === 'Shopping') return categoryIconMap.shopping;
    if (type === 'Bills') return categoryIconMap.bill;
    if (type === 'Education') return categoryIconMap.education;
    return categoryIconMap.other;
};

const Expenses = () => {
    const { currentUser } = useAuth();
    const userId = currentUser?.userId;
    const currencyPreference = currentUser?.currencyPreference || 'INR';
    const canCreate = usePermission('CREATE_EXPENSE');
    const canEdit = usePermission('EDIT_EXPENSE');
    const canDelete = usePermission('DELETE_EXPENSE');

    const [expenses, setExpenses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        accountId: '',
        categoryId: '',
        amount: '',
        description: '',
        dateSpent: '',
        paymentMethod: 'UPI'
    });

    const loadData = useCallback(async () => {
        if (!userId) {
            setExpenses([]);
            setAccounts([]);
            setCategories([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [expenseRes, accountRes, categoryRes] = await Promise.all([
                expenseAPI.getByUser(userId),
                accountAPI.getByUser(userId),
                categoryAPI.getAll()
            ]);
            setExpenses(expenseRes.data || []);
            setAccounts(accountRes.data || []);
            setCategories((categoryRes.data || []).filter((item) => item.categoryType === 'EXPENSE'));
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
            categoryId: '',
            amount: '',
            description: '',
            dateSpent: '',
            paymentMethod: 'UPI'
        });
    };

    const openEdit = (expense) => {
        if (!canEdit) return;
        setEditId(expense.expenseId);
        setForm({
            accountId: expense.account?.accountId || '',
            categoryId: expense.category?.categoryId || '',
            amount: expense.amount,
            description: expense.description,
            dateSpent: expense.dateSpent,
            paymentMethod: expense.paymentMethod
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userRes = await userAPI.getById(userId);
            const account = accounts.find((a) => a.accountId === parseInt(form.accountId, 10));
            const category = categories.find((c) => c.categoryId === parseInt(form.categoryId, 10));
            const payload = {
                user: userRes.data,
                account,
                category,
                amount: parseFloat(form.amount),
                description: form.description,
                dateSpent: form.dateSpent,
                paymentMethod: form.paymentMethod
            };
            if (editId) await expenseAPI.update(editId, payload);
            else await expenseAPI.create(payload);
            setShowModal(false);
            resetForm();
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed');
        }
    };

    const handleDelete = async (id) => {
        if (!canDelete || !window.confirm('Delete?')) return;
        await expenseAPI.delete(id);
        loadData();
    };

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayKey = now.toISOString().slice(0, 10);

    const sortedExpenses = [...expenses].sort((a, b) => {
        const left = toDate(a.dateSpent)?.getTime() || 0;
        const right = toDate(b.dateSpent)?.getTime() || 0;
        return right - left;
    });

    const total = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const dailyExpenses = expenses.filter((item) => (item.dateSpent || '').slice(0, 10) === todayKey);
    const dailyTotal = dailyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const monthlyExpenses = expenses.filter((item) => {
        const date = toDate(item.dateSpent);
        return date && date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });
    const monthlyTotal = monthlyExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const categoryWiseMap = monthlyExpenses.reduce((acc, item) => {
        const rawName = item.category?.categoryName || 'Others';
        const group = normalizeCategoryType(rawName);
        if (!acc[group]) acc[group] = { category: group, total: 0, records: 0 };
        acc[group].total += Number(item.amount || 0);
        acc[group].records += 1;
        return acc;
    }, {});

    const categoryWise = Object.values(categoryWiseMap).sort((a, b) => b.total - a.total);
    const topCategory = categoryWise[0];

    if (loading) return <div className="card"><div className="loading-content">⏳ Loading...</div></div>;

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card"><div className="stat-icon expense">📅</div><div className="stat-info"><h4>Daily Expenses</h4><p className="amount-negative">{formatCurrency(dailyTotal, currencyPreference)}</p></div></div>
                <div className="stat-card"><div className="stat-icon expense">🗓️</div><div className="stat-info"><h4>Monthly Expenses</h4><p className="amount-negative">{formatCurrency(monthlyTotal, currencyPreference)}</p></div></div>
                <div className="stat-card"><div className="stat-icon balance">🏷️</div><div className="stat-info"><h4>Top Category</h4><p>{topCategory ? `${getCategoryIcon(topCategory.category)} ${topCategory.category}` : '—'}</p></div></div>
                <div className="stat-card"><div className="stat-icon balance">📝</div><div className="stat-info"><h4>Total Records</h4><p>{expenses.length}</p></div></div>
            </div>

            <div className="charts-grid">
                <div className="card">
                    <div className="card-header"><h3>🍩 Category-wise Expenses (This Month)</h3></div>
                    {categoryWise.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryWise}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {categoryWise.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value, currencyPreference)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : <div className="empty-state"><p>No monthly category data</p></div>}
                </div>

                <div className="card">
                    <div className="card-header"><h3>📊 Expense Tracking</h3></div>
                    <table className="data-table">
                        <thead><tr><th>Category</th><th>Records</th><th>Amount</th></tr></thead>
                        <tbody>
                            {categoryWise.length > 0 ? categoryWise.map((item) => (
                                <tr key={item.category}>
                                    <td>{getCategoryIcon(item.category)} {item.category}</td>
                                    <td>{item.records}</td>
                                    <td className="amount-negative">{formatCurrency(item.total, currencyPreference)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3}><div className="empty-hint">No expenses in current month.</div></td></tr>
                            )}
                        </tbody>
                    </table>
                    <div className="expense-tracking-footer">
                        <span>Today: {dailyExpenses.length} records</span>
                        <span>All-time total: {formatCurrency(total, currencyPreference)}</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><h3>💸 Expense Records</h3>
                    {canCreate && <button className="btn btn-danger" onClick={() => { resetForm(); setShowModal(true); }}>➕ Add Expense</button>}
                </div>
                {sortedExpenses.length > 0 ? (
                    <table className="data-table">
                        <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Account</th><th>Payment</th><th>Amount</th>{(canEdit || canDelete) && <th>Actions</th>}</tr></thead>
                        <tbody>{sortedExpenses.map((expense) => (
                            <tr key={expense.expenseId}>
                                <td>{expense.dateSpent}</td>
                                <td><span className="status-badge active">{getCategoryIcon(expense.category?.categoryName)} {expense.category?.categoryName || 'Others'}</span></td>
                                <td>{expense.description || '-'}</td>
                                <td>{expense.account?.accountName || '-'}</td>
                                <td><span className="type-badge">{expense.paymentMethod}</span></td>
                                <td className="amount-negative">-{formatCurrency(expense.amount, currencyPreference)}</td>
                                {(canEdit || canDelete) && <td><div className="action-buttons">
                                    {canEdit && <button className="btn btn-warning btn-sm" onClick={() => openEdit(expense)}>✏️</button>}
                                    {canDelete && <button className="btn btn-danger btn-sm" onClick={() => handleDelete(expense.expenseId)}>🗑️</button>}
                                </div></td>}
                            </tr>
                        ))}</tbody>
                    </table>
                ) : <div className="empty-state"><div className="empty-icon">💸</div><p>No expenses</p></div>}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editId ? '✏️ Edit' : '➕ Add'} Expense</h3><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
                        {error && <div className="error-message" style={{ margin: '0 24px' }}>⚠️ {error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group"><label>Category *</label>
                                    <select className="form-control" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                                        <option value="">-- Select --</option>
                                        {categories.map((category) => <option key={category.categoryId} value={category.categoryId}>{getCategoryIcon(category.categoryName)} {category.categoryName}</option>)}
                                    </select></div>
                                <div className="form-group"><label>Amount *</label>
                                    <input type="number" step="0.01" min="0.01" className="form-control" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                            </div>
                            <div className="form-group"><label>Account *</label>
                                <select className="form-control" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} required>
                                    <option value="">-- Select --</option>
                                    {accounts.map((account) => <option key={account.accountId} value={account.accountId}>{account.accountName}</option>)}
                                </select></div>
                            <div className="form-group"><label>Description</label>
                                <input className="form-control" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Date *</label>
                                    <input type="date" className="form-control" value={form.dateSpent} onChange={(e) => setForm({ ...form, dateSpent: e.target.value })} required /></div>
                                <div className="form-group"><label>Payment</label>
                                    <select className="form-control" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                                        <option value="UPI">📱 UPI</option><option value="Card">💳 Card</option><option value="Cash">💵 Cash</option><option value="NetBanking">🏦 Net Banking</option>
                                    </select></div>
                            </div>
                            <div className="modal-actions"><button type="button" className="btn btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-danger">{editId ? '💾 Update' : '➕ Add'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
