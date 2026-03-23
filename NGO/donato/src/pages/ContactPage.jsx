import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { pageTransition, fadeInUp, staggerContainer, fadeInLeft, fadeInRight } from '../animations/variants';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setLoading(false);
  };

  const contactInfo = [
    { icon: FiMail, title: 'Email', value: 'support@kindwave.org', href: 'mailto:support@kindwave.org' },
    { icon: FiPhone, title: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
    { icon: FiMapPin, title: 'Address', value: 'Chennai, TamilNadu, India', href: '#' },
  ];

  return (
    <motion.div {...pageTransition} className="pt-24">
      <section className="section-padding">
        <div className="page-container">
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 border 
                         border-primary-500/20 text-primary-400 text-sm font-medium mb-4">
              Contact Us
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">
              Get In <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Have questions or need help? We'd love to hear from you.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Contact Info */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {contactInfo.map((info, idx) => (
                <motion.a
                  key={idx}
                  href={info.href}
                  variants={fadeInLeft}
                  whileHover={{ x: 5 }}
                  className="glass-card-hover p-5 flex items-center gap-4 block"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center 
                                justify-center shrink-0">
                    <info.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{info.title}</p>
                    <p className="text-white font-medium">{info.value}</p>
                  </div>
                </motion.a>
              ))}

              {/* FAQ */}
              <motion.div variants={fadeInLeft} className="glass-card p-6 mt-8">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FiMessageSquare className="w-5 h-5 text-primary-400" />
                  Quick Help
                </h3>
                <div className="space-y-3">
                  {[
                    'How to make a donation?',
                    'Are donations tax-deductible?',
                    'How do I register as an NGO?',
                    'How to volunteer?',
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      className="w-full text-left text-sm text-slate-400 hover:text-primary-400 
                               transition-colors py-2 border-b border-white/5 last:border-0"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              variants={fadeInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Your Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-1.5 block">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="input-field"
                    placeholder="How can we help?"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1.5 block">Message</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="input-field resize-none"
                    placeholder="Tell us more..."
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary py-3.5 px-8 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full 
                                  animate-spin" />
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default ContactPage;