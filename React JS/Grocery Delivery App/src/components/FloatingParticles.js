import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const FloatingParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      size: Math.random() * 300 + 100,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
      color: [
        'rgba(99, 102, 241, 0.03)',
        'rgba(236, 72, 153, 0.03)',
        'rgba(16, 185, 129, 0.03)',
        'rgba(245, 158, 11, 0.02)',
        'rgba(59, 130, 246, 0.03)',
        'rgba(139, 92, 246, 0.03)',
      ][i],
    }));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 280,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.color,
            left: `${p.x}%`,
            top: `${p.y}%`,
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 50, -30, 50, 0],
            y: [0, -40, 30, -20, 0],
            scale: [1, 1.2, 0.8, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;