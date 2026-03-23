import React, { useCallback, useMemo } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  const options = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 30, density: { enable: true, area: 800 } },
      color: { value: '#3b82f6' },
      opacity: { value: 0.15, random: { enable: true, minimumValue: 0.05 } },
      size: { value: 3, random: { enable: true, minimumValue: 1 } },
      move: {
        enable: true,
        speed: 0.5,
        direction: 'none',
        random: true,
        straight: false,
        outModes: 'out',
      },
      links: {
        enable: true,
        distance: 150,
        color: '#3b82f6',
        opacity: 0.08,
        width: 1,
      },
    },
    interactivity: {
      events: {
        onHover: { enable: true, mode: 'grab' },
      },
      modes: {
        grab: { distance: 140, links: { opacity: 0.2 } },
      },
    },
    detectRetina: true,
  }), []);

  return (
    <Particles
      id="particles"
      init={particlesInit}
      options={options}
      className="absolute inset-0 pointer-events-none"
    />
  );
};

export default React.memo(ParticleBackground);