import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiSmartphone, FiUpload, FiCheck, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../utils/api';
import { getDonationImpact } from '../../utils/donationImpact';

const DonationForm = ({ campaign, onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [latestReceiptNumber, setLatestReceiptNumber] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    donation_type: 'money',
    payment_method: 'upi',
    transaction_id: '',
    message: '',
    card_name: '',
    card_number: '',
    card_expiry: '',
    card_cvv: '',
  });

  const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];
  const upiId = 'kindwave@upi';
  const upiName = 'KindWave Foundation';
  const upiAmount = Number(formData.amount) > 0 ? Number(formData.amount).toFixed(2) : '1.00';
  const upiNote = `Donation for ${campaign?.title || 'KindWave Campaign'}`;
  const donationAmount = Number(formData.amount) || 0;
  const upiQrValue =
    `upi://pay?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(upiName)}` +
    `&am=${encodeURIComponent(upiAmount)}` +
    '&cu=INR' +
    `&tn=${encodeURIComponent(upiNote)}`;

  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const impactPreview = useMemo(
    () => getDonationImpact({
      amount: donationAmount,
      donationType: formData.donation_type,
      campaign,
    }),
    [campaign, donationAmount, formData.donation_type]
  );

  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      payment_method: method,
    }));
  };

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      toast.success('UPI ID copied');
      setTimeout(() => setCopiedUpi(false), 1500);
    } catch (_error) {
      toast.error('Unable to copy UPI ID');
    }
  };

  const validatePaymentDetails = () => {
    if (formData.payment_method === 'upi') {
      if (!String(formData.transaction_id || '').trim()) {
        toast.error('Please enter UPI transaction ID');
        return false;
      }
      return true;
    }

    if (formData.payment_method === 'card') {
      const rawCardNumber = String(formData.card_number || '').replace(/\s+/g, '');
      if (!formData.card_name || !rawCardNumber || !formData.card_expiry || !formData.card_cvv) {
        toast.error('Please fill all card details');
        return false;
      }
      if (!/^\d{13,19}$/.test(rawCardNumber)) {
        toast.error('Please enter a valid card number');
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(String(formData.card_expiry))) {
        toast.error('Use expiry format MM/YY');
        return false;
      }
      if (!/^\d{3,4}$/.test(String(formData.card_cvv))) {
        toast.error('Please enter valid CVV');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!validatePaymentDetails()) {
      return;
    }

    setLoading(true);
    try {
      const result = await api.makeDonation({
        campaign_id: campaign?.campaign_id,
        ...formData,
      });
      if (result.success) {
        const donationData = result?.data || {};
        let resolvedReceiptNumber = String(
          donationData?.receipt_number || donationData?.receiptNumber || ''
        ).trim();

        // Fallback: fetch latest receipts if backend response does not carry receipt number.
        if (!resolvedReceiptNumber) {
          try {
            const receiptsResult = await api.getMyReceipts();
            const receipts = Array.isArray(receiptsResult?.data)
              ? receiptsResult.data
              : Array.isArray(receiptsResult)
                ? receiptsResult
                : [];

            if (receipts.length > 0) {
              const txn = String(
                donationData?.transaction_id ||
                donationData?.transactionId ||
                formData?.transaction_id ||
                ''
              ).trim().toLowerCase();

              const byTransaction = txn
                ? receipts.find(
                    (item) =>
                      String(item?.transaction_id || '').trim().toLowerCase() === txn
                  )
                : null;

              if (byTransaction?.receipt_number) {
                resolvedReceiptNumber = String(byTransaction.receipt_number).trim();
              } else {
                const latestReceipt = [...receipts].sort((left, right) => {
                  const leftTime = new Date(left?.issued_date || left?.date || 0).getTime();
                  const rightTime = new Date(right?.issued_date || right?.date || 0).getTime();
                  return rightTime - leftTime;
                })[0];
                resolvedReceiptNumber = String(latestReceipt?.receipt_number || '').trim();
              }
            }
          } catch (_error) {
            resolvedReceiptNumber = '';
          }
        }

        setLatestReceiptNumber(resolvedReceiptNumber);
        onSuccess?.({
          ...donationData,
          receipt_number: resolvedReceiptNumber || donationData?.receipt_number || '',
        });
        setStep(3);
        if (resolvedReceiptNumber) {
          toast.success('Donation successful! 🎉');
        } else {
          toast.success('Donation successful! Receipt is being generated.');
        }
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                           font-semibold text-sm transition-all duration-500 ${
                             step >= s
                               ? 'bg-primary-600 text-white shadow-glow'
                               : 'bg-white/5 text-slate-500 border border-white/10'
                           }`}>
              {step > s ? <FiCheck className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-0.5 rounded-full transition-all duration-500 ${
                step > s ? 'bg-primary-500' : 'bg-white/10'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Amount */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-8"
          >
            <h3 className="text-2xl font-heading font-bold text-white mb-2">
              Donate to "{campaign?.title}"
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Select or enter the amount you'd like to donate
            </p>

            {/* Donation Type Selector */}
            <div className="mb-6">
              <label className="text-sm text-slate-400 mb-2 block">Donation Type</label>
              <div className="p-3 rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-300">
                <span className="text-xl block mb-1">💰</span>
                <span className="text-xs font-medium">Money (UPI or Card only)</span>
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {presetAmounts.map((amount) => (
                <motion.button
                  key={amount}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateField('amount', amount)}
                  className={`py-3 rounded-xl border text-center font-semibold transition-all ${
                    formData.amount === amount
                      ? 'border-primary-500 bg-primary-500/20 text-primary-400 shadow-glow'
                      : 'border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  ₹{amount.toLocaleString()}
                </motion.button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative mb-6">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 
                           font-semibold">₹</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => updateField('amount', Number(e.target.value))}
                placeholder="Enter custom amount"
                className="input-field pl-10 text-lg"
              />
            </div>

            {donationAmount > 0 && (
              <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/15 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-lg shrink-0">
                    {impactPreview.icon}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary-400 font-semibold mb-1">
                      Donation Impact Tracking
                    </p>
                    <p className="text-white font-medium leading-relaxed">
                      {impactPreview.shortHeadline}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{impactPreview.noun}</span>
                      <span>•</span>
                      <span>{impactPreview.meta}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Message */}
            <textarea
              value={formData.message}
              onChange={(e) => updateField('message', e.target.value)}
              placeholder="Add a message (optional)"
              rows={3}
              className="input-field mb-6 resize-none"
            />

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (formData.amount > 0) setStep(2);
                else toast.error('Please enter an amount');
              }}
              className="w-full btn-primary py-4 text-lg"
            >
              Continue to Payment
            </motion.button>
          </motion.div>
        )}

        {/* Step 2: Payment */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-heading font-bold text-white mb-2">
              Payment Details
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              Amount: <span className="text-primary-400 font-bold">
                ₹{formData.amount?.toLocaleString()}
              </span>
            </p>

            {/* Payment Methods */}
            <div className="space-y-3 mb-6">
              {[
                { id: 'upi', label: 'UPI Payment', icon: FiSmartphone, desc: 'Scan QR or enter UPI ID' },
                { id: 'card', label: 'Card Payment', icon: FiCreditCard, desc: 'Credit/Debit Card' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodChange(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    formData.payment_method === method.id
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.payment_method === method.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/5 text-slate-400'
                  }`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm">{method.label}</p>
                    <p className="text-xs text-slate-500">{method.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* UPI Section */}
              {formData.payment_method === 'upi' && (
                <motion.div
                  key="upi-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 space-y-4"
                >
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl shadow-lg">
                      <QRCodeSVG
                        value={upiQrValue}
                        size={176}
                        bgColor="#ffffff"
                        fgColor="#111827"
                        level="H"
                        includeMargin
                      />
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-400">Scan to Pay via UPI</p>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/5">
                    <span className="text-sm text-slate-300 flex-1 font-mono">{upiId}</span>
                    <button
                      type="button"
                      onClick={handleCopyUPI}
                      className="px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 text-xs 
                               font-medium flex items-center gap-1 hover:bg-primary-500/20 transition-colors"
                    >
                      <FiCopy className="w-3.5 h-3.5" />
                      {copiedUpi ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => updateField('transaction_id', e.target.value)}
                    placeholder="Enter UPI Transaction ID"
                    className="input-field"
                  />

                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-3 border 
                                   border-dashed border-white/20 rounded-xl text-slate-400 
                                   hover:border-primary-500 hover:text-primary-400 transition-all"
                  >
                    <FiUpload className="w-4 h-4" />
                    Upload Payment Screenshot
                  </button>
                </motion.div>
              )}

              {/* Card Section */}
              {formData.payment_method === 'card' && (
                <motion.div
                  key="card-section"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 space-y-4"
                >
                  <input
                    type="text"
                    value={formData.card_name}
                    onChange={(e) => updateField('card_name', e.target.value)}
                    placeholder="Card Holder Name"
                    className="input-field"
                  />

                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 19);
                      const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                      updateField('card_number', formatted);
                    }}
                    placeholder="Card Number"
                    className="input-field"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={formData.card_expiry}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                        const formatted =
                          digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                        updateField('card_expiry', formatted);
                      }}
                      placeholder="MM/YY"
                      className="input-field"
                    />
                    <input
                      type="password"
                      value={formData.card_cvv}
                      onChange={(e) => updateField('card_cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="CVV"
                      className="input-field"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Your card details are encrypted and securely processed.
                  </p>
                </motion.div>
              )}

            </AnimatePresence>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-white/10 rounded-xl text-slate-300 
                         hover:bg-white/5 transition-colors"
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full 
                                animate-spin" />
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Confirm Donation
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border-2 
                       border-green-500 flex items-center justify-center"
            >
              <FiCheck className="w-10 h-10 text-green-400" />
            </motion.div>

            <h3 className="text-2xl font-heading font-bold text-white mb-2">
              Donation Successful!
            </h3>
            <p className="text-slate-400 mb-2">
              Thank you for your donation to
            </p>
            <p className="text-primary-400 font-semibold mb-1">"{campaign?.title}"</p>
            <div className="p-4 rounded-2xl bg-primary-500/5 border border-primary-500/15 mb-6 text-left">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-lg shrink-0">
                  {impactPreview.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary-400 font-semibold mb-1">
                    Your Impact
                  </p>
                  <p className="text-white font-medium leading-relaxed">
                    {impactPreview.shortHeadline}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {impactPreview.detail}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 mb-6 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Amount</span>
                <span className="text-white font-semibold">₹{donationAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Receipt</span>
                <span className="text-primary-400">{latestReceiptNumber || 'Generating...'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (!latestReceiptNumber) {
                    toast.error('Receipt is not ready yet. Please check again in a moment.');
                    return;
                  }
                  navigate(`/receipt/${encodeURIComponent(latestReceiptNumber)}`);
                }}
                disabled={!latestReceiptNumber}
                className="flex-1 btn-primary py-3"
              >
                View Receipt
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setStep(1);
                  setFormData({
                    amount: '',
                    donation_type: 'money',
                    payment_method: 'upi',
                    transaction_id: '',
                    message: '',
                    card_name: '',
                    card_number: '',
                    card_expiry: '',
                    card_cvv: '',
                  });
                  setLatestReceiptNumber('');
                }}
                className="flex-1 btn-secondary py-3"
              >
                Donate Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DonationForm;
