import React, { useState, useEffect } from 'react';
import { userAPI } from '../../api/axiosConfig';
import { useAuth } from '../../auth/AuthContext';
import { ROLES } from '../../auth/permissions';

const UserManagement = () => {

    const { currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [form, setForm] = useState({
        name: '',
        email: '',
        role: 'USER',
        currencyPreference: 'INR'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const res = await userAPI.getAll();
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (user) => {
        setEditUser(user);
        setForm({
            name: user.name,
            email: user.email,
            role: user.role,
            currencyPreference: user.currencyPreference
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editUser) {
                await userAPI.update(editUser.userId, form);
            }
            setShowModal(false);
            setEditUser(null);
            loadUsers();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (id === currentUser.userId) {
            alert('You cannot delete your own account!');
            return;
        }
        if (window.confirm('Delete this user permanently?')) {
            try {
                await userAPI.delete(id);
                loadUsers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const getRoleBadgeClass = (role) => {
        return `role-badge role-${role?.toLowerCase()}`;
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>👥 User Management</h3>
                    <div>
                        <span style={{
                            fontSize: '0.85rem',
                            color: '#666',
                            marginRight: 16
                        }}>
                            Total Users: {users.length}
                        </span>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Currency</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.userId}>
                                <td>#{user.userId}</td>
                                <td>
                                    <strong>{user.name}</strong>
                                    {user.userId === currentUser.userId && (
                                        <span style={{
                                            marginLeft: 8,
                                            fontSize: '0.75rem',
                                            color: '#1a237e'
                                        }}>
                                            (You)
                                        </span>
                                    )}
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={getRoleBadgeClass(user.role)}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>{user.currencyPreference}</td>
                                <td>
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : 'N/A'}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-warning btn-sm"
                                        onClick={() => handleEdit(user)}
                                        style={{ marginRight: 8 }}
                                    >
                                        ✏️
                                    </button>
                                    {user.userId !== currentUser.userId && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                                handleDelete(user.userId)
                                            }
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {showModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>Edit User</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    className="form-control"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role</label>
                                    <select
                                        className="form-control"
                                        value={form.role}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                role: e.target.value
                                            })
                                        }
                                    >
                                        <option value={ROLES.ADMIN}>
                                            Admin
                                        </option>
                                        <option value={ROLES.USER}>
                                            User
                                        </option>
                                        <option value={ROLES.VIEWER}>
                                            Viewer
                                        </option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select
                                        className="form-control"
                                        value={form.currencyPreference}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                currencyPreference: e.target.value
                                            })
                                        }
                                    >
                                        <option value="INR">INR</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
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
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    Update User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;