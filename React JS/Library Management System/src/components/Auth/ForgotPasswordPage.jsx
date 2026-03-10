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
  outline: 'none',
};

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [form, setForm] = useState({
    identifier: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setSaving(true);
    try {
      await resetPassword(form.identifier, form.newPassword);
      setSuccess('Password updated successfully. Redirecting to sign in.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
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
            maxWidth: '460px',
            background: 'linear-gradient(165deg, rgba(17, 31, 52, 0.94), rgba(8, 20, 36, 0.96))',
            border: '1px solid rgba(157, 181, 209, 0.24)',
            borderRadius: '16px',
            padding: '24px',
            display: 'grid',
            gap: '13px',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.36)'
          }}
        >
          <h2 style={{ margin: 0, color: '#e8f1fb', fontSize: '24px' }}>Reset Password</h2>
          <p style={{ margin: 0, color: '#8ca4bf', fontSize: '13px' }}>
            Enter your username or email and choose a new password.
          </p>
          <input
            style={inputStyle}
            type="text"
            placeholder="Username or Email"
            value={form.identifier}
            onChange={(e) => setForm((prev) => ({ ...prev, identifier: e.target.value }))}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="New Password"
            value={form.newPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Confirm New Password"
            value={form.confirmPassword}
            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            required
          />
          {error && <p style={{ margin: 0, color: '#fda4a4', fontSize: '12px' }}>{error}</p>}
          {success && <p style={{ margin: 0, color: '#6ee7b7', fontSize: '12px' }}>{success}</p>}
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
            {saving ? 'Updating...' : 'Reset Password'}
          </button>
          <p style={{ margin: 0, color: '#9fb4ca', fontSize: '13px' }}>
            Back to <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </PageTransition>
  );
};

export default ForgotPasswordPage;
