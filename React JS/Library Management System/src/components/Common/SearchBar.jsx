// src/components/Common/SearchBar.jsx
import React from 'react';
import { motion } from 'framer-motion';

const SearchBar = ({ value, onChange, placeholder = 'Search...' }) => (
  <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} style={{ position:'relative' }}>
    <span style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', fontSize:'11px', zIndex:1, fontWeight:800, color:'#8fb2d5' }}>SR</span>
    <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width:'300px', maxWidth:'100%', padding:'11px 16px 11px 40px', background:'rgba(13, 31, 53, 0.8)',
        border:'1px solid rgba(157, 181, 209, 0.26)', borderRadius:'12px', color:'#e8f1fb',
        fontSize:'13px', outline:'none', transition:'all 0.3s' }} />
  </motion.div>
);

export default SearchBar;
