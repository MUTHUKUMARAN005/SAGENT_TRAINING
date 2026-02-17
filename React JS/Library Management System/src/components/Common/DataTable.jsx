// src/components/Common/DataTable.jsx
import React from 'react';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';

const DataTable = ({ columns, data, onEdit, onDelete, emptyIcon, emptyTitle }) => {
  if (!data?.length) return <EmptyState icon={emptyIcon} title={emptyTitle} />;
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
      style={{ background:'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(30,41,59,0.4))',
        backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:'16px', overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {columns.map((c,i) => (
                <th key={i} style={{ padding:'13px 18px', textAlign:'left', fontSize:'10px', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.08em', color:'#64748b',
                  background:'rgba(99,102,241,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)',
                  whiteSpace:'nowrap' }}>{c.header}</th>
              ))}
              {(onEdit||onDelete) && <th style={{ padding:'13px 18px', textAlign:'center', fontSize:'10px', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.08em', color:'#64748b',
                background:'rgba(99,102,241,0.03)', borderBottom:'1px solid rgba(255,255,255,0.06)', width:'150px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row,idx) => (
              <motion.tr key={idx} initial={{ opacity:0, x:-15 }} animate={{ opacity:1, x:0 }}
                transition={{ duration:0.3, delay:idx*0.04 }}
                whileHover={{ backgroundColor:'rgba(99,102,241,0.03)' }}
                style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                {columns.map((c,ci) => (
                  <td key={ci} style={{ padding:'12px 18px', fontSize:'13px', color:'#e2e8f0', whiteSpace:'nowrap' }}>
                    {c.render ? c.render(row) : row[c.accessor]}
                  </td>
                ))}
                {(onEdit||onDelete) && (
                  <td style={{ padding:'12px 18px', textAlign:'center' }}>
                    <div style={{ display:'flex', gap:'6px', justifyContent:'center' }}>
                      {onEdit && <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }} onClick={() => onEdit(row)}
                        style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.2)',
                          color:'#818cf8', padding:'4px 12px', borderRadius:'8px', cursor:'pointer',
                          fontSize:'11px', fontWeight:600 }}>✏️ Edit</motion.button>}
                      {onDelete && <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }} onClick={() => onDelete(row)}
                        style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)',
                          color:'#f87171', padding:'4px 12px', borderRadius:'8px', cursor:'pointer',
                          fontSize:'11px', fontWeight:600 }}>🗑️</motion.button>}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(255,255,255,0.04)',
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'11px', color:'#64748b' }}>
          <span style={{ color:'#6366f1', fontWeight:600 }}>{data.length}</span> records
        </span>
      </div>
    </motion.div>
  );
};

export default DataTable;