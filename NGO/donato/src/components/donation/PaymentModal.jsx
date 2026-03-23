// src/components/donation/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiSmartphone, FiCreditCard,
  FiCopy, FiCheck, FiUpload, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { modalOverlay, modalContent } from '../../animations/variants';

const PaymentModal = ({ isOpen, onClose, amount, campaignTitle, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '', expiry: '', cvv: '', name: '',
  });

  const upiId = 'kindwave@upi';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
      toast.success('Screenshot uploaded');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async () => {
    if (paymentMethod === 'upi' && !transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }
    if (paymentMethod === 'card') {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        toast.error('Please fill in all card details');
        return;
      }
    }

    setProcessing(true);

    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2500));

    setProcessing(false);
    onPaymentComplete?.({
      payment_method: paymentMethod,
      transaction_id: transactionId || `TXN${Date.now()}`,
      amount,
    });
  };

  const methods = [
    {
      id: 'upi',
      label: 'UPI',
      icon: FiSmartphone,
      desc: 'GPay, PhonePe, Paytm',
      recommended: true,
    },
    {
      id: 'card',
      label: 'Card',
      icon: FiCreditCard,
      desc: 'Credit / Debit Card',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto glass-card shadow-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 
                          bg-dark-card/95 backdrop-blur-xl border-b border-white/5">
              <div>
                <h3 className="text-lg font-heading font-bold text-white">
                  Complete Payment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {campaignTitle && `For: ${campaignTitle}`}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center 
                         text-slate-400 hover:text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="p-5">
              {/* Amount Display */}
              <div className="glass-card p-4 mb-6 text-center">
                <p className="text-xs text-slate-400 mb-1">Amount to Pay</p>
                <p className="text-3xl font-heading font-bold gradient-text">
                  ₹{amount?.toLocaleString()}
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-2 mb-6">
                <p className="text-sm text-slate-400 mb-2">Select Payment Method</p>
                {methods.map((method) => (
                  <motion.button
                    key={method.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border 
                             transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/3'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center 
                                  transition-colors ${
                      paymentMethod === method.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-white/5 text-slate-400'
                    }`}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{method.label}</p>
                        {method.recommended && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 
                                       text-green-400 font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{method.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center 
                                  justify-center transition-colors ${
                      paymentMethod === method.id
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-white/20'
                    }`}>
                      {paymentMethod === method.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Payment Details */}
              <AnimatePresence mode="wait">
                {/* UPI Payment */}
                {paymentMethod === 'upi' && (
                  <motion.div
                    key="upi"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-xl">
                        <div className="w-40 h-40 bg-gradient-to-br from-gray-100 to-gray-200 
                                      rounded-lg flex flex-col items-center justify-center gap-2">
                          <span className="text-4xl">📱</span>
                          <span className="text-xs text-gray-500 font-medium">Scan QR Code</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-sm text-slate-400">
                      Scan to Pay via UPI
                    </p>

                    {/* UPI ID */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 
                                 border border-white/5">
                      <span className="text-sm text-slate-300 flex-1 font-mono">{upiId}</span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyUPI}
                        className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 
                                 text-xs font-medium flex items-center gap-1"
                      >
                        {copied ? <FiCheck className="w-3.5 h-3.5" /> : <FiCopy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </motion.button>
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        UPI Transaction ID *
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter 12-digit transaction ID"
                        className="input-field"
                      />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        Payment Screenshot (optional)
                      </label>
                      <label className="flex items-center justify-center gap-2 py-3 border 
                                     border-dashed border-white/20 rounded-xl cursor-pointer 
                                     hover:border-primary-500 hover:bg-primary-500/5 
                                     transition-all">
                        <FiUpload className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-400">
                          {screenshot ? screenshot.name : 'Upload Screenshot'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </motion.div>
                )}

                {/* Card Payment */}
                {paymentMethod === 'card' && (
                  <motion.div
                    key="card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.number}
                        onChange={(e) =>
                          setCardDetails({
                            ...cardDetails,
                            number: formatCardNumber(e.target.value),
                          })
                        }
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="input-field font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-400 mb-1.5 block">
                        Cardholder Name *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.name}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, name: e.target.value })
                        }
                        placeholder="Name on card"
                        className="input-field"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">
                          Expiry *
                        </label>
                        <input
                          type="text"
                          value={cardDetails.expiry}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              expiry: formatExpiry(e.target.value),
                            })
                          }
                          placeholder="MM/YY"
                          maxLength={5}
                          className="input-field font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-400 mb-1.5 block">
                          CVV *
                        </label>
                        <input
                          type="password"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({
                              ...cardDetails,
                              cvv: e.target.value.replace(/\D/g, '').slice(0, 4),
                            })
                          }
                          placeholder="•••"
                          maxLength={4}
                          className="input-field font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/5 
                                 border border-yellow-500/10">
                      <FiAlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-yellow-400/80">
                        This is a demo. No real payment will be processed. 
                        Do not enter real card details.
                      </p>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Security Notice */}
              <div className="flex items-center gap-2 mt-6 mb-4">
                <div className="w-4 h-4 text-green-400">🔒</div>
                <p className="text-xs text-slate-500">
                  Your payment is secured with 256-bit encryption
                </p>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={processing}
                className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full 
                                  animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{amount?.toLocaleString()}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
