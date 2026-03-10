import React from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} maxWidth="420px">
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
        transition={{ type: 'spring', stiffness: 200 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <FiAlertTriangle size={28} color="#ef4444" />
      </motion.div>

      <h2
        style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          marginBottom: 12,
          background: 'none',
          WebkitTextFillColor: 'var(--white)',
          color: 'var(--white)',
        }}
      >
        {title || 'Confirm Action'}
      </h2>
      <p style={{ color: 'var(--gray)', fontSize: '0.9rem', marginBottom: 28 }}>
        {message || 'Are you sure you want to proceed? This action cannot be undone.'}
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <motion.button
          className="btn btn-secondary"
          onClick={onClose}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Cancel
        </motion.button>
        <motion.button
          className="btn btn-danger"
          onClick={() => { onConfirm(); onClose(); }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ background: '#ef4444', color: 'white', border: 'none' }}
        >
          Delete
        </motion.button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;