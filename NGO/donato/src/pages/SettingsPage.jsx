import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiAlertTriangle,
  FiBell,
  FiCheckCircle,
  FiGlobe,
  FiLock,
  FiRotateCcw,
  FiSave,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import { pageTransition, fadeInUp, staggerContainer } from '../animations/variants';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../utils/api';
import AddressPicker from '../components/map/AddressPicker';

const SETTINGS_STORAGE_KEY = 'kindwave_settings';

const getBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
};

const createDefaultSettings = (language, theme) => ({
  notifications: {
    emailUpdates: true,
    smsNotifications: true,
    campaignAlerts: true,
    weeklyDigest: false,
    pickupReminders: true,
  },
  privacy: {
    showProfileOnLeaderboard: false,
    showDonationHistory: true,
  },
  security: {
    twoFactorAuth: false,
    loginAlerts: true,
  },
  preferences: {
    language: language || 'en',
    theme: theme || 'classic',
    timezone: getBrowserTimezone(),
    currency: 'INR',
  },
});

const mergeSettings = (defaults, saved) => {
  if (!saved || typeof saved !== 'object') return defaults;
  return {
    ...defaults,
    notifications: { ...defaults.notifications, ...saved.notifications },
    privacy: { ...defaults.privacy, ...saved.privacy },
    security: { ...defaults.security, ...saved.security },
    preferences: { ...defaults.preferences, ...saved.preferences },
  };
};

const toggleClass = (isOn) =>
  `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    isOn ? 'bg-primary-600' : 'bg-slate-700'
  }`;

const SettingsPage = () => {
  const { user, login, logout } = useAuth();
  const { language, setLanguage, languages } = useLanguage();
  const { theme, setTheme, themes } = useTheme();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    latitude: user?.latitude ?? null,
    longitude: user?.longitude ?? null,
  });
  const [settings, setSettings] = useState(() => createDefaultSettings(language, theme));
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      latitude: user?.latitude ?? null,
      longitude: user?.longitude ?? null,
    });

    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        emailUpdates: Boolean(user?.emailUpdatesEnabled ?? true),
        smsNotifications: Boolean(user?.smsNotificationsEnabled ?? true),
        campaignAlerts: Boolean(user?.campaignAlertsEnabled ?? true),
        weeklyDigest: Boolean(user?.weeklyDigestEnabled ?? false),
        pickupReminders: Boolean(user?.pickupRemindersEnabled ?? true),
      },
    }));
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      if (!user?.token && !user?.accessToken) return;
      if (
        user?.emailUpdatesEnabled !== undefined &&
        user?.smsNotificationsEnabled !== undefined &&
        user?.campaignAlertsEnabled !== undefined &&
        user?.pickupRemindersEnabled !== undefined &&
        user?.address !== undefined
      ) {
        return;
      }

      try {
        const result = await api.getCurrentUser();
        if (isMounted && result.success && result.data) {
          login({
            ...user,
            ...result.data,
            token: user?.token,
            accessToken: user?.accessToken,
          });
        }
      } catch {
        // Keep local auth state if profile refresh fails.
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [login, user]);

  useEffect(() => {
    const defaults = createDefaultSettings(language, theme);
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!stored) {
      setSettings(defaults);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      const merged = mergeSettings(defaults, parsed);
      setSettings({
        ...merged,
        preferences: {
          ...merged.preferences,
          theme,
        },
      });
    } catch {
      setSettings(defaults);
    }
  }, [language, theme]);

  const timezoneOptions = useMemo(
    () => [
      'Asia/Kolkata',
      'Asia/Dubai',
      'UTC',
      'Europe/London',
      'America/New_York',
      'America/Chicago',
      'America/Los_Angeles',
    ],
    []
  );

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggle = (section, key) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: !prev[section][key],
      },
    }));
  };

  const handlePreferenceChange = (key, value) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        preferences: {
          ...prev.preferences,
          [key]: value,
        },
      };

      if (key === 'theme') {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });

    if (key === 'theme') {
      setTheme(value);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const updatedSettings = {
      ...settings,
      preferences: {
        ...settings.preferences,
        language: settings.preferences.language || language,
      },
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));

    if (user) {
      try {
        const result = await api.updateProfile({
          name: profile.name,
          phone: profile.phone,
            address: profile.address,
            city: profile.city,
            latitude: profile.latitude,
            longitude: profile.longitude,
            emailUpdatesEnabled: settings.notifications.emailUpdates,
            smsNotificationsEnabled: settings.notifications.smsNotifications,
            campaignAlertsEnabled: settings.notifications.campaignAlerts,
            weeklyDigestEnabled: settings.notifications.weeklyDigest,
            pickupRemindersEnabled: settings.notifications.pickupReminders,
        });

        if (!result.success) {
          toast.error(result.error || 'Unable to update profile');
          return;
        }

        login({
          ...user,
          ...result.data,
          token: user?.token,
          accessToken: user?.accessToken,
        });
      } catch (error) {
        toast.error(error?.message || 'Unable to update profile');
        return;
      }
    }

    if (updatedSettings.preferences.language !== language) {
      setLanguage(updatedSettings.preferences.language);
    }
    if (updatedSettings.preferences.theme !== theme) {
      setTheme(updatedSettings.preferences.theme);
    }

    toast.success('Settings saved successfully');
  };

  const handleReset = () => {
    const defaults = createDefaultSettings(language, 'classic');
    setSettings(defaults);
    setTheme('classic');
    setProfile({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      latitude: user?.latitude ?? null,
      longitude: user?.longitude ?? null,
    });
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    toast.success('Settings reset to defaults');
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      const result = await api.changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      if (!result.success) {
        toast.error(result.error || 'Unable to change password');
        return;
      }

      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error?.message || 'Unable to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    const confirmed = window.confirm('Deleting your account is permanent and cannot be undone. Continue?');
    if (!confirmed) return;

    try {
      const result = await api.deleteAccount(deletePassword);
      if (!result.success) {
        toast.error(result.error || 'Unable to delete account');
        return;
      }

      logout();
      toast.success('Your account has been deleted');
      window.location.href = '/';
    } catch (error) {
      toast.error(error?.message || 'Unable to delete account');
    }
  };

  const notificationItems = [
    {
      key: 'emailUpdates',
      title: 'Email Updates',
      description: 'Get updates about campaign progress and receipts.',
    },
    {
      key: 'campaignAlerts',
      title: 'Campaign Alerts',
      description: 'Receive notifications for campaigns you follow.',
    },
    {
      key: 'smsNotifications',
      title: 'SMS Notifications',
      description: 'Get donation confirmations and reminders on your phone.',
    },
    {
      key: 'weeklyDigest',
      title: 'Weekly Digest',
      description: 'Get a weekly summary of donations and activity.',
    },
    {
      key: 'pickupReminders',
      title: 'Pickup Reminders',
      description: 'Get reminders for scheduled pickup donations.',
    },
  ];

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-glow-gradient opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <motion.div variants={fadeInUp} className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
                Account <span className="gradient-text">Settings</span>
              </h1>
              <p className="text-slate-400 mt-2">
                Manage your profile, privacy, notifications, and app preferences.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm capitalize">
              <FiCheckCircle className="w-4 h-4" />
              {user?.role || 'donor'} account
            </div>
          </motion.div>

          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.section variants={fadeInUp} className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <FiUser className="w-4 h-4 text-primary-400" />
                <h2 className="text-white font-semibold text-lg">Profile Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="input-label">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="input-field"
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-slate-500 mt-1">Email updates are handled from account verification flow.</p>
                </div>

                <div>
                  <label className="input-label">Phone Number</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    className="input-field"
                    placeholder="+91 90000 00000"
                  />
                </div>

                <div>
                  <label className="input-label">Address Picker</label>
                  <AddressPicker
                    value={{
                      lat: profile.latitude,
                      lng: profile.longitude,
                      address: profile.address,
                    }}
                    onChange={({ lat, lng, address }) => {
                      const cityGuess = address?.split(',').slice(-3, -2)[0]?.trim() || '';
                      setProfile((prev) => ({
                        ...prev,
                        address,
                        latitude: lat,
                        longitude: lng,
                        city: prev.city || cityGuess,
                      }));
                    }}
                  />
                </div>

                <div>
                  <label className="input-label">Address</label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => handleProfileChange('address', e.target.value)}
                    className="input-field resize-none"
                    rows={3}
                    placeholder="Your exact pickup or account address"
                  />
                </div>

                <div>
                  <label className="input-label">City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) => handleProfileChange('city', e.target.value)}
                    className="input-field"
                    placeholder="Your city"
                  />
                </div>
              </div>
            </motion.section>

            <motion.section variants={fadeInUp} className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <FiBell className="w-4 h-4 text-primary-400" />
                <h2 className="text-white font-semibold text-lg">Notification Settings</h2>
              </div>

              <div className="space-y-4">
                {notificationItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-start gap-3 p-3 rounded-xl border border-white/10 hover:border-white/20"
                  >
                    <input
                      type="checkbox"
                      className="checkbox-field mt-0.5"
                      checked={settings.notifications[item.key]}
                      onChange={() => handleToggle('notifications', item.key)}
                    />
                    <div>
                      <p className="text-white text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </motion.section>

            <motion.section variants={fadeInUp} className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="w-4 h-4 text-primary-400" />
                <h2 className="text-white font-semibold text-lg">Privacy & Security</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10">
                  <div>
                    <p className="text-white text-sm font-medium">Show Profile on Leaderboard</p>
                    <p className="text-xs text-slate-400">Allow your name to appear in donor rankings.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('privacy', 'showProfileOnLeaderboard')}
                    className={toggleClass(settings.privacy.showProfileOnLeaderboard)}
                    aria-label="Toggle profile visibility"
                    aria-pressed={settings.privacy.showProfileOnLeaderboard}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.privacy.showProfileOnLeaderboard ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10">
                  <div>
                    <p className="text-white text-sm font-medium">Show Donation History</p>
                    <p className="text-xs text-slate-400">Display your donation activity in your profile.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('privacy', 'showDonationHistory')}
                    className={toggleClass(settings.privacy.showDonationHistory)}
                    aria-label="Toggle donation history visibility"
                    aria-pressed={settings.privacy.showDonationHistory}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.privacy.showDonationHistory ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10">
                  <div className="flex items-start gap-2">
                    <FiLock className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-slate-400">Add an extra layer of account security.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('security', 'twoFactorAuth')}
                    className={toggleClass(settings.security.twoFactorAuth)}
                    aria-label="Toggle two-factor authentication"
                    aria-pressed={settings.security.twoFactorAuth}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.security.twoFactorAuth ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10">
                  <div>
                    <p className="text-white text-sm font-medium">Login Alerts</p>
                    <p className="text-xs text-slate-400">Notify you when your account is accessed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle('security', 'loginAlerts')}
                    className={toggleClass(settings.security.loginAlerts)}
                    aria-label="Toggle login alerts"
                    aria-pressed={settings.security.loginAlerts}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        settings.security.loginAlerts ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.section>

            <motion.section variants={fadeInUp} className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <FiGlobe className="w-4 h-4 text-primary-400" />
                <h2 className="text-white font-semibold text-lg">App Preferences</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Theme</label>
                  <select
                    value={settings.preferences.theme}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                    className="select-field"
                  >
                    {themes.map((themeOption) => (
                      <option key={themeOption.code} value={themeOption.code}>
                        {themeOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Language</label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    className="select-field"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.nativeLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Timezone</label>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    className="select-field"
                  >
                    {timezoneOptions.map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="input-label">Currency</label>
                  <select
                    value={settings.preferences.currency}
                    onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                    className="select-field"
                  >
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
            </motion.section>

            <motion.section variants={fadeInUp} className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <FiLock className="w-4 h-4 text-primary-400" />
                <h2 className="text-white font-semibold text-lg">Password Management</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="input-label">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="input-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="input-field"
                  />
                </div>

                <button type="button" onClick={handleChangePassword} className="btn-secondary inline-flex items-center gap-2 px-4 py-2">
                  <FiLock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </motion.section>

            <motion.section variants={fadeInUp} className="dashboard-card border border-red-500/30 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <FiAlertTriangle className="w-4 h-4 text-red-400" />
                <h2 className="text-white font-semibold text-lg">Delete Account</h2>
              </div>

              <p className="text-sm text-slate-300 mb-4">
                Deleting your account is permanent and cannot be undone.
              </p>

              <div className="flex flex-col md:flex-row md:items-end gap-3">
                <div className="flex-1">
                  <label className="input-label">Confirm with password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="input-field"
                    placeholder="Enter current password"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 transition-colors"
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </motion.section>

            <motion.div variants={fadeInUp} className="lg:col-span-2 flex flex-wrap items-center gap-3 justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5"
              >
                <FiRotateCcw className="w-4 h-4" />
                Reset
              </button>
              <button type="submit" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5">
                <FiSave className="w-4 h-4" />
                Save Settings
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
