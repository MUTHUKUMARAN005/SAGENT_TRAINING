// src/components/common/SkipNavigation.jsx
import React from 'react';

const SkipNavigation = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] 
               focus:px-6 focus:py-3 focus:bg-primary-600 focus:text-white focus:rounded-xl 
               focus:shadow-glow-lg focus:outline-none font-medium text-sm"
    >
      Skip to main content
    </a>
  );
};

export default SkipNavigation;