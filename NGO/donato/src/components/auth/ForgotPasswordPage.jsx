import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiHeart, FiKey, FiLock, FiMail } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { pageTransition, fadeInUp, staggerContainer } from '../../animations/variants';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const stepMeta = useMemo(() => ([
    { title: 'Request reset code', description: 'Enter your account email to receive a password reset OTP.' },
    { title: 'Verify OTP', description: 'Enter the code sent to your email to unlock password reset.' },
    { title: 'Create new password', description: 'Choose a strong new password and sign back in.' },
  ]), []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const result = await api.forgotPassword(email);
      if (!result.success) {
        toast.error(result.error || 'Unable to send reset OTP. Please try again.');
        return;
      }
      toast.success(result.data?.message || 'Reset OTP sent to your email');
      setStep(2);
    } catch (error) {
      toast.error(error?.message || 'Unable to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the OTP from your email');
      return;
    }

    setLoading(true);
    try {
      const result = await api.verifyForgotPasswordOtp(email, otp);
      if (!result.success) {
        toast.error(result.error || 'OTP verification failed. Please try again.');
        return;
      }
      toast.success(result.data?.message || 'OTP verified successfully');
      setStep(3);
    } catch (error) {
      toast.error(error?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in both password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await api.resetPassword(email, newPassword);
      if (!result.success) {
        toast.error(result.error || 'Unable to reset password. Please try again.');
        return;
      }
      toast.success(result.data?.message || 'Password reset successfully');
      navigate('/login', {
        replace: true,
        state: { email, passwordReset: true },
      });
    } catch (error) {
      toast.error(error?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1600"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-dark-bg/90" />
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md"
      >
        <motion.div variants={fadeInUp} className="glass-card p-8 md:p-10">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-glow">
                <FiHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-white">KindWave</span>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-white mb-2">Forgot Password</h1>
            <p className="text-slate-400 text-sm">{stepMeta[step - 1].description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {stepMeta.map((item, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === step;
              const isCompleted = stepNumber < step;
              return (
                <div
                  key={item.title}
                  className={`rounded-xl border px-3 py-3 text-center transition-all ${
                    isCompleted
                      ? 'border-emerald-500/60 bg-emerald-500/10'
                      : isActive
                        ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                        : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2 text-white">
                    {isCompleted ? <FiCheckCircle className="w-4 h-4 text-emerald-400" /> : <span>{stepNumber}</span>}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-4">{item.title}</p>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <motion.div variants={fadeInUp}>
                <label className="text-sm text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field pl-11"
                  />
                </div>
              </motion.div>

              <motion.button
                variants={fadeInUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send OTP'}
              </motion.button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <motion.div variants={fadeInUp} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Reset code sent to <span className="font-medium text-white">{email}</span>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <label className="text-sm text-slate-400 mb-1.5 block">OTP Code</label>
                <div className="relative">
                  <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="input-field pl-11 tracking-[0.35em]"
                    inputMode="numeric"
                    maxLength={6}
                  />
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(1)}
                  className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify OTP'}
                </motion.button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <motion.div variants={fadeInUp}>
                <label className="text-sm text-slate-400 mb-1.5 block">New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="input-field pl-11"
                  />
                </div>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <label className="text-sm text-slate-400 mb-1.5 block">Confirm New Password</label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="input-field pl-11"
                  />
                </div>
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Back
                </motion.button>
                <motion.button
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Reset Password'}
                </motion.button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPasswordPage;

