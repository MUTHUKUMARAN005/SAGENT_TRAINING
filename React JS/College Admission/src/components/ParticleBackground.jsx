import React, { useMemo } from 'react';

const ParticleBackground = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      left: Math.random() * 100,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      color: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'][
        Math.floor(Math.random() * 5)
      ],
    }));
  }, []);

  return (
    <div className="particles-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBackground;