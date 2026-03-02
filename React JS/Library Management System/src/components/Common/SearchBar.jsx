// src/components/Common/SearchBar.jsx
import React from 'react';
import { motion } from 'framer-motion';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} style={{ position:'relative' }}>
    <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'15px', zIndex:1 }}>🔍</span>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'300px', padding:'11px 16px 11px 40px', background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'#f1f5f9',
        fontSize:'13px', outline:'none', transition:'all 0.3s' }} />
  </motion.div>
);

export default SearchBar;