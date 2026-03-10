import React, { useState, useEffect, useCallback } from 'react';
import { userAPI, getApiErrorMessage } from '../api/axiosConfig';
import { useAuth } from '../auth/AuthContext';
import { CURRENCY_OPTIONS } from '../utils/currency';

const Profile = () => {
    const { currentUser, updateCurrentUser } = useAuth();
    const userId = currentUser?.userId;

    const [originalUser, setOriginalUser] = useState(null);
    const [profileForm, setProfileForm] = useState({ name: '', email: '', currencyPreference: 'INR' });
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });

    const [loading, setLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);

    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const loadProfile = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await userAPI.getById(userId);
            const user = response.data;
            setOriginalUser(user);
            setProfileForm({
                name: user?.name || '',
                email: user?.email || '',
                currencyPreference: user?.currencyPreference || 'INR'
            });
        } catch (error) {
            setProfileError(getApiErrorMessage(error, 'Failed to load profile'));
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        const name = profileForm.name.trim();
        const email = profileForm.email.trim();

        if (!name || !email) {
            setProfileError('Name and email are required');
            return;
        }

        setProfileSaving(true);
        try {
            const payload = {
                ...originalUser,
                name,
                email,
                currencyPreference: profileForm.currencyPreference
            };
            const response = await userAPI.update(userId, payload);
            const savedUser = response?.data && typeof response.data === 'object' ? response.data : payload;

            setOriginalUser(savedUser);
            setProfileSuccess('Profile updated successfully');
            updateCurrentUser({
                name: savedUser.name,
                email: savedUser.email,
                currencyPreference: savedUser.currencyPreference
            });
        } catch (error) {
            setProfileError(getApiErrorMessage(error, 'Failed to update profile'));
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword.length < 4) {
            setPasswordError('Password must be at least 4 characters');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setPasswordSaving(true);
        try {
            const payload = {
                ...originalUser,
                passwordHash: passwordForm.newPassword
            };
            await userAPI.update(userId, payload);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setPasswordSuccess('Password updated successfully');
        } catch (error) {
            setPasswordError(getApiErrorMessage(error, 'Failed to change password'));
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return <div className="card"><div className="loading-content">⏳ Loading profile...</div></div>;
    }

    return (
        <div>
            <div className="page-title">
                <h2>Profile Settings</h2>
            </div>

            <div className="card">
                <div className="card-header"><h3>👤 Update Profile</h3></div>
                {profileError && <div className="error-message">⚠️ {profileError}</div>}
                {profileSuccess && <div className="success-message">✅ {profileSuccess}</div>}
                <form onSubmit={handleProfileSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                className="form-control"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group profile-currency-select">
                        <label>Currency Preference</label>
                        <select
                            className="form-control"
                            value={profileForm.currencyPreference}
                            onChange={(e) => setProfileForm({ ...profileForm, currencyPreference: e.target.value })}
                        >
                            {CURRENCY_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions profile-actions">
                        <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                            {profileSaving ? '⏳ Updating...' : '💾 Update Profile'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="card">
                <div className="card-header"><h3>🔐 Change Password</h3></div>
                {passwordError && <div className="error-message">⚠️ {passwordError}</div>}
                {passwordSuccess && <div className="success-message">✅ {passwordSuccess}</div>}
                <form onSubmit={handlePasswordSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="Minimum 4 characters"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="form-control"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-actions profile-actions">
                        <button type="submit" className="btn btn-success" disabled={passwordSaving}>
                            {passwordSaving ? '⏳ Updating...' : '🔐 Change Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
