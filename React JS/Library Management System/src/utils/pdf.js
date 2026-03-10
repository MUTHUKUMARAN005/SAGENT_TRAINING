const escapeHtml = (value) => {
  const safe = String(value ?? '');
  return safe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
};

export const printTableAsPdf = ({ title, subtitle, columns, rows }) => {
  const popup = window.open('', '_blank', 'width=1024,height=800');
  if (!popup) throw new Error('Popup blocked. Please allow popups to generate PDF.');

  const headerHtml = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const rowHtml = rows.length
    ? rows.map((row) => (
      `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`
    )).join('')
    : `<tr><td colspan="${columns.length}" style="text-align:center;color:#64748b;">No data available</td></tr>`;

  const generatedAt = new Date().toLocaleString();
  popup.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          p { margin: 0 0 14px; color: #334155; }
          table { border-collapse: collapse; width: 100%; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #e2e8f0; font-weight: 700; }
          .meta { margin-top: 14px; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle || '')}</p>
        <table>
          <thead><tr>${headerHtml}</tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
        <p class="meta">Generated at: ${escapeHtml(generatedAt)}</p>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 350);
};

export const printIssueReceipt = (record) => {
  const columns = ['Field', 'Value'];
  const rows = [
    ['Receipt ID', record.recordId || 'N/A'],
    ['Student', record.member?.name || record.memberName || 'N/A'],
    ['Student ID', record.member?.memberId || record.memberId || 'N/A'],
    ['Book', record.bookTitle || 'N/A'],
    ['Issue Date', record.borrowDate || 'N/A'],
    ['Due Date', record.dueDate || 'N/A'],
    ['Return Date', record.returnDate || 'Pending'],
    ['Status', record.status || 'N/A'],
    ['Fine Amount', `$${Number(record.fineAmount || 0).toFixed(2)}`],
  ];

  printTableAsPdf({
    title: 'Issue Receipt',
    subtitle: 'Library Management Issue/Return Receipt',
    columns,
    rows
  });
};
