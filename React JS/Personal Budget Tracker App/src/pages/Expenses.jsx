import React, { useState, useEffect } from 'react';
import {
    expenseAPI, accountAPI, categoryAPI, userAPI
} from '../api/axiosConfig';

const Expenses = ({ userId }) => {
    const [expenses, setExpenses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        accountId: '', categoryId: '', amount: '',
        description: '', dateSpent: '', paymentMethod: 'UPI'
    });

    useEffect(() => {
        loadExpenses();
        loadAccounts();
        loadCategories();
    }, [userId]);

    const loadExpenses = async () => {
        try {
            const res = await expenseAPI.getByUser(userId);
            setExpenses(res.data);
        } catch (err) { console.error(err); }
    };

    const loadAccounts = async () => {
        try {
            const res = await accountAPI.getByUser(userId);
            setAccounts(res.data);
        } catch (err) { console.error(err); }
    };

    const loadCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(
                res.data.filter(c => c.categoryType === 'EXPENSE')
            );
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userRes = await userAPI.getById(userId);
            const account = accounts.find(
                a => a.accountId === parseInt(form.accountId)
            );
            const category = categories.find(
                c => c.categoryId === parseInt(form.categoryId)
            );
            const payload = {
                user: userRes.data,
                account,
                category,
                amount: parseFloat(form.amount),
                description: form.description,
                dateSpent: form.dateSpent,
                paymentMethod: form.paymentMethod
            };
            await expenseAPI.create(payload);
            setShowModal(false);
            setForm({
                accountId: '', categoryId: '', amount: '',
                description: '', dateSpent: '', paymentMethod: 'UPI'
            });
            loadExpenses();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this expense?')) {
            await expenseAPI.delete(id);
            loadExpenses();
        }
    };

    const totalExpense = expenses.reduce(
        (sum, e) => sum + (e.amount || 0), 0
    );

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon expense">💸</div>
                    <div className="stat-info">
                        <h4>Total Expenses</h4>
                        <p className="amount-negative">
                            ₹{totalExpense.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon balance">📝</div>
                    <div className="stat-info">
                        <h4>Transactions</h4>
                        <p>{expenses.length}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>💸 Expense Records</h3>
                    <button
                        className="btn btn-danger"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Expense
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Account</th>
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map((exp) => (
                            <tr key={exp.expenseId}>
                                <td>{exp.dateSpent}</td>
                                <td>
                                    <span className="status-badge active">
                                        {exp.category?.categoryName}
                                    </span>
                                </td>
                                <td>{exp.description}</td>
                                <td>{exp.account?.accountName}</td>
                                <td>{exp.paymentMethod}</td>
                                <td className="amount-negative">
                                    -₹{exp.amount?.toLocaleString()}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(exp.expenseId)}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {expenses.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">💸</div>
                        <p>No expenses recorded yet.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add Expense</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
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
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm({...form, amount: e.target.value})
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Account</label>
                                <select
                                    className="form-control"
                                    value={form.accountId}
                                    onChange={(e) =>
                                        setForm({...form, accountId: e.target.value})
                                    }
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((acc) => (
                                        <option 
                                            key={acc.accountId} 
                                            value={acc.accountId}
                                        >
                                            {acc.accountName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    className="form-control"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({...form, description: e.target.value})
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={form.dateSpent}
                                        onChange={(e) =>
                                            setForm({...form, dateSpent: e.target.value})
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Payment Method</label>
                                    <select
                                        className="form-control"
                                        value={form.paymentMethod}
                                        onChange={(e) =>
                                            setForm({
                                                ...form, 
                                                paymentMethod: e.target.value
                                            })
                                        }
                                    >
                                        <option value="UPI">UPI</option>
                                        <option value="Card">Card</option>
                                        <option value="Cash">Cash</option>
                                        <option value="NetBanking">Net Banking</option>
                                    </select>
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
                                <button type="submit" className="btn btn-danger">
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;