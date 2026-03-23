import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiHeart, FiKey, FiMail, FiPhone, FiRefreshCw, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getDashboardPathByRole } from '../../utils/roles';
import { pageTransition, fadeInUp, staggerContainer } from '../../animations/variants';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, isAuthenticated } = useAuth();

  const [email, setEmail] = useState(location.state?.email || user?.email || '');
  const [phone, setPhone] = useState(location.state?.phone || user?.phone || '');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [emailVerified, setEmailVerified] = useState(Boolean(user?.emailVerified));
  const [phoneVerified, setPhoneVerified] = useState(Boolean(user?.phoneVerified));

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
    if (typeof user?.emailVerified === 'boolean') setEmailVerified(user.emailVerified);
    if (typeof user?.phoneVerified === 'boolean') setPhoneVerified(user.phoneVerified);
  }, [user]);

  const canContinue = useMemo(() => emailVerified, [emailVerified]);

  const continueToApp = () => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { email } });
      return;
    }
    navigate(getDashboardPathByRole(user?.role), { replace: true });
  };

  const handleSendEmailOtp = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    setBusyAction('sendEmailOtp');
    try {
      const result = await api.sendEmailVerificationOtp(email);
      toast.success(result.data?.message || 'Verification OTP sent to your email.');
    } catch (error) {
      toast.error(error?.message || 'Could not send email OTP.');
    } finally {
      setBusyAction('');
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || emailOtp.trim().length < 6) {
      toast.error('Enter your email and 6-digit OTP');
      return;
    }
    setBusyAction('verifyEmailOtp');
    try {
      const result = await api.verifyEmailOtp(email, emailOtp);
      setEmailVerified(true);
      if (isAuthenticated) {
        updateUser({ email, emailVerified: true, verificationRequired: false });
      }
      toast.success(result.data?.message || 'Email verified successfully!');
    } catch (error) {
      toast.error(error?.message || 'Email OTP verification failed.');
    } finally {
      setBusyAction('');
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    setBusyAction('sendPhoneOtp');
    try {
      const result = await api.sendPhoneVerificationOtp(phone);
      toast.success(result.data?.message || 'Phone OTP sent successfully.');
    } catch (error) {
      toast.error(error?.message || 'Could not send phone OTP.');
    } finally {
      setBusyAction('');
    }
  };

  const handleVerifyPhoneOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phoneOtp.trim().length < 6) {
      toast.error('Enter your phone number and 6-digit OTP');
      return;
    }
    setBusyAction('verifyPhoneOtp');
    try {
      const result = await api.verifyPhoneOtp(phone, phoneOtp);
      setPhoneVerified(true);
      if (isAuthenticated) {
        updateUser({ phone, phoneVerified: true });
      }
      toast.success(result.data?.message || 'Phone verified successfully!');
    } catch (error) {
      toast.error(error?.message || 'Phone OTP verification failed.');
    } finally {
      setBusyAction('');
    }
  };

  return (
    <motion.div {...pageTransition} className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1600"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-dark-bg/90" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-2xl"
      >
        <motion.div variants={fadeInUp} className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glow">
                <FiHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-white">DaanSetu</span>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-white mb-2">Verify Your Account</h1>
            <p className="text-slate-400 text-sm">
              Verify your email using the 6-digit OTP sent to Gmail. You can also verify your phone with Fast2SMS.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className={`rounded-2xl border px-4 py-4 ${emailVerified ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-3 mb-2 text-white">
                {emailVerified ? <FiCheckCircle className="text-emerald-400" /> : <FiMail className="text-primary-400" />}
                <span className="font-medium">Email verification</span>
              </div>
              <p className="text-sm text-slate-300 break-all">{email || 'No email available'}</p>
              <p className="text-xs text-slate-400 mt-2">
                {emailVerified ? 'Verified successfully' : 'Required before you can use protected pages.'}
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-4 ${phoneVerified ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
              <div className="flex items-center gap-3 mb-2 text-white">
                {phoneVerified ? <FiCheckCircle className="text-emerald-400" /> : <FiPhone className="text-primary-400" />}
                <span className="font-medium">Phone verification</span>
              </div>
              <p className="text-sm text-slate-300 break-all">{phone || 'Optional - add your phone number to verify by SMS'}</p>
              <p className="text-xs text-slate-400 mt-2">Optional, delivered through Fast2SMS.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <form onSubmit={handleVerifyEmailOtp} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-white font-medium">
                <FiShield className="text-primary-400" /> Verify by Gmail OTP
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Email OTP</label>
                <div className="relative">
                  <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="tel"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field pl-11 tracking-[0.35em]"
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    maxLength={6}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendEmailOtp}
                disabled={busyAction === 'sendEmailOtp' || !email.trim()}
                className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {busyAction === 'sendEmailOtp' ? 'Sending...' : 'Send OTP'}
              </button>
              <button
                type="submit"
                disabled={busyAction === 'verifyEmailOtp'}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {busyAction === 'verifyEmailOtp' ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                Verify Email OTP
              </button>
            </form>

            <form onSubmit={handleVerifyPhoneOtp} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-white font-medium">
                <FiPhone className="text-primary-400" /> Verify Phone with Fast2SMS
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="+91XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Phone OTP</label>
                <div className="relative">
                  <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="tel"
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="input-field pl-11 tracking-[0.35em]"
                    placeholder="Enter 6-digit OTP"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    autoComplete="one-time-code"
                    maxLength={6}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={busyAction === 'sendPhoneOtp' || !phone.trim()}
                className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {busyAction === 'sendPhoneOtp' ? 'Sending...' : 'Send Phone OTP'}
              </button>
              <button
                type="submit"
                disabled={busyAction === 'verifyPhoneOtp'}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {busyAction === 'verifyPhoneOtp' ? <FiRefreshCw className="animate-spin" /> : <FiCheckCircle />}
                Verify Phone OTP
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={continueToApp}
              disabled={!canContinue}
              className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticated ? 'Continue to Dashboard' : 'Go to Login'}
            </button>
            <Link to="/login" className="px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-center">
              Back to Login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default VerifyEmailPage;

