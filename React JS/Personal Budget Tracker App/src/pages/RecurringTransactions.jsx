import React, { useState, useEffect } from 'react';
import { recurringAPI, userAPI } from '../api/axiosConfig';

const RecurringTransactions = ({ userId }) => {
    const [recurring, setRecurring] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        transactionType: '', amount: '',
        frequency: 'MONTHLY', nextDate: '', isActive: true
    });

    useEffect(() => { loadRecurring(); }, [userId]);

    const loadRecurring = async () => {
        try {
            const res = await recurringAPI.getByUser(userId);
            setRecurring(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userRes = await userAPI.getById(userId);
            const payload = {
                user: userRes.data,
                transactionType: form.transactionType,
                amount: parseFloat(form.amount),
                frequency: form.frequency,
                nextDate: form.nextDate,
                isActive: form.isActive
            };
            await recurringAPI.create(payload);
            setShowModal(false);
            setForm({
                transactionType: '', amount: '',
                frequency: 'MONTHLY', nextDate: '', isActive: true
            });
            loadRecurring();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete?')) {
            await recurringAPI.delete(id);
            loadRecurring();
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>🔁 Recurring Transactions</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Recurring
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Frequency</th>
                            <th>Next Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurring.map((rt) => (
                            <tr key={rt.recurringId}>
                                <td>{rt.transactionType}</td>
                                <td>₹{rt.amount?.toLocaleString()}</td>
                                <td>{rt.frequency}</td>
                                <td>{rt.nextDate}</td>
                                <td>
                                    <span className={`status-badge ${
                                        rt.isActive ? 'active' : 'inactive'
                                    }`}>
                                        {rt.isActive ? 'Active' : 'Paused'}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                            handleDelete(rt.recurringId)
                                        }
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {recurring.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🔁</div>
                        <p>No recurring transactions.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add Recurring Transaction</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Transaction Type</label>
                                    <input
                                        className="form-control"
                                        value={form.transactionType}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                transactionType: e.target.value
                                            })
                                        }
                                        placeholder="e.g., Netflix, SIP"
                                        required
                                    />
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Frequency</label>
                                    <select
                                        className="form-control"
                                        value={form.frequency}
                                        onChange={(e) =>
                                            setForm({...form, frequency: e.target.value})
                                        }
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Next Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={form.nextDate}
                                        onChange={(e) =>
                                            setForm({...form, nextDate: e.target.value})
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
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringTransactions;