// src/components/Common/DataTable.jsx
import React from 'react';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';

const DataTable = ({ columns, data, onEdit, onDelete, canEditRow, canDeleteRow, emptyIcon, emptyTitle }) => {
  if (!data?.length) return <EmptyState icon={emptyIcon} title={emptyTitle} />;
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
      style={{ background:'linear-gradient(160deg, rgba(17, 31, 52, 0.9), rgba(9, 21, 37, 0.88))',
        backdropFilter:'blur(18px)', border:'1px solid rgba(157, 181, 209, 0.18)',
        borderRadius:'16px', overflow:'hidden', boxShadow:'0 16px 32px rgba(2, 8, 20, 0.3)' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {columns.map((c,i) => (
                <th key={i} style={{ padding:'13px 18px', textAlign:'left', fontSize:'10px', fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.08em', color:'#7d93ad',
                  background:'rgba(14, 165, 164, 0.08)', borderBottom:'1px solid rgba(157, 181, 209, 0.2)',
                  whiteSpace:'nowrap' }}>{c.header}</th>
              ))}
              {(onEdit||onDelete) && <th style={{ padding:'13px 18px', textAlign:'center', fontSize:'10px', fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.08em', color:'#7d93ad',
                background:'rgba(14, 165, 164, 0.08)', borderBottom:'1px solid rgba(157, 181, 209, 0.2)', width:'150px' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row,idx) => (
              <motion.tr key={idx} initial={{ opacity:0, x:-15 }} animate={{ opacity:1, x:0 }}
                transition={{ duration:0.3, delay:idx*0.04 }}
                whileHover={{ backgroundColor:'rgba(45, 212, 191, 0.06)' }}
                style={{ borderBottom:'1px solid rgba(157, 181, 209, 0.12)' }}>
                {columns.map((c,ci) => (
                  <td key={ci} style={{ padding:'12px 18px', fontSize:'13px', color:'#dce8f6', whiteSpace:'nowrap' }}>
                    {c.render ? c.render(row) : row[c.accessor]}
                  </td>
                ))}
                {(onEdit||onDelete) && (
                  <td style={{ padding:'12px 18px', textAlign:'center' }}>
                    <div style={{ display:'flex', gap:'6px', justifyContent:'center' }}>
                      {onEdit && (!canEditRow || canEditRow(row)) && <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }} onClick={() => onEdit(row)}
                        style={{ background:'rgba(59, 130, 246, 0.14)', border:'1px solid rgba(96, 165, 250, 0.28)',
                          color:'#93c5fd', padding:'4px 12px', borderRadius:'8px', cursor:'pointer',
                          fontSize:'11px', fontWeight:700 }}>Edit</motion.button>}
                      {onDelete && (!canDeleteRow || canDeleteRow(row)) && <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }} onClick={() => onDelete(row)}
                        style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.2)',
                          color:'#f87171', padding:'4px 12px', borderRadius:'8px', cursor:'pointer',
                          fontSize:'11px', fontWeight:700 }}>Delete</motion.button>}
                      {((!onEdit || (canEditRow && !canEditRow(row))) && (!onDelete || (canDeleteRow && !canDeleteRow(row)))) && (
                        <span style={{ fontSize:'11px', color:'#6e86a0' }}>-</span>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding:'10px 18px', borderTop:'1px solid rgba(157, 181, 209, 0.14)',
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:'11px', color:'#7d93ad' }}>
          <span style={{ color:'#52d7c5', fontWeight:700 }}>{data.length}</span> records
        </span>
      </div>
    </motion.div>
  );
};

export default DataTable;
