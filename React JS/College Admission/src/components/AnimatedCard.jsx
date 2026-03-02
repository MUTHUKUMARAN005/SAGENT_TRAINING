import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const AnimatedCard = ({
  children,
  className = '',
  gradient = 'gradient-1',
  delay = 0,
  hover3D = true,
  glowOnHover = true,
  onClick,
  style = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // 3D tilt effect values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);

  const handleMouseMove = (e) => {
    if (!hover3D) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  // Gradient glow colors mapping
  const glowColors = {
    'gradient-1': 'rgba(99, 102, 241, 0.4)',
    'gradient-2': 'rgba(236, 72, 153, 0.4)',
    'gradient-3': 'rgba(6, 182, 212, 0.4)',
    'gradient-4': 'rgba(16, 185, 129, 0.4)',
    'gradient-5': 'rgba(245, 158, 11, 0.4)',
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      scale: 0.9,
      rotateX: 10,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 20,
        duration: 0.6,
      },
    },
    hover: {
      y: -8,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      },
    },
    tap: {
      scale: 0.97,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className={`animated-card ${gradient} ${className}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap={onClick ? 'tap' : undefined}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        perspective: 1000,
        transformStyle: 'preserve-3d',
        rotateX: hover3D ? rotateX : 0,
        rotateY: hover3D ? rotateY : 0,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isHovered && glowOnHover
          ? `0 20px 40px -15px ${glowColors[gradient] || glowColors['gradient-1']}, 
             0 0 30px ${glowColors[gradient] || glowColors['gradient-1']}`
          : 'var(--shadow)',
        transition: 'box-shadow 0.3s ease',
      }}
    >
      {/* Top gradient bar */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: 'var(--radius) var(--radius) 0 0',
          opacity: isHovered ? 1 : 0.7,
        }}
        className={`card-gradient-bar ${gradient}`}
        animate={{
          scaleX: isHovered ? 1 : 0.6,
          opacity: isHovered ? 1 : 0.7,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Hover shine effect */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 55%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
        animate={{
          x: isHovered ? ['calc(-100%)', 'calc(200%)'] : 'calc(-100%)',
        }}
        transition={{
          duration: 0.8,
          ease: 'easeInOut',
        }}
      />

      {/* Corner glow effect */}
      {isHovered && (
        <motion.div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: glowColors[gradient] || glowColors['gradient-1'],
            filter: 'blur(40px)',
            opacity: 0.3,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Card content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </motion.div>
  );
};

// ============================================
// Sub-components for flexible card building
// ============================================

// Card with icon, title, value, and trend
export const MetricCard = ({
  icon,
  title,
  value,
  trend,
  trendValue,
  gradient = 'gradient-1',
  delay = 0,
  onClick,
}) => {
  return (
    <AnimatedCard
      gradient={gradient}
      delay={delay}
      onClick={onClick}
      style={{ padding: 24 }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}>
        <motion.div
          className={`stat-card-icon`}
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            color: 'white',
          }}
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.div>
        <span style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          fontWeight: 500,
        }}>
          {title}
        </span>
      </div>

      <motion.div
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: 8,
          background: 'var(--gradient-1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
      >
        {value}
      </motion.div>

      {trendValue && (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.8rem',
            color: trend === 'up' ? 'var(--success)' : 'var(--danger)',
          }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.5 }}
        >
          <span>{trend === 'up' ? '↑' : '↓'}</span>
          {trendValue}% from last month
        </motion.div>
      )}
    </AnimatedCard>
  );
};

// Info card with header and body
export const InfoCard = ({
  title,
  subtitle,
  headerRight,
  gradient = 'gradient-1',
  delay = 0,
  children,
  style = {},
}) => {
  return (
    <AnimatedCard
      gradient={gradient}
      delay={delay}
      hover3D={false}
      style={style}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            marginBottom: 2,
          }}>
            {title}
          </h3>
          {subtitle && (
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {headerRight}
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </AnimatedCard>
  );
};

// Profile card
export const ProfileCard = ({
  name,
  email,
  avatar,
  role,
  gradient = 'gradient-1',
  delay = 0,
  onClick,
  actions,
}) => {
  return (
    <AnimatedCard
      gradient={gradient}
      delay={delay}
      onClick={onClick}
      style={{ padding: 24, textAlign: 'center' }}
    >
      <motion.div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'white',
          margin: '0 auto 16px',
        }}
        className={gradient}
        whileHover={{ scale: 1.1, rotate: 10 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {avatar || name?.charAt(0) || '?'}
      </motion.div>

      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        marginBottom: 4,
        color: 'var(--text-primary)',
      }}>
        {name}
      </h3>

      <p style={{
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        marginBottom: 4,
      }}>
        {email}
      </p>

      {role && (
        <motion.span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 20,
            background: 'rgba(99, 102, 241, 0.15)',
            color: 'var(--primary-light)',
            fontSize: '0.75rem',
            fontWeight: 600,
            marginBottom: 16,
          }}
          whileHover={{ scale: 1.05 }}
        >
          {role}
        </motion.span>
      )}

      {actions && (
        <div style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          marginTop: 12,
        }}>
          {actions}
        </div>
      )}
    </AnimatedCard>
  );
};

// List item card
export const ListCard = ({
  items = [],
  gradient = 'gradient-1',
  delay = 0,
  title,
  emptyMessage = 'No items found',
}) => {
  return (
    <AnimatedCard
      gradient={gradient}
      delay={delay}
      hover3D={false}
    >
      {title && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          fontWeight: 700,
          fontSize: '1rem',
        }}>
          {title}
        </div>
      )}
      <div>
        {items.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}>
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ fontSize: '2rem', marginBottom: 8 }}
            >
              📭
            </motion.div>
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={index}
              style={{
                padding: '14px 20px',
                borderBottom: index < items.length - 1 ? '1px solid rgba(51, 65, 85, 0.3)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s',
                cursor: item.onClick ? 'pointer' : 'default',
              }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + index * 0.05 }}
              whileHover={{
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                x: 4,
              }}
              onClick={item.onClick}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {item.icon && (
                  <motion.span
                    style={{ fontSize: '1.2rem' }}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                  >
                    {item.icon}
                  </motion.span>
                )}
                <div>
                  <div style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                  }}>
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}>
                      {item.subtitle}
                    </div>
                  )}
                </div>
              </div>
              {item.right && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {item.right}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </AnimatedCard>
  );
};

export default AnimatedCard;