// src/components/Pages/CrudPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  width:'100%', padding:'11px 16px', background:'rgba(13, 31, 53, 0.75)',
  border:'1px solid rgba(157, 181, 209, 0.24)', borderRadius:'10px', color:'#e8f1fb',
  fontSize:'13px', outline:'none', transition:'all 0.3s'
};
const labelStyle = {
  fontSize:'10px', fontWeight:700, color:'#9fb4ca', marginBottom:'5px',
  display:'block', textTransform:'uppercase', letterSpacing:'0.06em'
};

const toastStyle = {
  style: { background:'#10233a', color:'#e8f1fb', border:'1px solid rgba(157, 181, 209, 0.28)', borderRadius:'12px', fontSize:'13px' }
};

const CrudPage = ({ config }) => {
  const {
    entityName, icon, gradient, color,
    idField, fetchFn, createFn, updateFn, deleteFn,
    emptyForm, columns, formFields, fallbackData,
    searchFields = [],
    filterData,
    canEditRow,
    canDeleteRow,
    transformSubmit,
    quickFilters = [],
    buildQuickFilters,
    // RBAC permissions
    canCreate, canEdit, canDelete
  } = config;

  const { checkPermission, user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const resolveAccessRule = useCallback((rule) => {
    if (!rule) return true;
    if (typeof rule === 'function') {
      return !!rule({ user, checkPermission });
    }
    if (Array.isArray(rule)) {
      return rule.some((permission) => checkPermission(permission));
    }
    if (typeof rule === 'string') {
      return checkPermission(rule);
    }
    return false;
  }, [checkPermission, user]);

  // Check RBAC permissions
  const allowCreate = resolveAccessRule(canCreate);
  const allowEdit = resolveAccessRule(canEdit);
  const allowDelete = resolveAccessRule(canDelete);

  const applyConfiguredFilter = useCallback((rows) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    return typeof filterData === 'function' ? filterData(safeRows, user) : safeRows;
  }, [filterData, user]);

  const fetchData = useCallback(async () => {
    try { const res = await fetchFn(); setData(applyConfiguredFilter(res.data)); }
    catch { setData(applyConfiguredFilter(fallbackData || [])); }
    setLoading(false);
  }, [fetchFn, fallbackData, applyConfiguredFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); setEditing(false); };

  const readFileAsDataUrl = useCallback((file) => (
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    })
  ), []);

  const handleFieldValueChange = useCallback(async (field, event) => {
    if (field.type === 'file-image') {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) {
        setForm((prev) => ({ ...prev, [field.key]: '' }));
        return;
      }

      if (!selectedFile.type?.startsWith('image/')) {
        toast.error('Please upload a valid image file', toastStyle);
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(selectedFile);
        setForm((prev) => ({
          ...prev,
          [field.key]: dataUrl,
          [`${field.key}Name`]: selectedFile.name
        }));
      } catch {
        toast.error('Unable to process image upload', toastStyle);
      }
      return;
    }

    const rawValue = event.target.value;
    const value = field.type === 'number'
      ? (rawValue === '' ? '' : Number(rawValue))
      : rawValue;
    setForm((prev) => ({ ...prev, [field.key]: value }));
  }, [readFileAsDataUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = typeof transformSubmit === 'function'
        ? await transformSubmit({ form, editing, user, rows: data })
        : form;

      if (editing) {
        await updateFn(form[idField], payload);
        toast.success(`${entityName} updated successfully`, toastStyle);
      } else {
        await createFn(payload);
        toast.success(`${entityName} created successfully`, toastStyle);
      }
      await fetchData(); closeModal();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Operation failed';
      toast.error(message, toastStyle);
    }
    setSaving(false);
  };

  const handleEdit = (row) => { setForm(row); setEditing(true); setModalOpen(true); };
  const handleDeleteClick = (row) => { setDeleteTarget(row); setConfirmOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try { await deleteFn(deleteTarget[idField]); toast.success('Record deleted successfully', toastStyle); await fetchData(); }
    catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Delete failed';
      toast.error(message, toastStyle);
    }
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

  const resolvedQuickFilters = useMemo(() => (
    typeof buildQuickFilters === 'function'
      ? (buildQuickFilters(data, user) || [])
      : quickFilters
  ), [buildQuickFilters, data, quickFilters, user]);

  useEffect(() => {
    if (!resolvedQuickFilters.length) return;
    setActiveFilters((prev) => {
      const next = { ...prev };
      resolvedQuickFilters.forEach((filter) => {
        if (!(filter.key in next)) next[filter.key] = filter.defaultValue ?? '';
      });
      return next;
    });
  }, [resolvedQuickFilters]);

  const matchesQuickFilter = useCallback((row, filter, value) => {
    if (value === '' || value === 'ALL') return true;

    if (typeof filter.predicate === 'function') {
      return !!filter.predicate(row, value, user);
    }

    if (!filter.field) return true;
    const candidate = row?.[filter.field];
    if (typeof candidate === 'string') {
      return candidate.toLowerCase() === String(value).toLowerCase();
    }
    return String(candidate ?? '').toLowerCase() === String(value).toLowerCase();
  }, [user]);

  const finalRows = filtered.filter((row) => (
    resolvedQuickFilters.every((filter) => (
      matchesQuickFilter(row, filter, activeFilters[filter.key] ?? filter.defaultValue ?? '')
    ))
  ));

  const allowEditForRow = useCallback((row) => {
    if (!allowEdit) return false;
    return typeof canEditRow === 'function' ? !!canEditRow(row, user) : true;
  }, [allowEdit, canEditRow, user]);

  const allowDeleteForRow = useCallback((row) => {
    if (!allowDelete) return false;
    return typeof canDeleteRow === 'function' ? !!canDeleteRow(row, user) : true;
  }, [allowDelete, canDeleteRow, user]);

  if (loading) return <LoadingSpinner text={`Loading ${entityName.toLowerCase()}s...`} />;

  return (
    <PageTransition>
      <Toaster position="top-right" />

      {/* Toolbar */}
      <motion.div initial={{ opacity:0, y:-15 }} animate={{ opacity:1, y:0 }}
        style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          marginBottom:'18px', flexWrap:'wrap', gap:'12px' }}>
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${entityName.toLowerCase()}s...`} />

        {resolvedQuickFilters.map((filter) => (
          <select
            key={filter.key}
            value={activeFilters[filter.key] ?? filter.defaultValue ?? ''}
            onChange={(event) => setActiveFilters((prev) => ({ ...prev, [filter.key]: event.target.value }))}
            style={{
              padding:'10px 12px',
              background:'rgba(13, 31, 53, 0.75)',
              border:'1px solid rgba(157, 181, 209, 0.24)',
              borderRadius:'10px',
              color:'#e8f1fb',
              fontSize:'12px',
              minWidth:'160px',
              outline:'none'
            }}
          >
            {(filter.options || []).map((option) => (
              <option key={`${filter.key}-${option.value}`} value={option.value} style={{ background:'#091524' }}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {allowCreate && (
          <motion.button
            whileHover={{ scale:1.05, boxShadow:`0 8px 25px -8px ${color||'#6366f1'}50` }}
            whileTap={{ scale:0.95 }}
            onClick={() => { setForm(emptyForm); setEditing(false); setModalOpen(true); }}
            style={{
              background: gradient||'linear-gradient(135deg, #0ea5a4, #3b82f6)',
              border:'none', color:'white', padding:'10px 20px', borderRadius:'11px',
              fontSize:'12px', fontWeight:700, cursor:'pointer',
              display:'flex', alignItems:'center', gap:'7px',
              boxShadow:`0 4px 12px ${color||'#6366f1'}30`
            }}>
            Add {entityName}
          </motion.button>
        )}

        {!allowCreate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ padding:'8px 16px', background:'rgba(157, 181, 209, 0.08)',
              border:'1px solid rgba(157, 181, 209, 0.18)', borderRadius:'10px',
              fontSize:'11px', color:'#7d93ad', display:'flex', alignItems:'center', gap:'6px' }}>
            Read-only access
          </motion.div>
        )}
      </motion.div>

      {/* Filter count */}
      <AnimatePresence>
        {(search || resolvedQuickFilters.some((filter) => {
          const selectedValue = activeFilters[filter.key] ?? filter.defaultValue ?? '';
          return selectedValue !== '' && selectedValue !== 'ALL';
        })) && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ marginBottom:'12px', fontSize:'11px', color:'#7d93ad' }}>
            Found <span style={{ color:color||'#6366f1', fontWeight:600 }}>{finalRows.length}</span> results
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table - conditionally pass edit/delete handlers based on RBAC */}
      <DataTable
        columns={columns}
        data={finalRows}
        onEdit={allowEdit ? handleEdit : null}
        onDelete={allowDelete ? handleDeleteClick : null}
        canEditRow={allowEditForRow}
        canDeleteRow={allowDeleteForRow}
        emptyIcon={icon}
        emptyTitle={`No ${entityName.toLowerCase()}s found`}
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal}
        title={`${editing ? 'Edit' : 'Add'} ${entityName}`}>
        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gap:'14px' }}>
            {formFields.map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}{field.required!==false&&' *'}</label>
                {field.type === 'textarea' ? (
                  <textarea style={{ ...inputStyle, minHeight:'70px', resize:'vertical' }}
                    value={form[field.key]||''} onChange={e => handleFieldValueChange(field, e)}
                    placeholder={field.placeholder} required={field.required!==false}
                    disabled={editing&&field.isId} />
                ) : field.type === 'select' ? (
                  <select style={inputStyle} value={form[field.key]||''}
                    onChange={e => handleFieldValueChange(field, e)}
                    required={field.required!==false}
                    disabled={editing&&field.isId}>
                    <option value="" style={{ background:'#091524' }}>Select...</option>
                    {(field.options || []).map((rawOption) => {
                      const option = typeof rawOption === 'object' && rawOption !== null
                        ? rawOption
                        : { label: rawOption, value: rawOption };
                      return (
                        <option key={`${field.key}-${option.value}`} value={option.value} style={{ background:'#091524' }}>
                          {option.label}
                        </option>
                      );
                    })}
                  </select>
                ) : field.type === 'file-image' ? (
                  <div>
                    <input
                      style={{ ...inputStyle, padding:'8px 12px' }}
                      type="file"
                      accept="image/*"
                      required={field.required !== false && !editing}
                      onChange={e => handleFieldValueChange(field, e)}
                      disabled={editing && field.isId}
                    />
                    {form[field.key] && (
                      <div style={{ marginTop:'8px', display:'flex', alignItems:'center', gap:'8px' }}>
                        <img
                          src={form[field.key]}
                          alt="preview"
                          style={{ width:'42px', height:'56px', borderRadius:'6px', objectFit:'cover', border:'1px solid rgba(157, 181, 209, 0.24)' }}
                        />
                        <span style={{ fontSize:'11px', color:'#9fb4ca' }}>
                          {form[`${field.key}Name`] || 'Selected image'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input style={inputStyle} type={field.type||'text'} value={form[field.key]||''}
                    onChange={e => handleFieldValueChange(field, e)}
                    placeholder={field.placeholder} required={field.required!==false}
                    disabled={editing&&field.isId} />
                )}
              </div>
            ))}
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            type="submit" disabled={saving}
            style={{ width:'100%', marginTop:'22px',
              background:saving?'rgba(14, 165, 164, 0.3)':(gradient||'linear-gradient(135deg, #0ea5a4, #3b82f6)'),
              border:'none', color:'white', padding:'12px', borderRadius:'11px',
              fontSize:'13px', fontWeight:700, cursor:saving?'not-allowed':'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            {saving ? <LoadingSpinner size="small" /> : (editing ? 'Update' : 'Create')}
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
