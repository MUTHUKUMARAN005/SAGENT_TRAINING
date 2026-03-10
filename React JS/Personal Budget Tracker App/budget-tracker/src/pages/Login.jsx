import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { authAPI, getApiErrorMessage } from '../api/axiosConfig';

const normalizeAuthUser = (rawResponse, email) => {
    const source = rawResponse?.user || rawResponse?.data || rawResponse;
    if (!source || typeof source !== 'object') return null;

    const rawRole = String(source.role || source.userType || 'USER').toUpperCase();
    const role = rawRole === 'ADMIN' || rawRole === 'VIEWER' ? rawRole : 'USER';

    return {
        ...source,
        userId: source.userId ?? source.id ?? null,
        role,
        name: source.name || source.fullName || source.username || email,
        email: source.email || email,
        token: source.token || rawResponse?.token || null
    };
};

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
            const res = await authAPI.login({ email, password, passwordHash: password });
            const user = normalizeAuthUser(res.data, email);
            if (!user) throw new Error('Invalid login response from backend');
            login(user);
            navigate('/');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Login failed'));
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (e, p) => {
        setEmail(e);
        setPassword(p);
        setError('');
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">💰</div>
                    <h2>Budget Tracker</h2>
                    <p>Sign in to manage your finances</p>
                </div>

                {error && <div className="error-message">⚠️ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email Address</label>
                        <input type="email" className="form-control"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com" required autoFocus />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password" required />
                    </div>
                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? '⏳ Signing in...' : '🔐 Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Don't have an account? <Link to="/register">Create one</Link></p>
                </div>

                <div className="demo-credentials">
                    <h4>Quick Login:</h4>
                    <div className="demo-item demo-clickable" onClick={() => fillDemo('arun@gmail.com', 'hash1')}>
                        <span className="role-badge role-admin">ADMIN</span>
                        <span>arun@gmail.com</span>
                        <span className="demo-arrow">→</span>
                    </div>
                    <div className="demo-item demo-clickable" onClick={() => fillDemo('bala@gmail.com', 'hash2')}>
                        <span className="role-badge role-user">USER</span>
                        <span>bala@gmail.com</span>
                        <span className="demo-arrow">→</span>
                    </div>
                    <div className="demo-item demo-clickable" onClick={() => fillDemo('dinesh@gmail.com', 'hash4')}>
                        <span className="role-badge role-viewer">VIEWER</span>
                        <span>dinesh@gmail.com</span>
                        <span className="demo-arrow">→</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
