import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheck, FiClock, FiEdit2, FiMapPin, FiRefreshCw,
  FiTrash2, FiTrendingUp, FiX,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { hasRequiredRole } from '../../utils/roles';

const formatDateTime = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const CampaignUpdatesFeed = ({ campaignId, manageMode = false }) => {
  const { user } = useAuth();
  const canManageUpdates = manageMode && hasRequiredRole(user?.role, ['ngo', 'admin']);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    message: '',
    impact_count: '',
    impact_label: '',
  });

  const loadUpdates = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const result = await api.getCampaignUpdates(campaignId);
      const items = Array.isArray(result?.data) ? result.data : [];
      setUpdates(items);
    } catch (_error) {
      toast.error('Unable to load campaign updates right now.');
      setUpdates([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadUpdates();
  }, [loadUpdates]);

  const sortedUpdates = useMemo(
    () => {
      const pinned = updates.filter((u) => u.is_pinned);
      const normal = updates.filter((u) => !u.is_pinned);
      const byDate = (a, b) => new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime();
      return [...pinned.sort(byDate), ...normal.sort(byDate)];
    },
    [updates]
  );

  const startEditing = (update) => {
    setEditingId(update.id);
    setEditForm({
      message: update.message || '',
      impact_count: String(update.impact_count || ''),
      impact_label: update.impact_label || '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ message: '', impact_count: '', impact_label: '' });
  };

  const handleUpdateSave = async (update) => {
    if (!canManageUpdates) {
      toast.error('Only NGO/Admin can edit campaign updates');
      return;
    }
    const message = String(editForm.message || '').trim();
    if (!message) {
      toast.error('Update message cannot be empty');
      return;
    }

    setActionLoadingId(update.id);
    try {
      const result = await api.updateCampaignUpdate(campaignId, update.id, {
        message,
        impact_count: Number(editForm.impact_count) || 0,
        impact_label: String(editForm.impact_label || '').trim(),
      });
      if (result?.success) {
        toast.success('Update edited successfully');
        cancelEditing();
        await loadUpdates();
      }
    } catch (_error) {
      toast.error('Failed to edit update');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (update) => {
    if (!canManageUpdates) {
      toast.error('Only NGO/Admin can delete campaign updates');
      return;
    }
    if (!window.confirm('Delete this campaign update?')) return;
    setActionLoadingId(update.id);
    try {
      await api.deleteCampaignUpdate(campaignId, update.id);
      toast.success('Update deleted');
      await loadUpdates();
    } catch (_error) {
      toast.error('Failed to delete update');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePinToggle = async (update) => {
    if (!canManageUpdates) {
      toast.error('Only NGO/Admin can pin campaign updates');
      return;
    }
    setActionLoadingId(update.id);
    try {
      // Enforce a single pinned update per campaign.
      if (!update.is_pinned) {
        const currentlyPinned = updates.filter((u) => u.is_pinned && u.id !== update.id);
        for (const pinnedItem of currentlyPinned) {
          await api.setCampaignUpdatePinned(campaignId, pinnedItem.id, false);
        }
      }
      await api.setCampaignUpdatePinned(campaignId, update.id, !update.is_pinned);
      toast.success(update.is_pinned ? 'Update unpinned' : 'Update pinned to top');
      await loadUpdates();
    } catch (_error) {
      toast.error('Failed to update pin state');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">Campaign Updates Feed</h3>
          <p className="text-xs text-slate-500">
            {manageMode && !canManageUpdates
              ? 'Read-only view: NGO/Admin access required for update actions'
              : 'Posted by NGO team members'}
          </p>
        </div>
        <button
          onClick={loadUpdates}
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300
                   hover:bg-white/10 transition-colors text-xs flex items-center gap-1.5"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-6 text-center text-slate-400 text-sm">Loading updates...</div>
      ) : sortedUpdates.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <span className="text-4xl block mb-2">📝</span>
          <p className="text-white font-medium mb-1">No updates posted yet</p>
          <p className="text-slate-400 text-sm">NGO progress posts will appear here.</p>
        </div>
      ) : (
        sortedUpdates.map((update, idx) => (
          <motion.div
            key={update.id || idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.25) }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-white text-sm font-semibold truncate">Update from {update.posted_by || 'NGO Team'}</p>
                {update.is_pinned && (
                  <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-300 text-[10px] font-medium">
                    Pinned
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                <FiClock className="w-3 h-3" /> {formatDateTime(update.posted_at)}
              </span>
            </div>

            {canManageUpdates && (
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => handlePinToggle(update)}
                  disabled={actionLoadingId === update.id}
                  className="px-2 py-1 rounded-lg text-xs bg-white/5 border border-white/10 text-slate-300
                           hover:bg-white/10 transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                >
                  <FiMapPin className="w-3 h-3" /> {update.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => startEditing(update)}
                  disabled={actionLoadingId === update.id}
                  className="px-2 py-1 rounded-lg text-xs bg-primary-500/10 border border-primary-500/20 text-primary-300
                           hover:bg-primary-500/20 transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                >
                  <FiEdit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(update)}
                  disabled={actionLoadingId === update.id}
                  className="px-2 py-1 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-300
                           hover:bg-red-500/20 transition-colors inline-flex items-center gap-1 disabled:opacity-60"
                >
                  <FiTrash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}

            {canManageUpdates && editingId === update.id ? (
              <div className="space-y-2 mb-3">
                <textarea
                  value={editForm.message}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="input-field resize-none"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={editForm.impact_count}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, impact_count: e.target.value }))}
                    className="input-field"
                    placeholder="Impact count"
                  />
                  <input
                    type="text"
                    value={editForm.impact_label}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, impact_label: e.target.value }))}
                    className="input-field"
                    placeholder="Impact label"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateSave(update)}
                    disabled={actionLoadingId === update.id}
                    className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300
                             text-xs inline-flex items-center gap-1 disabled:opacity-60"
                  >
                    <FiCheck className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={actionLoadingId === update.id}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300
                             text-xs inline-flex items-center gap-1 disabled:opacity-60"
                  >
                    <FiX className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{update.message}</p>
            )}

            {(update.impact_count > 0 || update.impact_label) && (
              <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                              bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs">
                <FiTrendingUp className="w-3.5 h-3.5" />
                <span>
                  {update.impact_count > 0 ? `${update.impact_count} ` : ''}
                  {update.impact_label || 'impact recorded'}
                </span>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
};

export default CampaignUpdatesFeed;


