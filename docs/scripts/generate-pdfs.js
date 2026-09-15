/**
 * Generate PDFs for docs/*.md using pdf-lib (from server/node_modules).
 * Usage (from repo root): node docs/scripts/generate-pdfs.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(docsRoot, '..');

const require = createRequire(path.join(repoRoot, 'server', 'package.json'));
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const FILES = [
  'README.md',
  '01-ADMIN-FEATURES.md',
  '02-PLAN-ENTITLEMENTS-BLUEPRINT.md',
  '03-SUPERADMIN-PLATFORM.md',
  '04-SUBSCRIPTION-DATA-MODEL.md',
  'implementation/README.md',
  'implementation/00-IMPLEMENTATION-OVERVIEW.md',
  'implementation/01-SERVER-IMPLEMENTATION.md',
  'implementation/02-ADMIN-DASHBOARD-CONSUMPTION.md',
  'implementation/03-LANDING-PAGE-CONSUMPTION.md',
  'implementation/04-SUPERADMIN-CATALOG-OPS.md',
  'implementation/05-PHASED-CHECKLIST.md',
];

const PAGE = { width: 595.28, height: 841.89 }; // A4
const MARGIN = { top: 48, bottom: 48, left: 48, right: 48 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

function stripMd(text) {
  return String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/[→⟶]/g, '->')
    .replace(/[←⟵]/g, '<-')
    .replace(/[—–−]/g, '-')
    .replace(/[•·]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[×]/g, 'x')
    .replace(/[≤≥]/g, (m) => (m === '≤' ? '<=' : '>='))
    .replace(/[✓✔]/g, '[OK]')
    .replace(/[✗✘×]/g, '[X]')
    .replace(/[⚠]/g, '!')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '?')
    .trim();
}

function toWinAnsi(text) {
  return stripMd(String(text ?? ''));
}

function wrapText(text, font, size, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      // hard-break very long tokens
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          const trial = chunk + ch;
          if (font.widthOfTextAtSize(trial, size) > maxWidth) {
            if (chunk) lines.push(chunk);
            chunk = ch;
          } else {
            chunk = trial;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseBlocks(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push({ type: 'code', text: code.join('\n') });
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: 'hr' });
      i += 1;
      continue;
    }

    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ type: `h${h[1].length}`, text: stripMd(h[2]) });
      i += 1;
      continue;
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|?\s*-+/.test(lines[i + 1].trim())) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i]
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => stripMd(c.trim()));
        // skip separator row
        if (!cells.every((c) => /^[-:]+$/.test(c))) rows.push(cells);
        i += 1;
      }
      blocks.push({ type: 'table', rows });
      continue;
    }

    if (/^[-*]\s+/.test(line.trim()) || /^\d+\.\s+/.test(line.trim())) {
      const items = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (/^[-*]\s+/.test(t)) {
          items.push(stripMd(t.replace(/^[-*]\s+/, '')));
          i += 1;
        } else if (/^\d+\.\s+/.test(t)) {
          items.push(stripMd(t.replace(/^\d+\.\s+/, '')));
          i += 1;
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    // paragraph (merge consecutive non-empty plain lines)
    const parts = [stripMd(line.trim())];
    i += 1;
    while (i < lines.length) {
      const n = lines[i].trim();
      if (
        !n ||
        n.startsWith('#') ||
        n.startsWith('|') ||
        n.startsWith('```') ||
        n.startsWith('- ') ||
        n.startsWith('* ') ||
        /^\d+\.\s+/.test(n) ||
        /^---+$/.test(n)
      ) {
        break;
      }
      parts.push(stripMd(n));
      i += 1;
    }
    blocks.push({ type: 'p', text: parts.join(' ') });
  }
  return blocks;
}

async function mdToPdf(mdPath, pdfPath) {
  const md = fs.readFileSync(mdPath, 'utf8');
  const blocks = parseBlocks(md);

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  let page = doc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN.top;
  let pageNo = 1;

  const ink = rgb(0.12, 0.14, 0.18);
  const muted = rgb(0.4, 0.43, 0.48);
  const rule = rgb(0.82, 0.84, 0.88);

  const ensure = (need) => {
    if (y - need < MARGIN.bottom + 20) {
      page.drawText(`KABPRO Docs · ${pageNo}`, {
        x: MARGIN.left,
        y: 22,
        size: 8,
        font,
        color: muted,
      });
      page = doc.addPage([PAGE.width, PAGE.height]);
      pageNo += 1;
      y = PAGE.height - MARGIN.top;
    }
  };

  const drawLines = (lines, { size, bold = false, color = ink, gap = 3, mono = false } = {}) => {
    const f = mono ? fontMono : bold ? fontBold : font;
    for (const line of lines) {
      ensure(size + gap + 2);
      page.drawText(line, {
        x: MARGIN.left,
        y: y - size,
        size,
        font: f,
        color,
        maxWidth: CONTENT_WIDTH,
      });
      y -= size + gap;
    }
  };

  for (const block of blocks) {
    if (block.type === 'hr') {
      ensure(16);
      y -= 6;
      page.drawLine({
        start: { x: MARGIN.left, y },
        end: { x: PAGE.width - MARGIN.right, y },
        thickness: 1,
        color: rule,
      });
      y -= 10;
      continue;
    }

    if (block.type === 'h1') {
      y -= 8;
      const lines = wrapText(block.text, fontBold, 18, CONTENT_WIDTH);
      drawLines(lines, { size: 18, bold: true, gap: 4 });
      y -= 8;
      continue;
    }

    if (block.type === 'h2') {
      y -= 10;
      const lines = wrapText(block.text, fontBold, 14, CONTENT_WIDTH);
      drawLines(lines, { size: 14, bold: true, gap: 3 });
      y -= 4;
      continue;
    }

    if (block.type === 'h3') {
      y -= 6;
      const lines = wrapText(block.text, fontBold, 12, CONTENT_WIDTH);
      drawLines(lines, { size: 12, bold: true, gap: 3 });
      y -= 2;
      continue;
    }

    if (block.type === 'p') {
      const lines = wrapText(block.text, font, 10, CONTENT_WIDTH);
      drawLines(lines, { size: 10, gap: 3, color: ink });
      y -= 6;
      continue;
    }

    if (block.type === 'list') {
      for (const item of block.items) {
        const wrapped = wrapText(`- ${item}`, font, 10, CONTENT_WIDTH - 8);
        for (let li = 0; li < wrapped.length; li += 1) {
          ensure(14);
          page.drawText(wrapped[li], {
            x: MARGIN.left + (li === 0 ? 0 : 10),
            y: y - 10,
            size: 10,
            font,
            color: ink,
          });
          y -= 13;
        }
      }
      y -= 4;
      continue;
    }

    if (block.type === 'code') {
      const codeLines = block.text.split('\n');
      ensure(16 + codeLines.length * 11);
      y -= 4;
      for (const cl of codeLines) {
        ensure(12);
        const clippedRaw = cl.length > 95 ? `${cl.slice(0, 92)}...` : cl;
        const clipped = toWinAnsi(clippedRaw) || ' ';
        page.drawText(clipped, {
          x: MARGIN.left + 4,
          y: y - 9,
          size: 8,
          font: fontMono,
          color: muted,
        });
        y -= 11;
      }
      y -= 6;
      continue;
    }

    if (block.type === 'table') {
      const rows = block.rows;
      if (!rows.length) continue;
      const cols = Math.max(...rows.map((r) => r.length));
      const colW = CONTENT_WIDTH / cols;
      for (let r = 0; r < rows.length; r += 1) {
        const row = rows[r];
        // estimate height from wrapped cells
        let rowH = 14;
        const cellLines = [];
        for (let c = 0; c < cols; c += 1) {
          const cell = row[c] || '';
          const wrapped = wrapText(cell, r === 0 ? fontBold : font, 8, colW - 6);
          cellLines.push(wrapped);
          rowH = Math.max(rowH, wrapped.length * 10 + 6);
        }
        ensure(rowH + 4);
        if (r === 0) {
          page.drawRectangle({
            x: MARGIN.left,
            y: y - rowH,
            width: CONTENT_WIDTH,
            height: rowH,
            color: rgb(0.94, 0.95, 0.97),
          });
        }
        for (let c = 0; c < cols; c += 1) {
          let cy = y - 10;
          for (const ln of cellLines[c]) {
            page.drawText(ln, {
              x: MARGIN.left + c * colW + 3,
              y: cy,
              size: 8,
              font: r === 0 ? fontBold : font,
              color: ink,
            });
            cy -= 10;
          }
        }
        page.drawLine({
          start: { x: MARGIN.left, y: y - rowH },
          end: { x: PAGE.width - MARGIN.right, y: y - rowH },
          thickness: 0.5,
          color: rule,
        });
        y -= rowH;
      }
      y -= 10;
    }
  }

  page.drawText(`KABPRO Docs · ${pageNo}`, {
    x: MARGIN.left,
    y: 22,
    size: 8,
    font,
    color: muted,
  });

  const bytes = await doc.save();
  fs.writeFileSync(pdfPath, bytes);
  console.log(`Wrote ${path.relative(repoRoot, pdfPath)} (${bytes.length} bytes)`);
}

async function main() {
  for (const name of FILES) {
    const mdPath = path.join(docsRoot, name);
    if (!fs.existsSync(mdPath)) {
      console.warn(`Skip missing ${name}`);
      continue;
    }
    const pdfName = name.replace(/\.md$/i, '.pdf');
    await mdToPdf(mdPath, path.join(docsRoot, pdfName));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
