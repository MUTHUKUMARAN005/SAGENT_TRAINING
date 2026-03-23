// src/utils/receiptGenerator.js
import jsPDF from 'jspdf';

export const generateReceiptPDF = (donationData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Colors
  const primaryColor = [59, 130, 246];
  const darkColor = [15, 23, 42];
  const grayColor = [148, 163, 184];
  const greenColor = [34, 197, 94];
  const whiteColor = [255, 255, 255];

  // Background
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header gradient bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Logo area
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, 15, contentWidth, 35, 3, 3, 'F');

  // Logo text
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  doc.text('KindWave', margin + 10, 32);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text('Transparent Donation Platform', margin + 10, 40);

  // Receipt badge
  doc.setFillColor(...greenColor);
  doc.roundedRect(pageWidth - margin - 50, 22, 50, 20, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...whiteColor);
  doc.text('TAX RECEIPT', pageWidth - margin - 44, 31);
  doc.setFontSize(7);
  doc.text('80G Eligible', pageWidth - margin - 41, 37);

  // Divider
  let yPos = 58;
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Title
  yPos += 12;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  doc.text('Donation Receipt', pageWidth / 2, yPos, { align: 'center' });

  // Receipt number
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryColor);
  doc.text(`Receipt No: ${donationData.receiptNumber}`, pageWidth / 2, yPos, { align: 'center' });

  // Date
  yPos += 6;
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.text(`Date: ${donationData.date}`, pageWidth / 2, yPos, { align: 'center' });

  // Divider
  yPos += 8;
  doc.setDrawColor(51, 65, 85);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Donor Details Section
  yPos += 12;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, yPos, contentWidth, 40, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DONOR DETAILS', margin + 8, yPos + 10);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);

  const donorDetails = [
    ['Name:', donationData.donorName || 'Anonymous'],
    ['Email:', donationData.donorEmail || 'N/A'],
    ['Phone:', donationData.donorPhone || 'N/A'],
    ['PAN:', donationData.donorPAN || 'N/A'],
  ];

  let detailY = yPos + 18;
  donorDetails.forEach(([label, value]) => {
    doc.setTextColor(...grayColor);
    doc.text(label, margin + 8, detailY);
    doc.setTextColor(...whiteColor);
    doc.text(value, margin + 35, detailY);
    detailY += 6;
  });

  // Donation Details Section
  yPos += 50;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, yPos, contentWidth, 55, 3, 3, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('DONATION DETAILS', margin + 8, yPos + 10);

  const donationDetails = [
    ['Campaign:', donationData.campaignTitle || 'General Donation'],
    ['NGO:', donationData.ngoName || 'KindWave'],
    ['Donation Type:', (donationData.donationType || 'money').toUpperCase()],
    ['Payment Method:', (donationData.paymentMethod || 'UPI').toUpperCase()],
    ['Transaction ID:', donationData.transactionId || 'N/A'],
  ];

  detailY = yPos + 18;
  doc.setFontSize(9);
  donationDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(label, margin + 8, detailY);
    doc.setTextColor(...whiteColor);
    const maxWidth = contentWidth - 65;
    const text = doc.splitTextToSize(value, maxWidth);
    doc.text(text, margin + 55, detailY);
    detailY += 7;
  });

  // Amount Box
  yPos += 65;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, yPos, contentWidth, 25, 3, 3, 'F');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...whiteColor);
  doc.text('TOTAL AMOUNT', margin + 10, yPos + 11);

  doc.setFontSize(20);
  doc.text(
    `₹ ${Number(donationData.amount || 0).toLocaleString('en-IN')}`,
    pageWidth - margin - 10,
    yPos + 16,
    { align: 'right' }
  );

  // Amount in words
  yPos += 30;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...grayColor);
  doc.text(
    `Amount in words: ${numberToWords(donationData.amount || 0)} Rupees Only`,
    margin,
    yPos
  );

  // Divider
  yPos += 8;
  doc.setDrawColor(51, 65, 85);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Tax Information
  yPos += 10;
  doc.setFillColor(34, 197, 94, 20);
  doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...greenColor);
  doc.text('✓ TAX DEDUCTION INFORMATION', margin + 8, yPos + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text(
    'This donation is eligible for tax deduction under Section 80G of the Income Tax Act, 1961.',
    margin + 8,
    yPos + 14
  );

  // QR Code placeholder area
  yPos += 28;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 35, yPos, 35, 35, 3, 3, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text('SCAN TO', pageWidth - margin - 29, yPos + 14);
  doc.text('VERIFY', pageWidth - margin - 28, yPos + 19);

  // Verification notice
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text('This is a computer-generated receipt.', margin, yPos + 10);
  doc.text('No signature is required.', margin, yPos + 15);
  doc.text(`Verification URL: kindwave.org/verify/${donationData.receiptNumber}`, margin, yPos + 22);

  // Footer
  yPos = pageHeight - 25;
  doc.setDrawColor(51, 65, 85);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  yPos += 6;
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text('KindWave Foundation | CIN: U85100MH2024NPL123456', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Registered Office: Mumbai, Maharashtra, India | www.kindwave.org', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Email: receipts@kindwave.org | Phone: +91 98765 43210', pageWidth / 2, yPos, { align: 'center' });

  // Bottom gradient bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

  return doc;
};

export const downloadReceipt = (donationData) => {
  const doc = generateReceiptPDF(donationData);
  doc.save(`KindWave_Receipt_${donationData.receiptNumber}.pdf`);
};

export const getReceiptBlob = (donationData) => {
  const doc = generateReceiptPDF(donationData);
  return doc.output('blob');
};

export const openReceiptInNewTab = (donationData) => {
  const doc = generateReceiptPDF(donationData);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

// Number to words converter
function numberToWords(num) {
  if (num === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
  }

  if (num < 1000) return convertLessThanThousand(num);
  if (num < 100000) {
    return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' +
      (num % 1000 ? ' ' + convertLessThanThousand(num % 1000) : '');
  }
  if (num < 10000000) {
    return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' +
      (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  }
  return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' +
    (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

export { numberToWords };
