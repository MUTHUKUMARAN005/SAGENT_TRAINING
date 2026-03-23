import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiHeart } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { signInWithGoogle } from '../../utils/googleAuth';
import { getDashboardPathByRole, normalizeRole } from '../../utils/roles';
import { pageTransition, fadeInUp, staggerContainer } from '../../animations/variants';

const ROLE_LABELS = {
  admin: 'Admin',
  ngo: 'NGO',
  donor: 'Donor',
  volunteer: 'Volunteer',
};

const ROLE_DEMO_CREDENTIALS = {
  admin: { email: 'admin@daansetu.org', password: 'password123' },
  donor: { email: 'priya@donor.com', password: 'password123' },
  ngo: { email: 'sneha@ngo.com', password: 'password123' },
  volunteer: { email: 'anita@volunteer.com', password: 'password123' },
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const roleQueryValue = new URLSearchParams(location.search).get('role');
  const normalizedRoleQuery = String(roleQueryValue || '').toLowerCase().trim();
  const requestedRole = Object.prototype.hasOwnProperty.call(ROLE_LABELS, normalizedRoleQuery)
    ? normalizedRoleQuery
    : null;
  const requestedRoleLabel = requestedRole ? ROLE_LABELS[requestedRole] || 'User' : null;
  const requestedDemoCredentials = requestedRole ? ROLE_DEMO_CREDENTIALS[requestedRole] : null;

  const getPostLoginPath = (userData) => {
    const defaultDashboard = getDashboardPathByRole(userData?.role);
    const requestedPath = location.state?.from?.pathname;
    const normalizedRole = normalizeRole(userData?.role);

    if (normalizedRole === 'admin') {
      if (requestedPath?.startsWith('/dashboard/admin')) {
        return requestedPath;
      }
      return defaultDashboard;
    }

    return requestedPath || defaultDashboard;
  };

  const validateRoleSelection = (userData) => {
    if (!requestedRole) return true;
    const loggedInRole = normalizeRole(userData?.role);
    if (loggedInRole === requestedRole) return true;

    const accountRoleLabel = ROLE_LABELS[loggedInRole] || 'User';
    toast.error(
      `This account is ${accountRoleLabel}. Please use ${requestedRoleLabel} credentials for this login portal.`
    );
    return false;
  };

  const fillRoleDemoCredentials = () => {
    if (!requestedDemoCredentials) return;
    setEmail(requestedDemoCredentials.email);
    setPassword(requestedDemoCredentials.password);
    toast.success(`${requestedRoleLabel} demo credentials filled`);
  };

  React.useEffect(() => {
    if (location.state?.email) {
      setEmail(String(location.state.email));
    }

    if (location.state?.passwordReset) {
      toast.success('Password updated successfully. Please sign in with your new password.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const result = await api.login(email, password);
      if (result.success) {
        if (!validateRoleSelection(result.data)) {
          return;
        }
        login(result.data);
        if (result.data?.emailVerified === false) {
          toast('Please verify your email using the link or OTP sent to Gmail.', { icon: '📧' });
          navigate('/verify-email', {
            replace: true,
            state: {
              from: location.state?.from,
              email: result.data?.email,
              phone: result.data?.phone,
            },
          });
          return;
        }

        toast.success('Welcome back! 👋');
        navigate(getPostLoginPath(result.data), { replace: true });
      }
    } catch (err) {
      const message = err?.message || 'Login failed';
      if (message.toLowerCase().includes('invalid email or password')) {
        toast.error('Invalid email or password. Check your dataset user credentials.');
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const googleProfile = await signInWithGoogle();
      const result = await api.loginWithGoogle(googleProfile);
      if (result.success) {
        if (!validateRoleSelection(result.data)) {
          return;
        }
        login(result.data);
        toast.success('Signed in with Google');
        navigate(getPostLoginPath(result.data), { replace: true });
      } else {
        toast.error('Google sign-in failed');
      }
    } catch (error) {
      toast.error(error?.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen flex items-center justify-center px-4 py-20"
    >
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1600"
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
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl 
                            flex items-center justify-center shadow-glow">
                <FiHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-white">KindWave</span>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-white mb-2">
              {requestedRoleLabel ? `${requestedRoleLabel} Login` : 'Welcome Back'}
            </h1>
            <p className="text-slate-400 text-sm">
              {requestedRoleLabel
                ? `Sign in with your ${requestedRoleLabel.toLowerCase()} account`
                : 'Sign in to continue making a difference'}
            </p>
            {requestedDemoCredentials && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-left">
                <p className="text-[11px] text-slate-400">Demo credentials</p>
                <p className="text-xs text-slate-300 mt-1">{requestedDemoCredentials.email}</p>
                <button
                  type="button"
                  onClick={fillRoleDemoCredentials}
                  className="mt-2 text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Use demo credentials
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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

            {/* Password */}
            <motion.div variants={fadeInUp}>
              <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 
                           hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Remember & Forgot */}
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 
                                                text-primary-500 focus:ring-primary-500" />
                <span className="text-sm text-slate-400">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit */}
            <motion.div variants={fadeInUp}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full 
                                animate-spin" />
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </motion.div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Social Login */}
            <motion.button
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 
                       rounded-xl hover:bg-white/5 transition-colors disabled:opacity-60 
                       disabled:cursor-not-allowed"
            >
              <FcGoogle className="w-5 h-5" />
              <span className="text-sm text-slate-300">
                {googleLoading ? 'Connecting Google...' : 'Google'}
              </span>
            </motion.button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 
                                          font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default LoginPage;
