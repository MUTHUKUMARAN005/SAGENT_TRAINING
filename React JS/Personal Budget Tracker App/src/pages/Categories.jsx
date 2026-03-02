import React, { useState, useEffect } from 'react';
import { categoryAPI, userAPI } from '../api/axiosConfig';

const Categories = ({ userId }) => {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        categoryName: '', categoryType: 'EXPENSE', isCustom: true
    });

    useEffect(() => { loadCategories(); }, []);

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
            const payload = {
                categoryName: form.categoryName,
                categoryType: form.categoryType,
                user: userRes.data,
                isCustom: true
            };
            await categoryAPI.create(payload);
            setShowModal(false);
            setForm({
                categoryName: '', categoryType: 'EXPENSE', isCustom: true
            });
            loadCategories();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this category?')) {
            await categoryAPI.delete(id);
            loadCategories();
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>🏷️ Categories</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Category
                    </button>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Custom</th>
                            <th>Owner</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map((cat) => (
                            <tr key={cat.categoryId}>
                                <td><strong>{cat.categoryName}</strong></td>
                                <td>
                                    <span className={`status-badge ${
                                        cat.categoryType === 'INCOME'
                                            ? 'active'
                                            : 'completed'
                                    }`}>
                                        {cat.categoryType}
                                    </span>
                                </td>
                                <td>{cat.isCustom ? 'Yes' : 'No'}</td>
                                <td>
                                    {cat.user
                                        ? cat.user.name
                                        : 'System Default'}
                                </td>
                                <td>
                                    {cat.isCustom && (
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() =>
                                                handleDelete(cat.categoryId)
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

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Add Category</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category Name</label>
                                <input
                                    className="form-control"
                                    value={form.categoryName}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            categoryName: e.target.value
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select
                                    className="form-control"
                                    value={form.categoryType}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            categoryType: e.target.value
                                        })
                                    }
                                >
                                    <option value="EXPENSE">Expense</option>
                                    <option value="INCOME">Income</option>
                                </select>
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

export default Categories;