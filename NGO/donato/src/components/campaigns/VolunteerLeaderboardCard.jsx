import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAward, FiRefreshCw, FiTruck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api } from '../../utils/api';

const rankStyles = [
  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  'text-slate-300 bg-slate-400/10 border-slate-400/20',
  'text-amber-500 bg-amber-500/10 border-amber-500/20',
];

const VolunteerLeaderboardCard = ({ campaignId, limit = 5 }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const result = await api.getVolunteerLeaderboard(campaignId, limit);
      const rows = Array.isArray(result?.data) ? result.data : [];
      setLeaders(rows);
    } catch (_error) {
      toast.error('Unable to load volunteer leaderboard.');
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId, limit]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const sorted = useMemo(
    () => [...leaders].sort((a, b) => Number(b.pickups || 0) - Number(a.pickups || 0)),
    [leaders]
  );

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-white font-semibold text-sm">Top Volunteers</h4>
          <p className="text-xs text-slate-500">Based on completed pickups</p>
        </div>
        <button
          onClick={loadLeaderboard}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white
                   hover:bg-white/10 transition-colors"
          aria-label="Refresh leaderboard"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading leaderboard...</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-400">No volunteer activity yet.</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((v, idx) => (
            <div key={v.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/3 border border-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-7 h-7 rounded-full border text-xs font-bold inline-flex items-center justify-center ${rankStyles[idx] || 'text-primary-300 bg-primary-500/10 border-primary-500/20'}`}>
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{v.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <FiAward className="w-3 h-3" /> {v.badge || 'Volunteer'}
                  </p>
                </div>
              </div>
              <span className="text-sm text-primary-300 font-semibold flex items-center gap-1 shrink-0">
                <FiTruck className="w-3.5 h-3.5" /> {v.pickups}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerLeaderboardCard;


