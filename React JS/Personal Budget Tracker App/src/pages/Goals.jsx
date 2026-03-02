import React, { useState, useEffect } from 'react';
import { goalAPI, userAPI } from '../api/axiosConfig';

const Goals = ({ userId }) => {
    const [goals, setGoals] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [contributeModal, setContributeModal] = useState(null);
    const [contributeAmount, setContributeAmount] = useState('');
    const [form, setForm] = useState({
        goalName: '', targetAmount: '',
        currentAmount: '0', targetDate: '', status: 'ACTIVE'
    });

    useEffect(() => { loadGoals(); }, [userId]);

    const loadGoals = async () => {
        try {
            const res = await goalAPI.getByUser(userId);
            setGoals(res.data);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userRes = await userAPI.getById(userId);
            const payload = {
                user: userRes.data,
                goalName: form.goalName,
                targetAmount: parseFloat(form.targetAmount),
                currentAmount: parseFloat(form.currentAmount),
                targetDate: form.targetDate,
                status: form.status
            };
            await goalAPI.create(payload);
            setShowModal(false);
            setForm({
                goalName: '', targetAmount: '',
                currentAmount: '0', targetDate: '', status: 'ACTIVE'
            });
            loadGoals();
        } catch (err) { console.error(err); }
    };

    const handleContribute = async () => {
        try {
            await goalAPI.contribute(
                contributeModal, parseFloat(contributeAmount)
            );
            setContributeModal(null);
            setContributeAmount('');
            loadGoals();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this goal?')) {
            await goalAPI.delete(id);
            loadGoals();
        }
    };

    return (
        <div>
            <div className="card">
                <div className="card-header">
                    <h3>🎯 Financial Goals</h3>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowModal(true)}
                    >
                        + Add Goal
                    </button>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: 20,
                    padding: 10
                }}>
                    {goals.map((goal) => {
                        const pct = goal.targetAmount > 0
                            ? (goal.currentAmount / goal.targetAmount) * 100
                            : 0;
                        return (
                            <div
                                key={goal.goalId}
                                className="card"
                                style={{ margin: 0 }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h4>{goal.goalName}</h4>
                                    <span className={`status-badge ${
                                        goal.status?.toLowerCase()
                                    }`}>
                                        {goal.status}
                                    </span>
                                </div>
                                <div style={{
                                    margin: '16px 0',
                                    fontSize: '0.9rem',
                                    color: '#666'
                                }}>
                                    <p>
                                        Target: ₹{goal.targetAmount?.toLocaleString()}
                                    </p>
                                    <p>
                                        Saved: ₹{goal.currentAmount?.toLocaleString()}
                                    </p>
                                    <p>Target Date: {goal.targetDate}</p>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className={`progress-fill ${
                                            pct >= 100
                                                ? 'green'
                                                : pct >= 50
                                                ? 'yellow'
                                                : 'red'
                                        }`}
                                        style={{
                                            width: `${Math.min(pct, 100)}%`
                                        }}
                                    />
                                </div>
                                <p style={{
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    color: '#666',
                                    margin: '8px 0'
                                }}>
                                    {pct.toFixed(1)}% complete
                                </p>
                                <div style={{
                                    display: 'flex',
                                    gap: 8,
                                    justifyContent: 'center'
                                }}>
                                    {goal.status === 'ACTIVE' && (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() =>
                                                setContributeModal(goal.goalId)
                                            }
                                        >
                                            💰 Contribute
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                            handleDelete(goal.goalId)
                                        }
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {goals.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">🎯</div>
                        <p>No goals set yet. Start planning!</p>
                    </div>
                )}
            </div>

            {/* Add Goal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Create New Goal</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Goal Name</label>
                                <input
                                    className="form-control"
                                    value={form.goalName}
                                    onChange={(e) =>
                                        setForm({...form, goalName: e.target.value})
                                    }
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Target Amount</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={form.targetAmount}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                targetAmount: e.target.value
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Target Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={form.targetDate}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                targetDate: e.target.value
                                            })
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
                                    Create Goal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribute Modal */}
            {contributeModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setContributeModal(null)}
                >
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Contribute to Goal</h3>
                        <div className="form-group">
                            <label>Amount</label>
                            <input
                                type="number"
                                className="form-control"
                                value={contributeAmount}
                                onChange={(e) =>
                                    setContributeAmount(e.target.value)
                                }
                                placeholder="Enter amount"
                            />
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn"
                                onClick={() => setContributeModal(null)}
                                style={{ background: '#eee' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleContribute}
                            >
                                Contribute
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;