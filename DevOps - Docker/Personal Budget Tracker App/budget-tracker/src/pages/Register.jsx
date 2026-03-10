import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, getApiErrorMessage } from '../api/axiosConfig';
import { CURRENCY_OPTIONS } from '../utils/currency';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', currencyPreference: 'INR' });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const set = (field, value) => { setForm(p => ({ ...p, [field]: value })); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (form.password.length < 4) { setError('Password must be at least 4 characters'); return; }
        setLoading(true);
        try {
            await authAPI.register({ ...form, passwordHash: form.password, role: 'USER' });
            setSuccess('Account created! Redirecting...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Registration failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="login-logo">💰</div>
                    <h2>Create Account</h2>
                    <p>Start managing your finances</p>
                </div>
                {error && <div className="error-message">⚠️ {error}</div>}
                {success && <div className="success-message">✅ {success}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input className="form-control" value={form.name}
                            onChange={(e) => set('name', e.target.value)} placeholder="John Doe" required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" value={form.email}
                            onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control" value={form.password}
                            onChange={(e) => set('password', e.target.value)} placeholder="Min 4 characters" required />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" className="form-control" value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} placeholder="Repeat password" required />
                    </div>
                    <div className="form-group">
                        <label>Currency</label>
                        <select className="form-control" value={form.currencyPreference}
                            onChange={(e) => set('currencyPreference', e.target.value)}>
                            {CURRENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                        {loading ? '⏳ Creating...' : '✅ Create Account'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Already have an account? <Link to="/login">Sign In</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
