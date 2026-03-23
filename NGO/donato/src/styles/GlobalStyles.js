// src/styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Smooth scrollbar for Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: #1d4ed8 #0f172a;
  }

  /* Custom cursor for interactive elements */
  a, button, [role="button"] {
    cursor: pointer;
  }

  /* Focus visible styles for accessibility */
  :focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* Disable outline for mouse users */
  :focus:not(:focus-visible) {
    outline: none;
  }

  /* Image rendering optimization */
  img {
    image-rendering: -webkit-optimize-contrast;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Prevent FOUC */
  .no-fouc {
    visibility: hidden;
  }

  .no-fouc.loaded {
    visibility: visible;
  }

  /* Page transition overlay */
  .page-transition-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
    pointer-events: none;
  }

  /* Gradient border animation */
  @property --gradient-angle {
    syntax: "<angle>";
    initial-value: 0deg;
    inherits: false;
  }

  .gradient-border {
    --gradient-angle: 0deg;
    border-image: conic-gradient(
      from var(--gradient-angle),
      #3b82f6,
      #14b8a6,
      #8b5cf6,
      #3b82f6
    ) 1;
    animation: rotateGradient 4s linear infinite;
  }

  @keyframes rotateGradient {
    to { --gradient-angle: 360deg; }
  }

  /* Text selection */
  ::selection {
    background: rgba(59, 130, 246, 0.3);
    color: #ffffff;
  }

  /* Smooth anchor scrolling */
  html {
    scroll-padding-top: 80px;
  }

  /* Print styles */
  @media print {
    nav, footer, .chatbot, .scroll-to-top {
      display: none !important;
    }
    body {
      background: white !important;
      color: black !important;
    }
  }
`;

export default GlobalStyles;