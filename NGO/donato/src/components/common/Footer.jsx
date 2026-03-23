import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole } from '../../utils/roles';

const Footer = () => {
  const { isAuthenticated, user } = useAuth();
  const MotionLink = motion(Link);
  const currentYear = new Date().getFullYear();
  const normalizedRole = normalizeRole(user?.role);
  const isAdminUser = isAuthenticated && normalizedRole === 'admin';
  const shouldShowVisitorVolunteerCta = !isAuthenticated || normalizedRole === 'volunteer';

  if (isAdminUser) {
    return null;
  }

  const roleLoginLinks = [
    { label: 'Become a Volunteer', path: '/login?role=volunteer', variant: 'secondary' },
    { label: 'Explore Campaigns', path: '/campaigns', variant: 'primary' },
  ];

  const footerLinks = {
    Platform: [
      { name: 'Home', path: '/' },
      { name: 'Campaigns', path: '/campaigns' },
      { name: 'About Us', path: '/about' },
      { name: 'Contact', path: '/contact' },
    ],
    'For Donors': [
      { name: 'Browse Campaigns', path: '/campaigns' },
      { name: 'Donation History', path: '/dashboard' },
      { name: 'Tax Receipts', path: '/dashboard' },
      { name: 'Impact Report', path: '/about' },
    ],
    'For NGOs': [
      { name: 'Register NGO', path: '/register' },
      { name: 'Create Campaign', path: '/dashboard' },
      { name: 'Manage Donations', path: '/dashboard' },
      { name: 'Volunteer Management', path: '/dashboard' },
    ],
  };

  const socialLinks = [
    { icon: FaFacebookF, href: 'https://www.facebook.com', label: 'Facebook' },
    { icon: FaTwitter, href: 'https://www.twitter.com', label: 'Twitter' },
    { icon: FaInstagram, href: 'https://www.instagram.com', label: 'Instagram' },
    { icon: FaLinkedinIn, href: 'https://www.linkedin.com', label: 'LinkedIn' },
    { icon: FaYoutube, href: 'https://www.youtube.com', label: 'YouTube' },
  ];

  return (
    <footer className="relative z-10 border-t border-white/5">
      {/* CTA Section */}
      {shouldShowVisitorVolunteerCta && (
        <div className="bg-dark-card/55 border-b border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-heading font-bold text-white mb-4"
            >
              Support Verified Causes with <span className="gradient-text">Confidence</span>
            </motion.h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-8">
              Join a transparent donation network where every contribution is trackable and impactful.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mx-auto">
              {roleLoginLinks.map((link) => (
                <MotionLink
                  key={link.label}
                  to={link.path}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold ${
                    link.variant === 'primary' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {link.label}
                </MotionLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Footer */}
      <div className="bg-dark-bg/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 
                              rounded-xl flex items-center justify-center shadow-glow">
                  <FiHeart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-heading font-bold text-white">KindWave</span>
              </Link>
              <p className="text-slate-400 text-sm mb-6 max-w-sm">
                Empowering transparent and impactful giving. Connect with verified NGOs, 
                track your donations, and see the real difference you make.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <FiMail className="w-4 h-4 text-primary-400" />
                  <span>support@kindwave.org</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <FiPhone className="w-4 h-4 text-primary-400" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <FiMapPin className="w-4 h-4 text-primary-400" />
                  <span>Mumbai, Maharashtra, India</span>
                </div>
              </div>
            </div>

            {/* Links */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-white font-semibold mb-4">{title}</h3>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.path}
                        className="text-sm text-slate-400 hover:text-primary-400 
                                 transition-colors duration-300 hover:translate-x-1 
                                 inline-block"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row 
                        items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {currentYear} KindWave. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 
                           flex items-center justify-center text-slate-400 
                           hover:text-primary-400 hover:border-primary-500/50 
                           transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
