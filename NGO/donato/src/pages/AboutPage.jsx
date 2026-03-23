import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiEye, FiHeart, FiUsers, FiTarget, FiAward } from 'react-icons/fi';
import { pageTransition, fadeInUp, staggerContainer } from '../animations/variants';
import StatsCounter from '../components/home/StatsCounter';

const AboutPage = () => {
  const values = [
    { icon: FiShield, title: 'Transparency', description: 'Every donation is tracked and verified. See exactly where your money goes.' },
    { icon: FiEye, title: 'Accountability', description: 'NGOs are verified and held accountable for fund utilization.' },
    { icon: FiHeart, title: 'Compassion', description: 'Built by people who care about making real social impact.' },
    { icon: FiUsers, title: 'Community', description: 'Bringing together donors, NGOs, and volunteers for collective good.' },
    { icon: FiTarget, title: 'Impact', description: 'Focused on measurable outcomes that transform communities.' },
    { icon: FiAward, title: 'Trust', description: 'Fraud detection and verification ensure your donations are safe.' },
  ];

  const team = [
    { name: 'Arjun Mehta', role: 'Founder & CEO', avatar: 'AM', color: 'from-primary-500 to-blue-500' },
    { name: 'Sneha Reddy', role: 'CTO', avatar: 'SR', color: 'from-green-500 to-emerald-500' },
    { name: 'Vikram Singh', role: 'Head of Operations', avatar: 'VS', color: 'from-accent-orange to-red-500' },
    { name: 'Priya Joshi', role: 'Community Lead', avatar: 'PJ', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <motion.div {...pageTransition} className="pt-24">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1600"
            alt=""
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-dark-bg/90 to-dark-bg" />
        </div>
        <div className="page-container relative z-10 px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border 
                     border-primary-500/20 text-primary-400 text-sm font-medium mb-6"
          >
            About KindWave
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-heading font-bold text-white mb-6"
          >
            Bridging the Gap Between <br />
            <span className="gradient-text">Givers & Receivers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-3xl mx-auto text-lg leading-relaxed"
          >
            KindWave (Bridge of Giving) is a transparent digital platform that connects 
            compassionate donors with verified NGOs and meaningful causes across India. 
            We believe every act of giving should be trusted, tracked, and impactful.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <StatsCounter />

      {/* Values */}
      <section className="section-padding">
        <div className="page-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                Our <span className="gradient-text">Values</span>
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {values.map((value, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -5 }}
                  className="glass-card-hover p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center 
                                justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-slate-400 text-sm">{value.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding pt-0">
        <div className="page-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
                Meet Our <span className="gradient-text">Team</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {team.map((member, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="glass-card-hover p-6 text-center"
                >
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br 
                                ${member.color} flex items-center justify-center text-white 
                                text-2xl font-bold shadow-lg`}>
                    {member.avatar}
                  </div>
                  <h3 className="text-white font-semibold">{member.name}</h3>
                  <p className="text-sm text-slate-400">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default AboutPage;