const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const LEFT_MARGIN = 50;
const TOP_MARGIN = 780;
const LINE_HEIGHT = 14;
const MAX_CHARS_PER_LINE = 92;
const MAX_LINES_PER_PAGE = 48;

const toAscii = (value) => String(value || '').replace(/[^\x20-\x7E]/g, '?');

const escapePdfText = (value) =>
  toAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapLine = (line, maxLength = MAX_CHARS_PER_LINE) => {
  const text = toAscii(line);
  if (text.length <= maxLength) return [text];

  const words = text.split(' ');
  const wrapped = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength) {
      current = candidate;
      return;
    }
    if (current) wrapped.push(current);
    current = word;
  });

  if (current) wrapped.push(current);
  return wrapped.length ? wrapped : [''];
};

const buildContentStream = (lines) => {
  const printableLines = Array.isArray(lines) ? lines : [];
  const commands = [
    'BT',
    `/F1 11 Tf`,
    `${LEFT_MARGIN} ${TOP_MARGIN} Td`,
    `${LINE_HEIGHT} TL`,
  ];

  printableLines.forEach((line, index) => {
    const escaped = escapePdfText(line);
    if (index === 0) {
      commands.push(`(${escaped}) Tj`);
      return;
    }
    commands.push(`T* (${escaped}) Tj`);
  });

  commands.push('ET');
  return commands.join('\n');
};

const buildPdfString = (pages) => {
  const objects = [];
  const pageObjectNumbers = [];

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = ''; // pages root; populated after page objects are created.
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  let nextObjectNumber = 4;

  pages.forEach((pageLines) => {
    const pageObjectNumber = nextObjectNumber;
    const contentObjectNumber = nextObjectNumber + 1;
    nextObjectNumber += 2;
    pageObjectNumbers.push(pageObjectNumber);

    const contentStream = buildContentStream(pageLines);
    objects[contentObjectNumber] = `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`;
    objects[pageObjectNumber] = [
      '<<',
      '/Type /Page',
      '/Parent 2 0 R',
      `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
      '/Resources << /Font << /F1 3 0 R >> >>',
      `/Contents ${contentObjectNumber} 0 R`,
      '>>',
    ].join('\n');
  });

  objects[2] = `<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers
    .map((number) => `${number} 0 R`)
    .join(' ')}] >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let objectNumber = 1; objectNumber < objects.length; objectNumber += 1) {
    const objectBody = objects[objectNumber];
    if (!objectBody) continue;
    offsets[objectNumber] = pdf.length;
    pdf += `${objectNumber} 0 obj\n${objectBody}\nendobj\n`;
  }

  const maxObjectNumber = objects.length - 1;
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    const offset = offsets[objectNumber] || 0;
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadReportPdf = ({ filename, title, sections = [] }) => {
  const lines = [];
  const generatedAt = new Date().toLocaleString();

  lines.push(toAscii(title || 'Health Report'));
  lines.push(`Generated: ${toAscii(generatedAt)}`);
  lines.push('');

  sections.forEach((section) => {
    const heading = toAscii(section?.heading || '');
    if (heading) {
      lines.push(heading);
      lines.push('-'.repeat(Math.min(heading.length, 30)));
    }

    const contentLines = Array.isArray(section?.lines) ? section.lines : [];
    contentLines.forEach((line) => {
      wrapLine(line).forEach((wrappedLine) => lines.push(wrappedLine));
    });
    lines.push('');
  });

  const pages = [];
  for (let index = 0; index < lines.length; index += MAX_LINES_PER_PAGE) {
    pages.push(lines.slice(index, index + MAX_LINES_PER_PAGE));
  }
  if (!pages.length) pages.push(['Empty report']);

  const pdfString = buildPdfString(pages);
  const bytes = new Uint8Array(pdfString.length);
  for (let index = 0; index < pdfString.length; index += 1) {
    bytes[index] = pdfString.charCodeAt(index) & 0xff;
  }

  const blob = new Blob([bytes], { type: 'application/pdf' });
  downloadBlob(blob, filename || 'report.pdf');
};
