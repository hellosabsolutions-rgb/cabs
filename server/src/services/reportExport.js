import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';

function flattenRows(rows) {
  return (rows || []).map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      if (v == null) out[k] = '';
      else if (typeof v === 'object') out[k] = JSON.stringify(v);
      else out[k] = v;
    }
    return out;
  });
}

export async function buildPdfReport({ title, rows, columns }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([842, 595]); // landscape A4
  const { width, height } = page.getSize();
  let y = height - 40;

  page.drawText(title || 'KABPRO Report', {
    x: 40,
    y,
    size: 16,
    font: bold,
    color: rgb(0.09, 0.53, 0.96)
  });
  y -= 18;
  page.drawText(`Generated ${new Date().toLocaleString('en-IN')}`, {
    x: 40,
    y,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });
  y -= 24;

  const cols = columns?.length
    ? columns
    : Object.keys(rows[0] || { Note: '' }).map((k) => ({ key: k, label: k }));

  const colW = (width - 80) / Math.max(cols.length, 1);

  const drawHeader = () => {
    cols.forEach((c, i) => {
      page.drawText(String(c.label).slice(0, 28), {
        x: 40 + i * colW,
        y,
        size: 9,
        font: bold,
        color: rgb(0.2, 0.2, 0.2)
      });
    });
    y -= 14;
  };

  drawHeader();

  for (const row of rows) {
    if (y < 40) {
      page = pdf.addPage([842, 595]);
      y = height - 40;
      drawHeader();
    }
    cols.forEach((c, i) => {
      const val = String(row[c.key] ?? '').slice(0, 32);
      page.drawText(val, {
        x: 40 + i * colW,
        y,
        size: 8,
        font,
        color: rgb(0.15, 0.15, 0.15)
      });
    });
    y -= 12;
  }

  return Buffer.from(await pdf.save());
}

export function buildXlsxReport({ title, rows }) {
  const data = flattenRows(rows);
  const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ Note: 'No rows' }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (title || 'Report').slice(0, 31));
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/** Word-openable HTML document (.doc) */
export function buildDocReport({ title, rows, columns }) {
  const cols = columns?.length
    ? columns
    : Object.keys(rows[0] || { Note: '' }).map((k) => ({ key: k, label: k }));

  const head = cols.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const body = (rows.length ? rows : [{ Note: 'No rows' }])
    .map((row) => {
      const tds = cols
        .map((c) => `<td>${escapeHtml(String(row[c.key] ?? ''))}</td>`)
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#111}
  h1{font-size:18px;color:#1687f5}
  table{border-collapse:collapse;width:100%}
  th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
  th{background:#eef6ff}
</style></head><body>
<h1>${escapeHtml(title || 'KABPRO Report')}</h1>
<p>Generated ${new Date().toLocaleString('en-IN')}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;

  return Buffer.from(html, 'utf8');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
