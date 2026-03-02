import React, { useState, useEffect } from 'react';
import { incomeAPI, accountAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const Income = () => {

    const { currentUser } = useAuth();
    const canCreate = usePermission('CREATE_INCOME');
    const canDelete = usePermission('DELETE_INCOME');

    const [incomes, setIncomes] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        accountId: '',
        amount: '',
        incomeType: 'Salary',
        description: '',
        dateReceived: '',
        isRecurring: false
    });

    useEffect(() => {
        loadIncomes();
        loadAccounts();
    }, [currentUser]);

    const loadIncomes = async () => {
        try {
            const res = await incomeAPI.getByUser(currentUser.userId);
            setIncomes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadAccounts = async () => {
        try {
            const res = await accountAPI.getByUser(currentUser.userId);
            setAccounts(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canCreate) return;

        try {
            const userRes = await userAPI.getById(currentUser.userId);
            const account = accounts.find(
                a => a.accountId === parseInt(form.accountId)
            );
            const payload = {
                user: userRes.data,
                account,
                amount: parseFloat(form.amount),
                incomeType: form.incomeType,
                description: form.description,
                dateReceived: form.dateReceived,
                isRecurring: form.isRecurring
            };

            await incomeAPI.create(payload);
            setShowModal(false);
            setForm({
                accountId: '',
                amount: '',
                incomeType: 'Salary',
                description: '',
                dateReceived: '',
                isRecurring: false
            });
            loadIncomes();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (!canDelete) return;
        if (window.confirm('Delete this income?')) {
            await incomeAPI.delete(id);
            loadIncomes();
        }
    };

    const totalIncome = incomes.reduce(
        (sum, i) => sum + (i.amount || 0), 0
    );

    return (
        <div>
            <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card">
                    <div className="stat-icon income">💰</div>
                    <div className="stat-info">
                        <h4>Total Income</h4>
                        <p className="amount-positive">
                            ₹{totalIncome.toLocaleString()}
                        </p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon balance">📝</div>
                    <div className="stat-info">
                        <h4>Transactions</h4>
                        <p>{incomes.length}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h3>💰 Income Records</h3>
                    {canCreate && (
                        <button
                            className="btn btn-success"
                            onClick={() => setShowModal(true)}
                        >
                            + Add Income
                        </button>
                    )}
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Account</th>
                            <th>Amount</th>
                            <th>Recurring</th>
                            {canDelete && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {incomes.map((inc) => (
                            <tr key={inc.incomeId}>
                                <td>{inc.dateReceived}</td>
                                <td>{inc.incomeType}</td>
                                <td>{inc.description}</td>
                                <td>{inc.account?.accountName}</td>
                                <td className="amount-positive">
                                    +₹{inc.amount?.toLocaleString()}
                                </td>
                                <td>{inc.isRecurring ? '🔁 Yes' : 'No'}</td>
                                {canDelete && (
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                                handleDelete(inc.incomeId)
                                            }
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {incomes.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">💰</div>
                        <p>No income records yet.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && canCreate && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Add Income</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Income Type</label>
                                    <select
                                        className="form-control"
                                        value={form.incomeType}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                incomeType: e.target.value
                                            })
                                        }
                                    >
                                        <option value="Salary">Salary</option>
                                        <option value="Freelance">Freelance</option>
                                        <option value="Investment">Investment</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.amount}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                amount: e.target.value
                                            })
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
                                        setForm({
                                            ...form,
                                            accountId: e.target.value
                                        })
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
                                        setForm({
                                            ...form,
                                            description: e.target.value
                                        })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date Received</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={form.dateReceived}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                dateReceived: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingTop: 24
                                }}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={form.isRecurring}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    isRecurring: e.target.checked
                                                })
                                            }
                                            style={{ marginRight: 8 }}
                                        />
                                        Recurring Income
                                    </label>
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
                                <button
                                    type="submit"
                                    className="btn btn-success"
                                >
                                    Add Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;