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
    const base64Data = imageInput.replace(/^data:image\/\w+;base64,/, '').trim();
    return Buffer.from(base64Data, 'base64');
  }
  throw new Error('Invalid image input: expected Buffer or base64 string');
}

/**
 * Parse OCR text output and extract ranked candidate odometer readings
 */
function parseCandidatesFromText(rawText, currentOdo = 0) {
  if (!rawText) return [];

  const lines = rawText.split('\n');
  const candidates = [];
  const seen = new Set();

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const isTripLine = /\btrip\b/i.test(trimmedLine);
    const isSpeedLine = /\bspeed\b/i.test(trimmedLine);
    const hasOdoTag = /\b(odo|total)\b/i.test(trimmedLine);
    const hasKmTag = /\bkm\b/i.test(trimmedLine);

    // Split into tokens
    const tokens = trimmedLine.split(/\s+/);

    for (const token of tokens) {
      // 1. Skip decimals (e.g. "86.4" or "12,5" -> trip meter readings)
      if (/^\d+[.,]\d+$/.test(token)) {
        continue;
      }

      // 2. Clean common 7-segment digital display misreadings
      // In digital LCDs: O/o -> 0, S/s -> 5, I/l/| -> 1, B -> 8, Z/z -> 2
      const cleaned = token
        .replace(/[^0-9OoSsIlBbZz]/g, '')
        .replace(/[Oo]/g, '0')
        .replace(/[Ss]/g, '5')
        .replace(/[Il|]/g, '1')
        .replace(/[Bb]/g, '8')
        .replace(/[Zz]/g, '2');

      // 3. Must be an integer between 3 and 7 digits (most vehicle odometers are 4-6 digits: 1,000 to 999,999)
      if (/^\d{3,7}$/.test(cleaned)) {
        const numVal = parseInt(cleaned, 10);

        // Filter out unreasonable years (2020-2030) unless close to baseline
        if (numVal >= 2020 && numVal <= 2030 && Math.abs(numVal - currentOdo) > 500) {
          continue;
        }

        if (numVal > 0 && !seen.has(numVal)) {
          seen.add(numVal);

          let score = 0;

          // Strong boost if line has ODO / TOTAL
          if (hasOdoTag) score += 60;

          // Strong boost if line has KM
          if (hasKmTag) score += 40;

          // Penalize if marked as TRIP
          if (isTripLine) score -= 40;
          if (isSpeedLine) score -= 30;

          // Odometer length scoring (5-6 digits is standard for commercial vehicles)
          if (cleaned.length >= 5 && cleaned.length <= 6) {
            score += 35;
          } else if (cleaned.length === 4) {
            score += 15;
          } else if (cleaned.length === 7) {
            score += 10;
          }

          // Proximity to known baseline vehicle odometer
          if (currentOdo > 0) {
            const diff = numVal - currentOdo;
            if (numVal >= currentOdo && diff <= 1500) {
              // Ideal: slightly higher than last recorded odo
              score += 70;
            } else if (numVal === currentOdo) {
              score += 55;
            } else if (Math.abs(diff) <= 300) {
              score += 45;
            } else if (Math.abs(diff) <= 2000) {
              score += 25;
            } else if (numVal < currentOdo && diff > -5000) {
              // Might be slightly behind due to manual typo previously
              score += 10;
            }
          }

          candidates.push({
            value: numVal,
            raw: cleaned,
            score,
            line: trimmedLine,
            hasKm: hasKmTag,
            hasOdo: hasOdoTag,
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Execute a single OCR recognition pass using Tesseract
 */
async function runTesseractPass(buffer, psm = '6') {
  try {
    const res = await Tesseract.recognize(buffer, 'eng', {
      tessedit_pageseg_mode: psm,
      tessedit_char_whitelist: '0123456789kmKM. ODOodoTRIPtripTOTALtotal ',
    });
    return res?.data?.text || '';
  } catch (err) {
    console.warn('[odometerOcrService] Pass failed:', err.message);
    return '';
  }
}

/**
 * Advanced multi-pass odometer detection
 * @param {Buffer|string} imageInput
 * @param {number} [currentOdo]
 * @returns {Promise<{ success: boolean, detected: boolean, odometer: number|null, confidence: number, candidates: Array<number>, rawText: string }>}
 */
export async function detectOdometerFromImage(imageInput, currentOdo = 0) {
  try {
    const rawBuffer = toBuffer(imageInput);
    const metadata = await sharp(rawBuffer).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1200;

    // Calculate Center Region of Interest (ROI) corresponding to the camera reticle box
    // User points the center reticle (width: 80%, height: 45%) at the odometer
    const roiW = Math.round(width * 0.85);
    const roiH = Math.round(height * 0.50);
    const roiL = Math.max(0, Math.round((width - roiW) / 2));
    const roiT = Math.max(0, Math.round((height - roiH) / 2));

    // Crop center ROI
    const centerRoiBuffer = await sharp(rawBuffer)
      .extract({ left: roiL, top: roiT, width: roiW, height: roiH })
      .resize(1200, null, { withoutEnlargement: true })
      .toBuffer();

    const allCollectedCandidates = [];
    const allRawTexts = [];

    // PASS 1: Center ROI - Inverted (White/cyan glowing numbers on dark cluster background -> Black on White)
    // Most car cockpits (Innova, Swift, Tata, Hyundai) have glowing digits on dark screen
    try {
      const pass1Buffer = await sharp(centerRoiBuffer)
        .grayscale()
        .negate({ alpha: false })
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      const text1 = await runTesseractPass(pass1Buffer, '6');
      allRawTexts.push(text1);
      allCollectedCandidates.push(...parseCandidatesFromText(text1, currentOdo));
    } catch (e) {
      console.warn('[Pass 1 Error]', e.message);
    }

    // PASS 2: Center ROI - Normal High-Contrast Grayscale (for mechanical or black-on-gray LCD meters)
    try {
      const pass2Buffer = await sharp(centerRoiBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      const text2 = await runTesseractPass(pass2Buffer, '6');
      allRawTexts.push(text2);
      allCollectedCandidates.push(...parseCandidatesFromText(text2, currentOdo));
    } catch (e) {
      console.warn('[Pass 2 Error]', e.message);
    }

    // PASS 3: Center ROI - Binarization Threshold (cleans glare, dashboard reflections & 7-segment gaps)
    try {
      const pass3Buffer = await sharp(centerRoiBuffer)
        .grayscale()
        .negate({ alpha: false })
        .threshold(140)
        .png()
        .toBuffer();

      const text3 = await runTesseractPass(pass3Buffer, '11');
      allRawTexts.push(text3);
      allCollectedCandidates.push(...parseCandidatesFromText(text3, currentOdo));
    } catch (e) {
      console.warn('[Pass 3 Error]', e.message);
    }

    // PASS 4: If no strong candidate found yet, analyze full frame
    if (allCollectedCandidates.length === 0 || allCollectedCandidates.every(c => c.score < 50)) {
      try {
        const pass4Buffer = await sharp(rawBuffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .grayscale()
          .negate({ alpha: false })
          .normalize()
          .sharpen()
          .png()
          .toBuffer();

        const text4 = await runTesseractPass(pass4Buffer, '6');
        allRawTexts.push(text4);
        allCollectedCandidates.push(...parseCandidatesFromText(text4, currentOdo));
      } catch (e) {
        console.warn('[Pass 4 Error]', e.message);
      }
    }

    // Deduplicate and aggregate scores across all passes
    const scoreMap = new Map();
    for (const cand of allCollectedCandidates) {
      const existing = scoreMap.get(cand.value);
      if (!existing) {
        scoreMap.set(cand.value, { ...cand, appearances: 1 });
      } else {
        // Boost score if recognized across multiple passes
        existing.score += cand.score + 25;
        existing.appearances += 1;
        if (cand.hasKm) existing.hasKm = true;
        if (cand.hasOdo) existing.hasOdo = true;
      }
    }

    const uniqueCandidates = Array.from(scoreMap.values());
    uniqueCandidates.sort((a, b) => b.score - a.score);

    const fullRawText = allRawTexts.join('\n');

    if (uniqueCandidates.length > 0) {
      const best = uniqueCandidates[0];
      const allNumbers = uniqueCandidates.map(c => c.value);

      return {
        success: true,
        detected: true,
        odometer: best.value,
        confidence: Math.min(99, Math.max(65, 50 + best.score / 3)),
        candidates: allNumbers.slice(0, 4), // Top 4 candidates
        allNumbers,
        rawText: fullRawText.trim(),
      };
    }

    return {
      success: true,
      detected: false,
      odometer: null,
      confidence: 0,
      candidates: [],
      allNumbers: [],
      rawText: fullRawText.trim(),
    };
  } catch (error) {
    console.error('[odometerOcrService] Detection error:', error);
    return {
      success: false,
      detected: false,
      odometer: null,
      candidates: [],
      error: error.message || 'Failed to detect odometer reading from image',
    };
  }
}
