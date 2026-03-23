import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiHeart, FiHome } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { signInWithGoogle } from '../../utils/googleAuth';
import { getDashboardPathByRole } from '../../utils/roles';
import { pageTransition, fadeInUp, staggerContainer } from '../../animations/variants';
import AddressPicker from '../map/AddressPicker';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', address: '', city: '', role: 'donor',
    latitude: null, longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roles = [
    { value: 'donor', label: 'Donor', emoji: '❤️', desc: 'Donate to causes' },
    { value: 'volunteer', label: 'Volunteer', emoji: '🤝', desc: 'Help on ground' },
    { value: 'ngo', label: 'NGO', emoji: '🏢', desc: 'Manage campaigns' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const result = await api.register(formData);
      if (result.success) {
        login(result.data);
        toast.success('Welcome to KindWave! Enter the 6-digit OTP sent to your email.');
        navigate('/verify-email', {
          replace: true,
          state: {
            email: result.data?.email || formData.email,
            phone: result.data?.phone || formData.phone,
          },
        });
      }
    } catch (err) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => setFormData({ ...formData, [field]: value });

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const googleProfile = await signInWithGoogle();
      const result = await api.loginWithGoogle(googleProfile);
      if (result.success) {
        login(result.data);
        toast.success('Welcome with Google! 🎉');
        const requestedPath = location.state?.from?.pathname;
        navigate(requestedPath || getDashboardPathByRole(result.data?.role), { replace: true });
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
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1600"
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
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl
                            flex items-center justify-center shadow-glow">
                <FiHeart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-heading font-bold text-white">KindWave</span>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400 text-sm">Join the community of givers</p>
          </div>

          {/* Role Selection */}
          <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => updateField('role', role.value)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  formData.role === role.value
                    ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-xl block mb-1">{role.emoji}</span>
                <span className="text-xs text-slate-300 block">{role.label}</span>
              </button>
            ))}
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <motion.div variants={fadeInUp} className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Full Name"
                className="input-field pl-11"
                required
              />
            </motion.div>

            {/* Email */}
            <motion.div variants={fadeInUp} className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="Email Address"
                className="input-field pl-11"
                required
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeInUp} className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Password (min 6 characters)"
                className="input-field pl-11"
                required
              />
            </motion.div>

            {/* Phone (optional) */}
            <motion.div variants={fadeInUp} className="relative">
              <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Phone Number (optional)"
                className="input-field pl-11"
              />
            </motion.div>

            {/* Address — Map Picker */}
            <motion.div variants={fadeInUp}>
              <label className="text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FiMapPin className="w-3.5 h-3.5" /> Location (optional — select on map)
              </label>
              <AddressPicker
                value={{
                  lat: formData.latitude,
                  lng: formData.longitude,
                  address: formData.address,
                }}
                onChange={({ lat, lng, address }) => {
                  const cityGuess = address.split(',').slice(-3, -2)[0]?.trim() || '';
                  setFormData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                    address,
                    city: cityGuess || prev.city,
                  }));
                }}
              />
            </motion.div>

            {/* City */}
            <motion.div variants={fadeInUp} className="relative">
              <FiHome className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="City"
                className="input-field pl-11"
              />
            </motion.div>

            <motion.div variants={fadeInUp}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || googleLoading}
                className="w-full btn-primary py-3.5 flex items-center justify-center"
              >
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : 'Create Account'}
              </motion.button>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-500">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </motion.div>

            <motion.button
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignUp}
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

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RegisterPage;
