import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiClock, FiDownload, FiFileText, FiExternalLink } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../utils/api';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDonationValue = (donation = {}) => {
  const type = String(donation.type || donation.donation_type || '').trim().toLowerCase();
  if (type === 'money') {
    return {
      primary: formatCurrency(donation.amount),
      secondary: '',
    };
  }

  const itemType = String(donation.itemType || donation.item_type || '').trim();
  const itemCount = Number(donation.itemCount ?? donation.item_count ?? donation.quantity ?? 0);

  return {
    primary: itemType || 'Physical donation',
    secondary: Number.isFinite(itemCount) && itemCount > 0 ? `Qty: ${itemCount}` : '',
  };
};

const DonationHistory = ({ onViewReceipt, limit = 5, donations: donationsProp = null }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allDonations, setAllDonations] = useState([]);

  const hasProvidedDonations = Array.isArray(donationsProp);

  useEffect(() => {
    if (hasProvidedDonations) {
      setAllDonations(donationsProp);
      return;
    }

    let isMounted = true;

    const fetchHistory = async () => {
      const result = await api.getDonationHistory();
      if (isMounted) {
        const rows = Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result)
            ? result
            : [];
        setAllDonations(rows);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [hasProvidedDonations, donationsProp]);

  const donations = useMemo(
    () => allDonations.slice(0, limit),
    [allDonations, limit]
  );

  const handleReceiptClick = (donation) => {
    if (onViewReceipt) {
      onViewReceipt(donation);
    } else {
      const params = new URLSearchParams({
        amount: donation.amount,
        campaign: donation.campaign,
        ngo: donation.ngo_name || '',
        type: donation.type,
        method: donation.payment_method || 'upi',
        txn: donation.transaction_id || '',
        donor: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
      navigate(`/receipt/${donation.receipt_number}?${params.toString()}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="dashboard-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          💰 Donation History
        </h3>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-primary-400 hover:text-primary-300 transition-colors
                   flex items-center gap-1"
        >
          View All <FiExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        {donations.map((donation, idx) => {
          const donationValue = formatDonationValue(donation);

          return (
          <motion.div
            key={donation.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + idx * 0.08 }}
            className="flex items-center justify-between p-4 rounded-xl bg-white/3
                     hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  donation.status === 'completed'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-yellow-500/10 text-yellow-400'
                }`}
              >
                {donation.status === 'completed' ? (
                  <FiCheckCircle className="w-5 h-5" />
                ) : (
                  <FiClock className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {donation.campaign}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-slate-500">
                    {new Date(donation.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <span className="text-slate-700">•</span>
                  <p className="text-xs text-slate-500 capitalize">{donation.type}</p>
                  {donation.receipt_number && (
                    <>
                      <span className="text-slate-700">•</span>
                      <p className="text-[10px] text-primary-400/70 font-mono">
                        {donation.receipt_number}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-3">
              <div className="text-right">
                <p className="text-white font-semibold text-sm">{donationValue.primary}</p>
                {donationValue.secondary && (
                  <p className="text-[11px] text-slate-500 mt-0.5">{donationValue.secondary}</p>
                )}
              </div>

              {donation.status === 'completed' && donation.receipt_number && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReceiptClick(donation);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100
                           transition-all"
                  title="View Receipt"
                >
                  <FiFileText className="w-4 h-4 text-primary-400" />
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReceiptClick(donation);
                }}
                className="p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100
                         transition-all"
                title="Download Receipt"
              >
                <FiDownload className="w-4 h-4 text-slate-400" />
              </motion.button>
            </div>
          </motion.div>
          );
        })}

        {donations.length === 0 && (
          <div className="empty-state py-10">
            <span className="empty-state-icon">📭</span>
            <p className="empty-state-title">No Donations Yet</p>
            <p className="empty-state-text text-sm">
              Start making a difference by donating to a campaign!
            </p>
          </div>
        )}
      </div>

      {donations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total:{' '}
            <span className="text-white font-semibold">
              {formatCurrency(donations
                .filter((d) => d.status === 'completed')
                .reduce((s, d) => s + Number(d.amount || 0), 0)
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              {donations.filter((d) => d.status === 'completed').length} completed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
              {donations.filter((d) => d.status === 'pending').length} pending
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DonationHistory;
