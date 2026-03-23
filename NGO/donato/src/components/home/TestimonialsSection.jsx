import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiStar } from 'react-icons/fi';
import { fadeInUp, staggerContainer } from '../../animations/variants';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'Regular Donor',
    avatar: 'PS',
    rating: 5,
    text: "KindWave has made donating so transparent. I can track exactly where my money goes and see the real impact. It's incredibly fulfilling!",
    color: 'from-primary-500 to-blue-500',
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    role: 'NGO Partner',
    avatar: 'RK',
    rating: 5,
    text: 'As an NGO, KindWave has transformed how we receive and manage donations. The platform is intuitive and the volunteer management is excellent.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 3,
    name: 'Anita Patel',
    role: 'Volunteer',
    avatar: 'AP',
    rating: 5,
    text: 'Volunteering through KindWave is seamless. The task management system keeps everything organized, and seeing the impact is incredibly rewarding.',
    color: 'from-accent-orange to-red-500',
  },
];

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="section-padding relative">
      <div className="page-container">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border 
                         border-purple-500/20 text-purple-400 text-sm font-medium mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
              What People <span className="gradient-text">Say</span>
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-8 md:p-12 text-center"
              >
                {/* Avatar */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${testimonials[current].color} 
                              mx-auto mb-6 flex items-center justify-center text-white text-xl 
                              font-bold shadow-lg`}>
                  {testimonials[current].avatar}
                </div>

                {/* Stars */}
                <div className="flex justify-center gap-1 mb-4">
                  {[...Array(testimonials[current].rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-lg md:text-xl text-slate-300 mb-6 leading-relaxed italic">
                  "{testimonials[current].text}"
                </p>

                {/* Name */}
                <p className="text-white font-semibold">{testimonials[current].name}</p>
                <p className="text-sm text-slate-500">{testimonials[current].role}</p>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-center items-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center 
                         text-white hover:border-primary-500/50 transition-colors"
              >
                <FiChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex gap-2">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrent(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      idx === current
                        ? 'bg-primary-500 w-8'
                        : 'bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrent((prev) => (prev + 1) % testimonials.length)}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center 
                         text-white hover:border-primary-500/50 transition-colors"
              >
                <FiChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;