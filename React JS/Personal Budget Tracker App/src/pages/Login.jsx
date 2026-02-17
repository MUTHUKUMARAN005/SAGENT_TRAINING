import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import API from '../api/axiosConfig';

const Login = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await API.post('/auth/login', {
                email,
                password
            });

            login(res.data);
            navigate('/');

        } catch (err) {
            setError(
                err.response?.data?.error || 'Login failed. Please try again.'
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
                    <h2>Budget Tracker</h2>
                    <p>Sign in to manage your finances</p>
                </div>

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary login-btn"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        Don't have an account?{' '}
                        <Link to="/register">Register</Link>
                    </p>
                </div>

                {/* Demo Credentials */}
                <div className="demo-credentials">
                    <h4>Demo Accounts:</h4>
                    <div className="demo-item">
                        <span className="role-badge role-admin">ADMIN</span>
                        <span>arun@gmail.com / hash1</span>
                    </div>
                    <div className="demo-item">
                        <span className="role-badge role-user">USER</span>
                        <span>bala@gmail.com / hash2</span>
                    </div>
                    <div className="demo-item">
                        <span className="role-badge role-viewer">VIEWER</span>
                        <span>dinesh@gmail.com / hash4</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;