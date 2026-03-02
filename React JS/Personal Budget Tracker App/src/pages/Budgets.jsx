import React, { useState, useEffect } from 'react';
import { budgetAPI, categoryAPI, userAPI } from '../api/axiosConfig';

const Budgets = ({ userId }) => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        categoryId: '', monthYear: '', amountLimit: '', amountSpent: '0'
    });

    useEffect(() => {
        loadBudgets();
        loadCategories();
    }, [userId]);

    const loadBudgets = async () => {
        try {
            const res = await budgetAPI.getByUser(userId);
            setBudgets(res.data);
        } catch (err) { console.error(err); }
    };

    const loadCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userRes = await userAPI.getById(userId);
            const category = categories.find(
                c => c.categoryId === parseInt(form.categoryId)
            );
            const payload = {
                user: userRes.data,
                category,
                monthYear: form.monthYear,
                amountLimit: parseFloat(form.amountLimit),
                amountSpent: parseFloat(form.amountSpent)
            };
            await budgetAPI.create(payload);
            setShowModal(false);
            setForm({
                categoryId: '', monthYear: '',
                amountLimit: '', amountSpent: '0'
            });
            loadBudgets();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this budget?')) {
            await budgetAPI.delete(id);
            loadBudgets();
        }
    };

    const getProgressClass = (spent, limit) => {
        const pct = (spent / limit) * 100;
        if (pct < 60) return 'green';
        if (pct < 85) return 'yellow';
        return 'red';
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>📋 Budget Management</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Set Budget
                    </button>
                </div>

                {budgets.map((budget) => {
                    const pct = budget.amountLimit > 0
                        ? (budget.amountSpent / budget.amountLimit) * 100
                        : 0;
                    return (
                        <div
                            key={budget.budgetId}
                            style={{
                                padding: '20px',
                                borderBottom: '1px solid #f0f0f0'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 8
                            }}>
                                <div>
                                    <strong>
                                        {budget.category?.categoryName}
                                    </strong>
                                    <span style={{
                                        marginLeft: 12,
                                        color: '#999',
                                        fontSize: '0.85rem'
                                    }}>
                                        {budget.monthYear}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <span>
                                        ₹{budget.amountSpent?.toLocaleString()} / 
                                        ₹{budget.amountLimit?.toLocaleString()}
                                    </span>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(budget.budgetId)}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div className="progress-bar">
                                <div
                                    className={`progress-fill ${
                                        getProgressClass(
                                            budget.amountSpent, 
                                            budget.amountLimit
                                        )
                                    }`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                            </div>
                            <div style={{
                                textAlign: 'right',
                                fontSize: '0.8rem',
                                color: '#999',
                                marginTop: 4
                            }}>
                                {pct.toFixed(1)}% used
                            </div>
                        </div>
                    );
                })}

                {budgets.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No budgets set. Create your first budget!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Set Budget</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    className="form-control"
                                    value={form.categoryId}
                                    onChange={(e) =>
                                        setForm({...form, categoryId: e.target.value})
                                    }
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((cat) => (
                                        <option
                                            key={cat.categoryId}
                                            value={cat.categoryId}
                                        >
                                            {cat.categoryName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Month (YYYY-MM)</label>
                                    <input
                                        type="month"
                                        className="form-control"
                                        value={form.monthYear}
                                        onChange={(e) =>
                                            setForm({...form, monthYear: e.target.value})
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Budget Limit</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.amountLimit}
                                        onChange={(e) =>
                                            setForm({...form, amountLimit: e.target.value})
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowModal(false)}
                                    style={{ background: '#eee' }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Set Budget
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budgets;