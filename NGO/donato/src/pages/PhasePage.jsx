import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiEdit2 } from 'react-icons/fi';
import { pageTransition, fadeInUp, staggerContainer } from '../animations/variants';
import { getPhaseInfo, PHASE_CONFIG } from '../utils/phaseConfig';

const PhasePage = () => {
  const phaseInfo = getPhaseInfo();
  const [expandedSection, setExpandedSection] = useState(null);
  
  const currentLoginButtons = [
    'Donor Login',
    'Volunteer Login',
    ...(PHASE_CONFIG.hideVisitorLogin ? [] : ['Continue as Visitor']),
    ...(PHASE_CONFIG.hideAdminNGOLogin ? [] : ['Admin Login', 'NGO Login']),
  ];

  const FeatureStatus = ({ enabled, label }) => (
    <motion.div
      variants={fadeInUp}
      className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
    >
      <span className="text-slate-300">{label}</span>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm ${
        enabled
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-red-500/20 text-red-400 border border-red-500/30'
      }`}>
        {enabled ? (
          <>
            <FiCheck className="w-4 h-4" /> Enabled
          </>
        ) : (
          <>
            <FiX className="w-4 h-4" /> Disabled
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      {...pageTransition}
      className="min-h-screen pt-24 pb-16"
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-glow-gradient opacity-20" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Application Phase
            </h1>
            <p className="text-slate-400 text-lg">
              Current deployment phase and feature configuration
            </p>
          </motion.div>

          {/* Phase Overview */}
          <motion.div
            variants={fadeInUp}
            className="dashboard-card relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full -mr-20 -mt-20" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-heading font-bold text-white mb-2">
                    {phaseInfo.name}
                  </h2>
                  <p className="text-slate-400 text-lg">
                    {phaseInfo.description}
                  </p>
                </div>
                <span className="px-4 py-2 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400 font-semibold">
                  📅 {phaseInfo.date}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Visible Login Buttons */}
          <motion.div variants={fadeInUp} className="dashboard-card">
            <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
              🔐 Visible Login Options
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {currentLoginButtons.map((button) => (
                <motion.div
                  key={button}
                  variants={fadeInUp}
                  className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
                >
                  <FiCheck className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-green-300 font-medium">{button}</span>
                </motion.div>
              ))}
            </div>
            {currentLoginButtons.length === 0 && (
              <div className="p-6 text-center rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 font-semibold">⚠️ No login options visible!</p>
                <p className="text-yellow-400 text-sm mt-1">At least one login option should be enabled.</p>
              </div>
            )}
          </motion.div>

          {/* Feature Status Grid */}
          <motion.div variants={fadeInUp} className="dashboard-card">
            <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
              ✨ Feature Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(phaseInfo.features).map(([key, enabled]) => (
                <FeatureStatus
                  key={key}
                  enabled={enabled}
                  label={key.replace(/([A-Z])/g, ' $1').trim()}
                />
              ))}
            </div>
          </motion.div>

          {/* Configuration Details */}
          <motion.div variants={fadeInUp} className="dashboard-card">
            <button
              onClick={() => setExpandedSection(expandedSection === 'config' ? null : 'config')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white flex items-center gap-3">
                ⚙️ Configuration Settings
              </h3>
              <motion.div
                animate={{ rotate: expandedSection === 'config' ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <FiEdit2 className="w-5 h-5 text-slate-400" />
              </motion.div>
            </button>

            {expandedSection === 'config' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-4"
              >
                {Object.entries(phaseInfo.settings).map(([key, value]) => (
                  <div key={key} className="p-4 rounded-xl bg-white/3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-mono text-sm">
                        {key}
                      </span>
                      <span className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                        value === true || value === 1
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}>
                        {String(value)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm text-blue-300">
                  <p className="font-semibold mb-2">📝 Note:</p>
                  <p>To modify these settings, edit the <code className="bg-blue-900/50 px-2 py-1 rounded">phaseConfig.js</code> file in the utils folder.</p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Phase Guidelines */}
          <motion.div variants={fadeInUp} className="dashboard-card">
            <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
              📋 Phase Guidelines
            </h3>
            <div className="space-y-4">
              <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                <p className="text-blue-300 font-semibold flex items-center gap-2">
                  🎯 Current Phase: Donor & Volunteer Launch
                </p>
                <p className="text-blue-200 text-sm">
                  In this phase, only Donor and Volunteer login options are visible. Admin and NGO features are not yet publicly available.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                <p className="text-purple-300 font-semibold flex items-center gap-2">
                  🔐 Visitor Access: DISABLED
                </p>
                <p className="text-purple-200 text-sm">
                  Website visitors cannot access campaigns without logging in. All users must authenticate as Donor or Volunteer.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                <p className="text-orange-300 font-semibold flex items-center gap-2">
                  🚀 Next Steps
                </p>
                <ul className="text-orange-200 text-sm space-y-1 ml-4">
                  <li>• When ready: Enable Admin/NGO logins for internal team</li>
                  <li>• Enable visitor access for public browsing</li>
                  <li>• Monitor user registration and engagement metrics</li>
                  <li>• Plan gradual rollout of additional features</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* How to Change Phase */}
          <motion.div variants={fadeInUp} className="dashboard-card">
            <h3 className="text-2xl font-heading font-bold text-white mb-6 flex items-center gap-3">
              🔄 How to Change Phase Settings
            </h3>
            <div className="bg-slate-900/50 rounded-xl p-6 space-y-4 font-mono text-sm">
              <div>
                <p className="text-slate-400 mb-2">1. Edit the phase configuration file:</p>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 text-slate-300 overflow-x-auto">
                  <p>src/utils/phaseConfig.js</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 mb-2">2. Modify the PHASE_CONFIG object:</p>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 text-slate-300 overflow-x-auto">
                  <pre>{`export const PHASE_CONFIG = {
  hideAdminNGOLogin: true,      // Change to false to show Admin & NGO
  hideVisitorLogin: true,       // Change to false to show Visitor access
  enableBetaFeatures: false,
  enableVolunteerDashboard: true,
  enableDonorDashboard: true,
};`}</pre>
                </div>
              </div>

              <div>
                <p className="text-slate-400 mb-2">3. Save and refresh the browser</p>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 text-slate-300">
                  Changes take effect immediately upon save
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp} className="dashboard-card">
            <h3 className="text-lg font-semibold text-white mb-4">⚡ Quick Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl bg-white/3 border border-white/5 text-center"
              >
                <p className="text-2xl mb-2">💳</p>
                <p className="text-white font-semibold">Donor Login</p>
                <p className="text-sm text-green-400 mt-1">✓ Enabled</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl bg-white/3 border border-white/5 text-center"
              >
                <p className="text-2xl mb-2">🤝</p>
                <p className="text-white font-semibold">Volunteer Login</p>
                <p className="text-sm text-green-400 mt-1">✓ Enabled</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="p-4 rounded-xl bg-white/3 border border-white/5 text-center"
              >
                <p className="text-2xl mb-2">👁️</p>
                <p className="text-white font-semibold">Visitor Access</p>
                <p className="text-sm text-red-400 mt-1">✗ Disabled</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PhasePage;


