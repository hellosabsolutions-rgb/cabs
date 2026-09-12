import sharp from 'sharp';
import Tesseract from 'tesseract.js';

/**
 * Clean base64 data and return a Buffer
 */
function toBuffer(imageInput) {
  if (Buffer.isBuffer(imageInput)) {
    return imageInput;
  }
  if (typeof imageInput === 'string') {
    // Remove data URI prefix if present
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '').trim();
    return Buffer.from(base64Data, 'base64');
  }
  throw new Error('Invalid image input: expected Buffer or base64 string');
}

/**
 * Extract candidate odometer numbers from OCR text and rank them
 */
function extractOdometerCandidates(rawText, currentOdo = 0) {
  if (!rawText) return [];

  // Look for patterns like "45470 km", "ODO 45470", "45470", "045470"
  // Match groups of 3 to 7 digits
  const digitRegex = /\b(\d{3,7})\b/g;
  const matches = [...rawText.matchAll(digitRegex)];

  const candidates = [];
  const seen = new Set();

  for (const match of matches) {
    const numStr = match[1];
    const numVal = parseInt(numStr, 10);

    // Filter out unlikely years (e.g. 2024, 2025, 2026) if currentOdo is far different
    if (numVal >= 2020 && numVal <= 2030 && Math.abs(numVal - currentOdo) > 500) {
      continue;
    }

    if (numVal > 0 && !seen.has(numVal)) {
      seen.add(numVal);

      // Check proximity to "km" in text
      const matchIndex = match.index || 0;
      const contextAround = rawText.slice(Math.max(0, matchIndex - 15), Math.min(rawText.length, matchIndex + numStr.length + 15)).toLowerCase();
      const hasKm = contextAround.includes('km');
      const hasOdo = contextAround.includes('odo');

      let score = 0;
      if (hasKm) score += 40;
      if (hasOdo) score += 30;

      // Bonus if digit length is typical for odometers (5-6 digits: 10,000 to 999,999)
      if (numStr.length >= 5 && numStr.length <= 6) {
        score += 25;
      } else if (numStr.length === 4) {
        score += 10;
      }

      // Proximity to current vehicle odometer (if provided)
      if (currentOdo > 0) {
        if (numVal >= currentOdo && numVal <= currentOdo + 1500) {
          // Excellent: slightly higher than current odo
          score += 50;
        } else if (numVal === currentOdo) {
          score += 45;
        } else if (Math.abs(numVal - currentOdo) <= 500) {
          score += 30;
        }
      }

      candidates.push({
        value: numVal,
        score,
        hasKm,
        hasOdo,
        raw: numStr,
      });
    }
  }

  // Sort descending by score
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Detect odometer integers from photo
 * @param {Buffer|string} imageInput
 * @param {number} [currentOdo]
 * @returns {Promise<{ success: boolean, detected: boolean, odometer: number|null, rawText: string, candidates: Array }>}
 */
export async function detectOdometerFromImage(imageInput, currentOdo = 0) {
  try {
    const rawBuffer = toBuffer(imageInput);

    // Pre-processing with Sharp:
    // 1. Resize to optimal dimension (max 1400px width/height)
    // 2. Convert to grayscale
    // 3. Normalize contrast
    // 4. Sharpen edges
    const processedBuffer = await sharp(rawBuffer)
      .resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();

    // Primary Pass: OCR with digit whitelist
    const { data: { text, confidence } } = await Tesseract.recognize(processedBuffer, 'eng', {
      tessedit_char_whitelist: '0123456789kmKM. ODOodo '
    });

    let candidates = extractOdometerCandidates(text, currentOdo);

    // If no candidate found in pass 1, try inverted high-contrast pass (for dark dashboard screens)
    if (candidates.length === 0) {
      const invertedBuffer = await sharp(processedBuffer)
        .negate({ alpha: false })
        .threshold(128)
        .png()
        .toBuffer();

      const pass2 = await Tesseract.recognize(invertedBuffer, 'eng', {
        tessedit_char_whitelist: '0123456789kmKM. ODOodo '
      });

      candidates = extractOdometerCandidates(pass2.data.text, currentOdo);
    }

    if (candidates.length > 0) {
      const best = candidates[0];
      return {
        success: true,
        detected: true,
        odometer: best.value,
        confidence: confidence || 85,
        allNumbers: candidates.map(c => c.value),
        rawText: text.trim(),
      };
    }

    return {
      success: true,
      detected: false,
      odometer: null,
      confidence: 0,
      allNumbers: [],
      rawText: text.trim(),
    };
  } catch (error) {
    console.error('[odometerOcrService] Detection error:', error);
    return {
      success: false,
      detected: false,
      odometer: null,
      error: error.message || 'Failed to detect odometer from image',
    };
  }
}
