import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  }),
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

const AnimatedTable = ({ columns, data, actions, title, headerActions }) => {
  return (
    <motion.div
      className="table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <div className="table-header">
        <h3 className="table-title">{title}</h3>
        <div className="table-actions">{headerActions}</div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <motion.th
                key={col.key}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {col.label}
              </motion.th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {data.map((row, index) => (
              <motion.tr
                key={row.id || index}
                custom={index}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                whileHover={{
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  scale: 1.01,
                }}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && <td>{actions(row)}</td>}
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      {data.length === 0 && (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-state-icon">📭</div>
          <h3>No data found</h3>
          <p>Try adding some records to get started.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnimatedTable;