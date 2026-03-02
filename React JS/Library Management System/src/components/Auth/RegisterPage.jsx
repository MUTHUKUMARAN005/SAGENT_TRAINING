import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageTransition from '../Common/PageTransition';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.55)',
  color: '#e2e8f0',
  outline: 'none',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const onSubmit = (event) => {
    event.preventDefault();
    navigate('/login', { replace: true });
  };

  return (
    <PageTransition>
      <div
        style={{
          minHeight: '70vh',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <form
          onSubmit={onSubmit}
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            display: 'grid',
            gap: '14px',
          }}
        >
          <h2 style={{ margin: 0, color: '#f8fafc' }}>Create Account</h2>
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
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />
          <button
            type="submit"
            style={{
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)',
              color: '#fff',
              padding: '12px 14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Register
          </button>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </PageTransition>
  );
};

export default RegisterPage;
