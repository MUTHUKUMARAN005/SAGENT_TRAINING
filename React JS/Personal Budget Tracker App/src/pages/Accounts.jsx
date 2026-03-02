import React, { useState, useEffect } from 'react';
import { accountAPI, userAPI } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { usePermission } from '../auth/RoleGuard';

const Accounts = () => {

    const { currentUser } = useAuth();
    const canCreate = usePermission('CREATE_ACCOUNT');
    const canEdit = usePermission('EDIT_ACCOUNT');
    const canDelete = usePermission('DELETE_ACCOUNT');

    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({
        accountName: '',
        accountType: 'BANK',
        initialBalance: '',
        currentBalance: '',
        isActive: true
    });

    useEffect(() => {
        loadAccounts();
    }, [currentUser]);

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
        try {
            const userRes = await userAPI.getById(currentUser.userId);
            const payload = {
                ...form,
                user: userRes.data,
                initialBalance: parseFloat(form.initialBalance),
                currentBalance: parseFloat(
                    form.currentBalance || form.initialBalance
                )
            };

            if (editId) {
                await accountAPI.update(editId, payload);
            } else {
                await accountAPI.create(payload);
            }

            setShowModal(false);
            resetForm();
            loadAccounts();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (account) => {
        if (!canEdit) return;
        setEditId(account.accountId);
        setForm({
            accountName: account.accountName,
            accountType: account.accountType,
            initialBalance: account.initialBalance,
            currentBalance: account.currentBalance,
            isActive: account.isActive
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!canDelete) return;
        if (window.confirm('Delete this account?')) {
            await accountAPI.delete(id);
            loadAccounts();
        }
    };

    const resetForm = () => {
        setEditId(null);
        setForm({
            accountName: '',
            accountType: 'BANK',
            initialBalance: '',
            currentBalance: '',
            isActive: true
        });
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>🏦 Accounts</h3>

                    {/* Only show Add button if user has permission */}
                    {canCreate && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                resetForm();
                                setShowModal(true);
                            }}
                        >
                            + Add Account
                        </button>
                    )}
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Account Name</th>
                            <th>Type</th>
                            <th>Initial Balance</th>
                            <th>Current Balance</th>
                            <th>Status</th>
                            {(canEdit || canDelete) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((acc) => (
                            <tr key={acc.accountId}>
                                <td><strong>{acc.accountName}</strong></td>
                                <td>{acc.accountType}</td>
                                <td>₹{acc.initialBalance?.toLocaleString()}</td>
                                <td className={
                                    acc.currentBalance >= acc.initialBalance
                                        ? 'amount-positive'
                                        : 'amount-negative'
                                }>
                                    ₹{acc.currentBalance?.toLocaleString()}
                                </td>
                                <td>
                                    <span className={`status-badge ${
                                        acc.isActive ? 'active' : 'inactive'
                                    }`}>
                                        {acc.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>

                                {/* Conditionally show action buttons */}
                                {(canEdit || canDelete) && (
                                    <td>
                                        {canEdit && (
                                            <button
                                                className="btn btn-warning btn-sm"
                                                onClick={() => handleEdit(acc)}
                                                style={{ marginRight: 8 }}
                                            >
                                                ✏️
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() =>
                                                    handleDelete(acc.accountId)
                                                }
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {accounts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🏦</div>
                        <p>No accounts found.</p>
                    </div>
                )}
            </div>

            {/* Modal - Only accessible with permission */}
            {showModal && canCreate && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>
                            {editId ? 'Edit Account' : 'Add New Account'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Account Name</label>
                                <input
                                    className="form-control"
                                    value={form.accountName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            accountName: e.target.value
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Account Type</label>
                                    <select
                                        className="form-control"
                                        value={form.accountType}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                accountType: e.target.value
                                            })
                                        }
                                    >
                                        <option value="BANK">Bank</option>
                                        <option value="CASH">Cash</option>
                                        <option value="CREDIT_CARD">
                                            Credit Card
                                        </option>
                                        <option value="WALLET">Wallet</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Initial Balance</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.initialBalance}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                initialBalance: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Current Balance</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={form.currentBalance}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            currentBalance: e.target.value
                                        })
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
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {editId ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;