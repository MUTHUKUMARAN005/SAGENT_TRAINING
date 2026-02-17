// src/components/Pages/CrudPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import DataTable from '../Common/DataTable';
import Modal from '../Common/Modal';
import PageTransition from '../Common/PageTransition';
import LoadingSpinner from '../Common/LoadingSpinner';
import ConfirmDialog from '../Common/ConfirmDialog';
import SearchBar from '../Common/SearchBar';
import toast, { Toaster } from 'react-hot-toast';

const inputStyle = {
  width:'100%', padding:'11px 16px', background:'rgba(255,255,255,0.04)',
  border:'1px solid rgba(255,255,255,0.12)', borderRadius:'10px', color:'#f1f5f9',
  fontSize:'13px', outline:'none', transition:'all 0.3s'
};
const labelStyle = {
  fontSize:'10px', fontWeight:700, color:'#94a3b8', marginBottom:'5px',
  display:'block', textTransform:'uppercase', letterSpacing:'0.06em'
};

const toastStyle = {
  style: { background:'#1e293b', color:'#f1f5f9', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'13px' }
};

const CrudPage = ({ config }) => {
  const {
    entityName, icon, gradient, color,
    idField, fetchFn, createFn, updateFn, deleteFn,
    emptyForm, columns, formFields, fallbackData,
    searchFields = [],
    // RBAC permissions
    canCreate, canEdit, canDelete
  } = config;

  const { checkPermission } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Check RBAC permissions
  const allowCreate = canCreate ? checkPermission(canCreate) : true;
  const allowEdit = canEdit ? checkPermission(canEdit) : true;
  const allowDelete = canDelete ? checkPermission(canDelete) : true;

  const fetchData = useCallback(async () => {
    try { const res = await fetchFn(); setData(res.data); }
    catch { setData(fallbackData || []); }
    setLoading(false);
  }, [fetchFn, fallbackData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); setEditing(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateFn(form[idField], form);
        toast.success(`${entityName} updated! ✅`, toastStyle);
      } else {
        await createFn(form);
        toast.success(`${entityName} created! 🎉`, toastStyle);
      }
      await fetchData(); closeModal();
    } catch { toast.error('Operation failed ❌', toastStyle); }
    setSaving(false);
  };

  const handleEdit = (row) => { setForm(row); setEditing(true); setModalOpen(true); };
  const handleDeleteClick = (row) => { setDeleteTarget(row); setConfirmOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try { await deleteFn(deleteTarget[idField]); toast.success('Deleted! 🗑️', toastStyle); await fetchData(); }
    catch { toast.error('Delete failed', toastStyle); }
    setDeleteTarget(null);
  };

  const filtered = data.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (searchFields.length) return searchFields.some(f => {
      const v = item[f];
      if (typeof v === 'string') return v.toLowerCase().includes(q);
      if (typeof v === 'object' && v) return Object.values(v).some(x => typeof x === 'string' && x.toLowerCase().includes(q));
      return false;
    });
    return JSON.stringify(item).toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner text={`Loading ${entityName.toLowerCase()}s...`} />;

  return (
    <PageTransition>
      <Toaster position="top-right" />

      {/* Toolbar */}
      <motion.div initial={{ opacity:0, y:-15 }} animate={{ opacity:1, y:0 }}
        style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:'18px', flexWrap:'wrap', gap:'12px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${entityName.toLowerCase()}s...`} />

        {allowCreate && (
          <motion.button
            whileHover={{ scale:1.05, boxShadow:`0 8px 25px -8px ${color||'#6366f1'}50` }}
            whileTap={{ scale:0.95 }}
            onClick={() => { setForm(emptyForm); setEditing(false); setModalOpen(true); }}
            style={{
              background: gradient||'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border:'none', color:'white', padding:'10px 20px', borderRadius:'11px',
              fontSize:'12px', fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:'7px',
              boxShadow:`0 4px 12px ${color||'#6366f1'}30`
            }}>
            ➕ Add {entityName}
          </motion.button>
        )}

        {!allowCreate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ padding:'8px 16px', background:'rgba(255,255,255,0.03)',
              border:'1px solid rgba(255,255,255,0.06)', borderRadius:'10px',
              fontSize:'11px', color:'#64748b', display:'flex', alignItems:'center', gap:'6px' }}>
            🔒 Read-only access
          </motion.div>
        )}
      </motion.div>

      {/* Filter count */}
      <AnimatePresence>
        {search && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ marginBottom:'12px', fontSize:'11px', color:'#64748b' }}>
            Found <span style={{ color:color||'#6366f1', fontWeight:600 }}>{filtered.length}</span> results
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table - conditionally pass edit/delete handlers based on RBAC */}
      <DataTable
        columns={columns}
        data={filtered}
        onEdit={allowEdit ? handleEdit : null}
        onDelete={allowDelete ? handleDeleteClick : null}
        emptyIcon={icon}
        emptyTitle={`No ${entityName.toLowerCase()}s found`}
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal}
        title={`${editing ? '✏️ Edit' : `${icon} Add`} ${entityName}`}>
        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gap:'14px' }}>
            {formFields.map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}{field.required!==false&&' *'}</label>
                {field.type === 'textarea' ? (
                  <textarea style={{ ...inputStyle, minHeight:'70px', resize:'vertical' }}
                    value={form[field.key]||''} onChange={e => setForm({...form,[field.key]:e.target.value})}
                    placeholder={field.placeholder} required={field.required!==false}
                    disabled={editing&&field.isId} />
                ) : field.type === 'select' ? (
                  <select style={inputStyle} value={form[field.key]||''}
                    onChange={e => setForm({...form,[field.key]:e.target.value})}>
                    <option value="" style={{ background:'#1e293b' }}>Select...</option>
                    {field.options.map(o => <option key={o} value={o} style={{ background:'#1e293b' }}>{o}</option>)}
                  </select>
                ) : (
                  <input style={inputStyle} type={field.type||'text'} value={form[field.key]||''}
                    onChange={e => setForm({...form,[field.key]:field.type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value})}
                    placeholder={field.placeholder} required={field.required!==false}
                    disabled={editing&&field.isId} />
                )}
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            type="submit" disabled={saving}
            style={{ width:'100%', marginTop:'22px',
              background:saving?'rgba(99,102,241,0.3)':(gradient||'linear-gradient(135deg, #6366f1, #ec4899)'),
              border:'none', color:'white', padding:'12px', borderRadius:'11px',
              fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            {saving ? <LoadingSpinner size="small" /> : (editing ? '💾 Update' : '✨ Create')}
          </motion.button>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${entityName}`}
        message="This action cannot be undone. Are you sure?" />
    </PageTransition>
  );
};

export default CrudPage;