import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// CRA dev overlay can surface a benign browser warning as a runtime error.
// Filter only the known ResizeObserver loop warnings to avoid interrupting the app.
if (process.env.NODE_ENV === 'development') {
  const isIgnoredResizeObserverError = (message) =>
    typeof message === 'string' &&
    (message.includes('ResizeObserver loop completed with undelivered notifications') ||
      message.includes('ResizeObserver loop limit exceeded'));

  window.addEventListener(
    'error',
    (event) => {
      if (isIgnoredResizeObserverError(event?.message)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reasonMessage =
        event?.reason?.message || (typeof event?.reason === 'string' ? event.reason : '');
      if (isIgnoredResizeObserverError(reasonMessage)) {
        event.preventDefault();
        event.stopImmediatePropagation?.();
      }
    },
    true
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
