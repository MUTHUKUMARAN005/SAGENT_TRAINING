import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axiosConfig';

const Register = () => {

    const [form, setForm] = useState({
        name: '',
        email: '',
        passwordHash: '',
        currencyPreference: 'INR'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await API.post('/auth/register', {
                ...form,
                role: 'USER'
            });

            navigate('/login');

        } catch (err) {
            setError(
                err.response?.data?.error || 'Registration failed.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>💰</h1>
                    <h2>Create Account</h2>
                    <p>Start managing your finances today</p>
                </div>

                {error && (
                    <div className="error-message">⚠️ {error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            className="form-control"
                            value={form.name}
                            onChange={(e) =>
                                setForm({ ...form, name: e.target.value })
                            }
                            placeholder="Enter your name"
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
                                setForm({ ...form, email: e.target.value })
                            }
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={form.passwordHash}
                            onChange={(e) =>
                                setForm({ ...form, passwordHash: e.target.value })
                            }
                            placeholder="Create a password"
                            required
                        />
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
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;