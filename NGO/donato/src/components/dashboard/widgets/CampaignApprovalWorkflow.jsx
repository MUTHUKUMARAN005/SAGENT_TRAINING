import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiClock, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  getCampaignWorkflowItems,
  reviewCampaignSubmission,
  subscribeAdminUpdates,
} from '../../../utils/adminAdvancedFeatures';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const CampaignApprovalWorkflow = () => {
  const [items, setItems] = useState(() => getCampaignWorkflowItems());
  const [statusFilter, setStatusFilter] = useState('pending');
  const [notesById, setNotesById] = useState({});

  useEffect(() => {
    const refresh = () => setItems(getCampaignWorkflowItems());
    const unsubscribe = subscribeAdminUpdates(refresh);
    refresh();
    return unsubscribe;
  }, []);

  const visibleItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const handleReview = (id, action) => {
    const note = notesById[id] || '';
    const updated = reviewCampaignSubmission({
      id,
      action,
      reviewNote: note,
      reviewedBy: 'Admin',
    });

    if (!updated) {
      toast.error('Unable to update campaign review');
      return;
    }

    setItems(getCampaignWorkflowItems());
    toast.success(`Campaign ${action === 'approve' ? 'approved' : 'rejected'}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-white">Campaign Approval Workflow</h3>
          <p className="text-xs text-slate-500 mt-1">NGO submit to admin review and approve or reject</p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {visibleItems.map((item) => {
          const statusClass =
            item.status === 'approved'
              ? 'bg-green-500/10 text-green-400'
              : item.status === 'rejected'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-yellow-500/10 text-yellow-400';

          return (
            <div key={item.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-white font-medium">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.requestedBy} • {formatCurrency(item.targetAmount)} • {item.beneficiaries} beneficiaries
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs capitalize ${statusClass}`}>
                  {item.status}
                </span>
              </div>

              <p className="text-sm text-slate-400 mt-3">{item.summary}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="text-xs text-slate-500">
                  <FiClock className="inline-block mr-1 -mt-0.5" />
                  Submitted: {new Date(item.requestedAt).toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-500">
                  <FiFileText className="inline-block mr-1 -mt-0.5" />
                  Category: <span className="capitalize">{item.category}</span>
                </div>
              </div>

              {item.status === 'pending' ? (
                <div className="mt-3">
                  <textarea
                    value={notesById[item.id] || ''}
                    onChange={(event) =>
                      setNotesById((prev) => ({ ...prev, [item.id]: event.target.value }))
                    }
                    placeholder="Optional review note..."
                    className="textarea-field min-h-[74px] text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleReview(item.id, 'approve')}
                      className="flex-1 py-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-400 text-sm hover:bg-green-600/30 transition-colors"
                    >
                      <FiCheck className="inline-block mr-1 -mt-0.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(item.id, 'reject')}
                      className="flex-1 py-2 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-600/30 transition-colors"
                    >
                      <FiX className="inline-block mr-1 -mt-0.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">
                  Reviewed by {item.reviewedBy || 'Admin'} on{' '}
                  {item.reviewedAt
                    ? new Date(item.reviewedAt).toLocaleString('en-IN')
                    : 'N/A'}
                  {item.reviewNote ? ` • Note: ${item.reviewNote}` : ''}
                </div>
              )}
            </div>
          );
        })}

        {visibleItems.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">No campaigns found for this filter.</p>
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default CampaignApprovalWorkflow;
