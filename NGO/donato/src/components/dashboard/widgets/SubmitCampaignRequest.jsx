import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  getCampaignWorkflowItems,
  submitCampaignForApproval,
  subscribeAdminUpdates,
} from '../../../utils/adminAdvancedFeatures';
import { useAuth } from '../../../context/AuthContext';

const SubmitCampaignRequest = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState(() => getCampaignWorkflowItems());
  const [form, setForm] = useState({
    title: '',
    category: 'education',
    targetAmount: '',
    beneficiaries: '',
    summary: '',
  });

  useEffect(() => {
    const refresh = () => setSubmissions(getCampaignWorkflowItems());
    const unsubscribe = subscribeAdminUpdates(refresh);
    refresh();
    return unsubscribe;
  }, []);

  const mySubmissions = useMemo(
    () =>
      submissions.filter(
        (item) =>
          item.requestedByEmail &&
          user?.email &&
          item.requestedByEmail.toLowerCase() === user.email.toLowerCase()
      ),
    [submissions, user]
  );

  const onSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.summary.trim()) {
      toast.error('Campaign title and summary are required');
      return;
    }

    const targetAmount = Number(form.targetAmount);
    if (!targetAmount || targetAmount <= 0) {
      toast.error('Enter a valid target amount');
      return;
    }

    submitCampaignForApproval({
      ...form,
      targetAmount,
      beneficiaries: Number(form.beneficiaries || 0),
      requestedBy: user?.name || 'NGO',
      requestedByEmail: user?.email || '',
    });

    setForm({
      title: '',
      category: 'education',
      targetAmount: '',
      beneficiaries: '',
      summary: '',
    });
    setSubmissions(getCampaignWorkflowItems());
    toast.success('Campaign submitted for admin review');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="dashboard-card"
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Campaign Approval Workflow</h3>
        <p className="text-xs text-slate-500 mt-1">
          Submit a campaign to admin for review and approval
        </p>
      </div>

      <form onSubmit={onSubmit} className="glass-card p-4 space-y-3">
        <input
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          className="input-field"
          placeholder="Campaign title"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            className="input-field"
          >
            <option value="education">Education</option>
            <option value="healthcare">Healthcare</option>
            <option value="food">Food</option>
            <option value="disaster_relief">Disaster Relief</option>
            <option value="environment">Environment</option>
            <option value="other">Other</option>
          </select>
          <input
            type="number"
            value={form.targetAmount}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, targetAmount: event.target.value }))
            }
            className="input-field"
            placeholder="Target amount (INR)"
          />
          <input
            type="number"
            value={form.beneficiaries}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, beneficiaries: event.target.value }))
            }
            className="input-field"
            placeholder="Beneficiaries"
          />
        </div>

        <textarea
          value={form.summary}
          onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
          className="textarea-field min-h-[92px]"
          placeholder="Campaign summary and execution plan"
        />

        <button className="btn-primary w-full py-2.5 text-sm" type="submit">
          Submit Campaign
        </button>
      </form>

      <div className="mt-5">
        <p className="text-sm text-white font-medium mb-2">My Recent Submissions</p>
        <div className="space-y-2">
          {mySubmissions.slice(0, 5).map((item) => (
            <div key={item.id} className="glass-card p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-slate-200 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(item.requestedAt).toLocaleString('en-IN')}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs capitalize ${
                  item.status === 'approved'
                    ? 'bg-green-500/10 text-green-400'
                    : item.status === 'rejected'
                      ? 'bg-red-500/10 text-red-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
          {mySubmissions.length === 0 && (
            <p className="text-xs text-slate-500">No submissions yet.</p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default SubmitCampaignRequest;
