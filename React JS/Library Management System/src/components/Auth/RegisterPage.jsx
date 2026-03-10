import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import PageTransition from '../Common/PageTransition';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(157, 181, 209, 0.28)',
  background: 'rgba(13, 31, 53, 0.78)',
  color: '#e8f1fb',
  outline: 'none'
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }

    setSaving(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        username: form.username,
        password: form.password,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', padding: '20px' }}>
        <form
          onSubmit={onSubmit}
          style={{
            width: '100%',
            maxWidth: '440px',
            background: 'linear-gradient(165deg, rgba(17, 31, 52, 0.94), rgba(8, 20, 36, 0.96))',
            border: '1px solid rgba(157, 181, 209, 0.24)',
            borderRadius: '16px',
            padding: '24px',
            display: 'grid',
            gap: '13px',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.36)'
          }}
        >
          <h2 style={{ margin: 0, color: '#e8f1fb', fontSize: '24px' }}>Create Account</h2>
          <p style={{ margin: 0, color: '#8ca4bf', fontSize: '13px' }}>Register as a new library member.</p>
          <input
            style={inputStyle}
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            style={inputStyle}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            required
          />
          <input
            style={inputStyle}
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          {error && (
            <p style={{ margin: 0, color: '#fda4a4', fontSize: '12px' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              border: 'none',
              borderRadius: '10px',
              background: saving ? '#5c738e' : 'linear-gradient(135deg, #0ea5a4, #3b82f6)',
              color: '#fff',
              padding: '12px 14px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Creating...' : 'Register'}
          </button>
          <p style={{ margin: 0, color: '#9fb4ca', fontSize: '13px' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;
