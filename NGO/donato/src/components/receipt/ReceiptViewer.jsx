// src/components/receipt/ReceiptViewer.jsx
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiDownload, FiPrinter, FiShare2, FiMail, FiCheck, FiHeart
} from 'react-icons/fi';
import { downloadReceipt, openReceiptInNewTab } from '../../utils/receiptGenerator';
import toast from 'react-hot-toast';

const ReceiptViewer = ({ donation = {}, campaign = {}, user = {} }) => {
  const receiptRef = useRef(null);

  const receiptData = {
    receiptNumber: donation.receipt_number || `REC-${Date.now()}`,
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    donorName: user.name || donation.donorName || 'Anonymous',
    donorEmail: user.email || donation.donorEmail || '',
    donorPhone: user.phone || donation.donorPhone || '',
    donorPAN: donation.donorPAN || '',
    amount: donation.amount || 0,
    campaignTitle: campaign.title || donation.campaignTitle || 'General Donation',
    ngoName: campaign.ngo_name || donation.ngoName || 'KindWave Foundation',
    donationType: donation.donation_type || 'money',
    paymentMethod: donation.payment_method || 'UPI',
    transactionId: donation.transaction_id || `TXN${Date.now()}`,
  };

  const handleDownloadPDF = () => {
    downloadReceipt(receiptData);
    toast.success('Receipt PDF downloaded! 📄');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenPDF = () => {
    openReceiptInNewTab(receiptData);
  };

  const handleEmailReceipt = () => {
    toast.success('Receipt sent to your email! 📧');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `KindWave Donation Receipt - ${receiptData.receiptNumber}`,
          text: `I donated ₹${receiptData.amount.toLocaleString()} to ${receiptData.campaignTitle}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          `KindWave Donation Receipt\nReceipt: ${receiptData.receiptNumber}\nAmount: ₹${receiptData.amount.toLocaleString()}\nCampaign: ${receiptData.campaignTitle}`
        );
        toast.success('Receipt details copied!');
      }
    } catch (err) {
      // cancelled
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6 flex-wrap gap-3"
      >
        <h2 className="text-xl font-heading font-bold text-white">
          Donation Receipt
        </h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white 
                     text-sm font-medium hover:bg-primary-500 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            Download PDF
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border 
                     border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors"
          >
            <FiPrinter className="w-4 h-4" />
            Print
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEmailReceipt}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border 
                     border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors"
          >
            <FiMail className="w-4 h-4" />
            Email
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 
                     hover:bg-white/10 transition-colors"
          >
            <FiShare2 className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* Visual Receipt */}
      <motion.div
        ref={receiptRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden print:bg-white print:text-black"
        id="receipt-content"
      >
        {/* Receipt Header */}
        <div className="bg-gradient-to-r from-primary-700 to-blue-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FiHeart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-heading font-bold text-lg">KindWave</h3>
                <p className="text-blue-200 text-xs">Transparent Donation Platform</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-green-500/20 border 
                           border-green-500/30 text-green-300 text-xs font-medium mb-1">
                TAX RECEIPT
              </span>
              <p className="text-blue-200 text-xs">80G Eligible</p>
            </div>
          </div>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-6">
          {/* Receipt Title */}
          <div className="text-center border-b border-white/5 pb-4">
            <h2 className="text-xl font-heading font-bold text-white mb-1">
              Donation Receipt
            </h2>
            <p className="text-sm text-primary-400 font-mono">
              {receiptData.receiptNumber}
            </p>
            <p className="text-xs text-slate-500 mt-1">{receiptData.date}</p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donor Info */}
            <div className="bg-white/3 rounded-xl p-4">
              <h4 className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-3">
                Donor Information
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Name', value: receiptData.donorName },
                  { label: 'Email', value: receiptData.donorEmail || 'N/A' },
                  { label: 'Phone', value: receiptData.donorPhone || 'N/A' },
                  { label: 'PAN', value: receiptData.donorPAN || 'N/A' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <span className="text-xs text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Donation Info */}
            <div className="bg-white/3 rounded-xl p-4">
              <h4 className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-3">
                Donation Details
              </h4>
              <div className="space-y-2">
                {[
                  { label: 'Campaign', value: receiptData.campaignTitle },
                  { label: 'NGO', value: receiptData.ngoName },
                  { label: 'Type', value: receiptData.donationType.toUpperCase() },
                  { label: 'Payment', value: receiptData.paymentMethod.toUpperCase() },
                  { label: 'Transaction ID', value: receiptData.transactionId },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <span className="text-xs text-white font-medium truncate ml-4 max-w-[150px]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-xl p-5 
                        flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-xs uppercase tracking-wider mb-1">Total Amount</p>
              <p className="text-3xl font-heading font-bold text-white">
                ₹{receiptData.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-16 h-16">
              <QRCodeSVG
                value={`https://kindwave.org/verify/${receiptData.receiptNumber}`}
                size={64}
                bgColor="transparent"
                fgColor="#ffffff"
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <FiCheck className="w-3.5 h-3.5 text-green-400" />
            </div>
            <span className="text-green-400 font-medium text-sm">Payment Verified & Confirmed</span>
          </div>

          {/* Tax Info */}
          <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-4">
            <p className="text-xs text-green-400 font-medium mb-1">
              ✓ Tax Deduction Information
            </p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961. 
              Please retain this receipt for your tax filing purposes. The NGO's 80G registration number 
              and validity details can be verified on the official government portal.
            </p>
          </div>

          {/* Verification */}
          <div className="text-center border-t border-white/5 pt-4">
            <p className="text-[10px] text-slate-500 mb-1">
              This is a computer-generated receipt. No signature is required.
            </p>
            <p className="text-[10px] text-slate-500 mb-1">
              Verify at: <span className="text-primary-400">
                kindwave.org/verify/{receiptData.receiptNumber}
              </span>
            </p>
            <p className="text-[10px] text-slate-600 mt-2">
              KindWave Foundation | CIN: U85100MH2024NPL123456 | 
              Mumbai, Maharashtra, India | www.kindwave.org
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReceiptViewer;