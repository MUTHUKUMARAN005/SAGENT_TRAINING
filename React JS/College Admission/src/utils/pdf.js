const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildPdfStream = (title, lines) => {
  const safeTitle = escapePdfText(title || 'Document');
  const safeLines = (Array.isArray(lines) ? lines : [])
    .map((line) => escapePdfText(line));

  const commands = [
    'BT',
    '/F1 16 Tf',
    '50 800 Td',
    `(${safeTitle}) Tj`,
    '/F1 11 Tf',
    '0 -24 Td',
  ];

  safeLines.forEach((line) => {
    commands.push(`(${line}) Tj`);
    commands.push('0 -16 Td');
  });
  commands.push('ET');
  return `${commands.join('\n')}\n`;
};

const buildPdfDocument = (title, lines) => {
  const stream = buildPdfStream(title, lines);
  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i += 1) {
    offsets[i] = pdf.length;
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefPos = pdf.length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return pdf;
};

export const downloadTextPdf = ({ fileName, title, lines }) => {
  const pdfSource = buildPdfDocument(title, lines);
  const bytes = new TextEncoder().encode(pdfSource);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'document.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

