import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiCheckSquare, FiClipboard, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  VOLUNTEER_POOL,
  assignTasksToVolunteers,
  getBulkAssignments,
  getCampaignChoicesForAssignment,
  subscribeAdminUpdates,
} from '../../../utils/adminAdvancedFeatures';

const BulkVolunteerAssignment = () => {
  const campaignChoices = useMemo(() => getCampaignChoicesForAssignment(), []);
  const [selected, setSelected] = useState([]);
  const [assignments, setAssignments] = useState(() => getBulkAssignments());
  const [form, setForm] = useState({
    campaignId: campaignChoices[0]?.id || '',
    campaignTitle: campaignChoices[0]?.title || 'General Operations',
    taskTitle: '',
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => {
    const refresh = () => setAssignments(getBulkAssignments());
    const unsubscribe = subscribeAdminUpdates(refresh);
    refresh();
    return unsubscribe;
  }, []);

  const toggleVolunteer = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.length === VOLUNTEER_POOL.length ? [] : VOLUNTEER_POOL.map((vol) => vol.id)));
  };

  const handleAssign = () => {
    if (!form.taskTitle.trim()) {
      toast.error('Enter task title for assignment');
      return;
    }
    if (!selected.length) {
      toast.error('Select at least one volunteer');
      return;
    }

    const campaign = campaignChoices.find((item) => item.id === form.campaignId);
    const created = assignTasksToVolunteers({
      ...form,
      campaignTitle: campaign?.title || form.campaignTitle,
      volunteerIds: selected,
    });

    if (!created?.length) {
      toast.error('Unable to create assignments');
      return;
    }

    setAssignments(getBulkAssignments());
    setSelected([]);
    setForm((prev) => ({ ...prev, taskTitle: '', dueDate: '' }));
    toast.success(`Assigned task to ${created.length} volunteers`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-white">Bulk Volunteer Assignment</h3>
          <p className="text-xs text-slate-500 mt-1">Assign one task to multiple volunteers</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-medium">
          {selected.length} selected
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <p className="text-sm text-white font-medium mb-3">Assignment Details</p>
          <div className="space-y-3">
            <select
              value={form.campaignId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, campaignId: event.target.value }))
              }
              className="input-field text-sm"
            >
              {campaignChoices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <input
              value={form.taskTitle}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, taskTitle: event.target.value }))
              }
              placeholder="Task title (e.g., Field verification)"
              className="input-field text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, priority: event.target.value }))
                }
                className="input-field text-sm"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dueDate: event.target.value }))
                }
                className="input-field text-sm"
              />
            </div>
            <button onClick={handleAssign} className="btn-primary w-full py-2.5 text-sm">
              Assign Task to Selected Volunteers
            </button>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-white font-medium">Select Volunteers</p>
            <button
              onClick={toggleAll}
              className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              {selected.length === VOLUNTEER_POOL.length ? 'Clear All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {VOLUNTEER_POOL.map((volunteer) => {
              const checked = selected.includes(volunteer.id);
              return (
                <label
                  key={volunteer.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'border-primary-500/40 bg-primary-500/10'
                      : 'border-white/10 bg-white/3 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleVolunteer(volunteer.id)}
                    className="mt-0.5 checkbox-field"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-white">{volunteer.name}</p>
                    <p className="text-xs text-slate-500">
                      {volunteer.city} • {volunteer.skills.join(', ')}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-white font-medium mb-3">Recent Assignments</p>
        <div className="space-y-2">
          {assignments.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="glass-card p-3 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-200">
                  <FiUsers className="inline-block mr-1 -mt-0.5" />
                  {item.volunteerName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  <FiClipboard className="inline-block mr-1 -mt-0.5" />
                  {item.taskTitle} • {item.campaignTitle}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] ${
                    item.priority === 'high'
                      ? 'bg-red-500/10 text-red-400'
                      : item.priority === 'medium'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  <FiCheckSquare className="mr-1" />
                  {item.priority}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  <FiClock className="inline-block mr-1 -mt-0.5" />
                  Due {item.dueDate || 'not set'}
                </p>
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-xs text-slate-500">No assignments created yet.</p>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default BulkVolunteerAssignment;
