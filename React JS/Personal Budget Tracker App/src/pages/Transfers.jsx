import React, { useState, useEffect } from 'react';
import { transferAPI, accountAPI } from '../api/axiosConfig';

const Transfers = ({ userId }) => {
    const [transfers, setTransfers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        fromAccountId: '', toAccountId: '',
        amount: '', date: '', description: ''
    });

    useEffect(() => {
        loadTransfers();
        loadAccounts();
    }, [userId]);

    const loadTransfers = async () => {
        try {
            const res = await transferAPI.getByUser(userId);
            setTransfers(res.data);
        } catch (err) { console.error(err); }
    };

    const loadAccounts = async () => {
        try {
            const res = await accountAPI.getByUser(userId);
            setAccounts(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fromAccount = accounts.find(
                a => a.accountId === parseInt(form.fromAccountId)
            );
            const toAccount = accounts.find(
                a => a.accountId === parseInt(form.toAccountId)
            );
            const payload = {
                fromAccount,
                toAccount,
                amount: parseFloat(form.amount),
                date: form.date,
                description: form.description
            };
            await transferAPI.create(payload);
            setShowModal(false);
            setForm({
                fromAccountId: '', toAccountId: '',
                amount: '', date: '', description: ''
            });
            loadTransfers();
        } catch (err) { console.error(err); }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>🔄 Transfers</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + New Transfer
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Amount</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.map((t) => (
                            <tr key={t.transferId}>
                                <td>{t.date}</td>
                                <td>{t.fromAccount?.accountName}</td>
                                <td>{t.toAccount?.accountName}</td>
                                <td>₹{t.amount?.toLocaleString()}</td>
                                <td>{t.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {transfers.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🔄</div>
                        <p>No transfers yet.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>New Transfer</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>From Account</label>
                                    <select
                                        className="form-control"
                                        value={form.fromAccountId}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                fromAccountId: e.target.value
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Select</option>
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
                                    <label>To Account</label>
                                    <select
                                        className="form-control"
                                        value={form.toAccountId}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                toAccountId: e.target.value
                                            })
                                        }
                                        required
                                    >
                                        <option value="">Select</option>
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
                            </div>
                            <div className="form-row">
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
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={form.date}
                                        onChange={(e) =>
                                            setForm({...form, date: e.target.value})
                                        }
                                        required
                                    />
                                </div>
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
                                    Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transfers;