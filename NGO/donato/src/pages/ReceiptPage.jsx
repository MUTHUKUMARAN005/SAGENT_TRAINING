// src/pages/ReceiptPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ReceiptViewer from '../components/receipt/ReceiptViewer';
import { useAuth } from '../context/AuthContext';
import { pageTransition } from '../animations/variants';
import { api } from '../utils/api';

const ReceiptPage = () => {
  const { receiptId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReceipt = async () => {
      if (!receiptId) {
        setReceipt(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await api.getReceiptByNumber(receiptId);
        if (isMounted) {
          if (!result.success) {
            toast.error(result.error || 'Unable to load receipt');
            setReceipt(null);
          } else {
            setReceipt(result.data || null);
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error?.message || 'Unable to load receipt');
          setReceipt(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReceipt();

    return () => {
      isMounted = false;
    };
  }, [receiptId]);

  const donation = useMemo(() => {
    if (!receipt) return null;
    return {
      receipt_number: receipt.receipt_number,
      amount: receipt.amount,
      donation_type: receipt.donation_type,
      payment_method: receipt.payment_method,
      transaction_id: receipt.transaction_id,
      donorName: user?.name || '',
      donorEmail: user?.email || '',
      donorPhone: user?.phone || '',
    };
  }, [receipt, user]);

  const campaign = useMemo(() => {
    if (!receipt) return null;
    return {
      title: receipt.campaign,
      ngo_name: receipt.ngo_name,
    };
  }, [receipt]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!receipt || !donation || !campaign) {
    return (
      <motion.div {...pageTransition} className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="dashboard-card text-center py-12">
            <h2 className="text-2xl font-heading font-bold text-white mb-2">No receipts available</h2>
            <p className="text-slate-400">Receipt not found or you do not have access to it.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div {...pageTransition} className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ReceiptViewer donation={donation} campaign={campaign} user={user || {}} />
      </div>
    </motion.div>
  );
};

export default ReceiptPage;