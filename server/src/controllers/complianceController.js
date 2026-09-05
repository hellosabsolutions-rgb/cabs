import { Compliance } from '../models/Compliance.js';
import { Vehicle } from '../models/Vehicle.js';
import { Driver } from '../models/Driver.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';

/**
 * Standard dynamic date calculation for compliance document expiry
 */
export const calculateExpiryMeta = (expiryDateStr, fallbackDaysLeft, fallbackLabel, fallbackStatus) => {
  if (expiryDateStr) {
    const expDate = new Date(expiryDateStr);
    if (!isNaN(expDate.getTime())) {
      const now = new Date();
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);
        const label = daysAgo === 1 
          ? 'Expired 1 day ago' 
          : daysAgo <= 45 
            ? `Expired ${daysAgo} days ago` 
            : `Expired ${Math.round(daysAgo / 30)} months ago`;
        return {
          statusType: 'late',
          daysLeft: diffDays,
          expiryLabel: label
        };
      } else if (diffDays <= 30) {
        const label = diffDays === 0 
          ? 'Expires today' 
          : diffDays === 1 
            ? 'In 1 day' 
            : `In ${diffDays} days`;
        return {
          statusType: 'soon',
          daysLeft: diffDays,
          expiryLabel: label
        };
      } else {
        const months = Math.round(diffDays / 30);
        const label = diffDays >= 365 
          ? `Valid · ${Math.round(diffDays / 365)} years` 
          : `Valid · ${months} months`;
        return {
          statusType: 'ok',
          daysLeft: diffDays,
          expiryLabel: label
        };
      }
    }
  }

  // Fallback when daysLeft is provided (e.g. from seed data)
  if (typeof fallbackDaysLeft === 'number' && !isNaN(fallbackDaysLeft)) {
    if (fallbackDaysLeft < 0) {
      const daysAgo = Math.abs(fallbackDaysLeft);
      return {
        statusType: 'late',
        daysLeft: fallbackDaysLeft,
        expiryLabel: fallbackLabel || `Expired ${daysAgo} days ago`
      };
    } else if (fallbackDaysLeft <= 30) {
      return {
        statusType: 'soon',
        daysLeft: fallbackDaysLeft,
        expiryLabel: fallbackLabel || `In ${fallbackDaysLeft} days`
      };
    } else {
      return {
        statusType: 'ok',
        daysLeft: fallbackDaysLeft,
        expiryLabel: fallbackLabel || 'Valid'
      };
    }
  }

  // Fallback when label is descriptive
  if (fallbackLabel && fallbackLabel.trim()) {
    const l = fallbackLabel.toLowerCase();
    const st = l.includes('expired') || l.includes('late')
      ? 'late'
      : (l.includes('in ') || l.includes('soon') ? 'soon' : (fallbackStatus || 'ok'));
    return {
      statusType: st,
      daysLeft: st === 'late' ? -3 : (st === 'soon' ? 12 : 365),
      expiryLabel: fallbackLabel
    };
  }

  return {
    statusType: fallbackStatus || 'ok',
    daysLeft: 365,
    expiryLabel: 'Valid'
  };
};

/**
 * Standardize document names for clean display
 */
const normalizeDocName = (rawName) => {
  const n = (rawName || '').trim().toLowerCase();
  if (n.includes('rc') || n.includes('registration certificate')) return 'RC';
  if (n.includes('insurance')) return 'Insurance';
  if (n.includes('puc') || n.includes('pollution')) return 'PUC';
  if (n.includes('auth') || n.includes('permit authorization')) return 'Auth';
  if (n.includes('national permit')) return 'National permit';
  if (n.includes('state permit')) return 'State permit';
  if (n.includes('permit')) return 'Permit';
  if (n.includes('fitness')) return 'Fitness';
  if (n.includes('road tax') || n.includes('tax')) return 'Road tax';
  if (n.includes('licence') || n.includes('license') || n.includes('dl')) return 'Driving licence';
  if (n.includes('police')) return 'Police verification';
  if (n.includes('medical')) return 'Medical record';
  if (n.includes('id proof') || n.includes('aadhaar')) return 'ID proof';
  if (n.includes('joining')) return 'Joining date';
  return rawName;
};

/**
 * Sync compliance collection with documents submitted during vehicle & driver onboarding
 */
const syncOnboardedDocuments = async () => {
  try {
    // 1. Check all vehicles in database
    const vehicles = await Vehicle.find({}).lean();
    for (const v of vehicles) {
      const reg = v.registrationNumber;
      if (!reg) continue;

      const vehicleDocs = [
        { name: 'RC', exp: v.rcExpiry, photo: v.rcPhoto },
        { name: 'Insurance', exp: v.insuranceExpiry, photo: v.insurancePhoto },
        { name: 'PUC', exp: v.pollutionExpiry || v.puccExpiry, photo: v.pollutionPhoto },
        { name: 'Permit', exp: v.permitExpiry, photo: v.permitPhoto },
        { name: 'Auth', exp: v.authExpiry, photo: v.authPhoto },
        { name: 'Fitness', exp: v.fitnessExpiry, photo: null },
        { name: 'Road tax', exp: v.roadTaxExpiry, photo: null }
      ];

      for (const doc of vehicleDocs) {
        if (!doc.exp && !doc.photo) continue;

        const existing = await Compliance.findOne({
          entityName: reg,
          entityType: 'Vehicle',
          $or: [
            { documentName: doc.name },
            { documentName: normalizeDocName(doc.name) }
          ]
        });

        const meta = calculateExpiryMeta(doc.exp);

        if (!existing) {
          await Compliance.create({
            entityName: reg,
            entityType: 'Vehicle',
            documentName: doc.name,
            expiryDate: doc.exp || '',
            documentPhoto: doc.photo || null,
            expiryLabel: meta.expiryLabel,
            statusType: meta.statusType,
            daysLeft: meta.daysLeft,
            notes: `Auto-synced from vehicle onboarding record (${reg})`
          });
        } else {
          // Update photo or expiry if newer
          let needsUpdate = false;
          if (doc.exp && existing.expiryDate !== doc.exp) {
            existing.expiryDate = doc.exp;
            existing.expiryLabel = meta.expiryLabel;
            existing.statusType = meta.statusType;
            existing.daysLeft = meta.daysLeft;
            needsUpdate = true;
          }
          if (doc.photo && !existing.documentPhoto) {
            existing.documentPhoto = doc.photo;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await existing.save();
          }
        }
      }
    }

    // 2. Check all drivers in database
    const drivers = await Driver.find({}).lean();
    for (const d of drivers) {
      if (!d.name) continue;

      if (d.licenseNumber || d.licensePhoto || d.licenseExpiry) {
        const existing = await Compliance.findOne({
          entityName: d.name,
          entityType: 'Driver',
          $or: [
            { documentName: 'Driving licence' },
            { documentName: 'Driving Licence (DL)' }
          ]
        });

        const expDateStr = d.licenseExpiry || (existing?.expiryDate ? existing.expiryDate : (() => {
          // default 3 years from joining or now
          const date = new Date(d.joiningDate || new Date());
          date.setFullYear(date.getFullYear() + 3);
          return date.toISOString().split('T')[0];
        })());

        const meta = calculateExpiryMeta(expDateStr);

        if (!existing) {
          await Compliance.create({
            entityName: d.name,
            entityType: 'Driver',
            documentName: 'Driving licence',
            documentNumber: d.licenseNumber || undefined,
            expiryDate: expDateStr,
            documentPhoto: d.licensePhoto || null,
            expiryLabel: meta.expiryLabel,
            statusType: meta.statusType,
            daysLeft: meta.daysLeft,
            notes: `Auto-synced from driver onboarding record (${d.name})`
          });
        } else {
          let needsUpdate = false;
          if (d.licenseNumber && existing.documentNumber !== d.licenseNumber) {
            existing.documentNumber = d.licenseNumber;
            needsUpdate = true;
          }
          if (d.licensePhoto && !existing.documentPhoto) {
            existing.documentPhoto = d.licensePhoto;
            needsUpdate = true;
          }
          if (d.licenseExpiry && existing.expiryDate !== d.licenseExpiry) {
            existing.expiryDate = d.licenseExpiry;
            existing.expiryLabel = meta.expiryLabel;
            existing.statusType = meta.statusType;
            existing.daysLeft = meta.daysLeft;
            needsUpdate = true;
          }
          if (needsUpdate) {
            await existing.save();
          }
        }
      }
    }
  } catch (err) {
    console.warn('Compliance auto-sync notice:', err.message);
  }
};

/**
 * @desc    Get all compliance documents with dynamically computed expiry & daysLeft
 * @route   GET /api/compliance
 * @access  Public / Private
 */
export const getComplianceDocs = asyncHandler(async (req, res) => {
  const { entityType, entityName, statusType, search } = req.query;

  // Auto-sync onboarded documents so newly added vehicles/drivers always appear
  await syncOnboardedDocuments();

  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (entityName) filter.entityName = new RegExp(entityName.trim(), 'i');
  if (statusType && statusType !== 'all') filter.statusType = statusType;

  if (search && search.trim()) {
    const reg = new RegExp(search.trim(), 'i');
    filter.$or = [
      { entityName: reg },
      { documentName: reg },
      { documentNumber: reg },
      { issuingAuthority: reg }
    ];
  }

  const rawDocs = await Compliance.find(filter).lean();

  // Dynamically recalculate live expiry status
  const docs = rawDocs.map(doc => {
    const meta = calculateExpiryMeta(doc.expiryDate, doc.daysLeft, doc.expiryLabel, doc.statusType);
    return {
      ...doc,
      id: doc._id.toString(),
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    };
  });

  // Sort by urgency: 'late' (expired) first, then 'soon', then 'ok'
  const priority = { late: 0, soon: 1, ok: 2 };
  docs.sort((a, b) => {
    const pA = priority[a.statusType] ?? 2;
    const pB = priority[b.statusType] ?? 2;
    if (pA !== pB) return pA - pB;
    return (a.daysLeft || 0) - (b.daysLeft || 0);
  });

  res.status(200).json({
    success: true,
    count: docs.length,
    data: docs
  });
});

/**
 * @desc    Get real-time compliance expiry summary, alerts, and vehicle/driver breakdowns
 * @route   GET /api/compliance/expiry
 * @access  Public / Private
 */
export const getComplianceExpiry = asyncHandler(async (req, res) => {
  // Sync any onboarded vehicle/driver documents first
  await syncOnboardedDocuments();

  const rawDocs = await Compliance.find({}).lean();

  const vehicleDocs = [];
  const driverDocs = [];
  const alerts = [];

  let expiringSoonCount = 0;
  let expiredCount = 0;
  let driverDueCount = 0;

  // Sort and process documents
  rawDocs.forEach(rawDoc => {
    const meta = calculateExpiryMeta(rawDoc.expiryDate, rawDoc.daysLeft, rawDoc.expiryLabel, rawDoc.statusType);
    const doc = {
      ...rawDoc,
      id: rawDoc._id.toString(),
      expiryLabel: meta.expiryLabel,
      statusType: meta.statusType,
      daysLeft: meta.daysLeft
    };

    if (doc.statusType === 'late') {
      expiredCount++;
      alerts.push({
        who: doc.entityName,
        doc: doc.documentName,
        type: 'late',
        text: doc.expiryLabel,
        entityType: doc.entityType,
        expiryDate: doc.expiryDate,
        documentPhoto: doc.documentPhoto || null
      });
      if (doc.entityType === 'Driver') driverDueCount++;
    } else if (doc.statusType === 'soon') {
      expiringSoonCount++;
      alerts.push({
        who: doc.entityName,
        doc: doc.documentName,
        type: 'soon',
        text: doc.expiryLabel,
        entityType: doc.entityType,
        expiryDate: doc.expiryDate,
        documentPhoto: doc.documentPhoto || null
      });
      if (doc.entityType === 'Driver') driverDueCount++;
    }

    if (doc.entityType === 'Vehicle') {
      vehicleDocs.push(doc);
    } else {
      driverDocs.push(doc);
    }
  });

  // Sort alerts: expired first, then soonest expiring
  alerts.sort((a, b) => (a.type === 'late' ? -1 : 1));

  // Sort vehicle docs & driver docs by urgency
  const sortByUrgency = (list) => {
    const priority = { late: 0, soon: 1, ok: 2 };
    return list.sort((a, b) => {
      const pA = priority[a.statusType] ?? 2;
      const pB = priority[b.statusType] ?? 2;
      if (pA !== pB) return pA - pB;
      return (a.daysLeft || 0) - (b.daysLeft || 0);
    });
  };

  res.status(200).json({
    success: true,
    data: {
      stats: {
        expiringSoonCount,
        expiredCount,
        driverDueCount,
        totalDocsCount: rawDocs.length,
        alerts
      },
      vehicleDocs: sortByUrgency(vehicleDocs),
      driverDocs: sortByUrgency(driverDocs)
    }
  });
});

/**
 * @desc    Create a new compliance document
 * @route   POST /api/compliance
 * @access  Public / Private
 */
export const createComplianceDoc = asyncHandler(async (req, res) => {
  const {
    entityName,
    entityType,
    documentName,
    documentNumber,
    issueDate,
    expiryDate,
    issuingAuthority,
    documentPhoto,
    notes
  } = req.body;

  if (!entityName || !entityName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Vehicle registration number or driver name is required.'
    });
  }

  if (!entityType || !['Vehicle', 'Driver'].includes(entityType)) {
    return res.status(400).json({
      success: false,
      error: "Entity type must be 'Vehicle' or 'Driver'."
    });
  }

  if (!documentName || !documentName.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Document name (e.g. RC, Insurance, PUC, Driving licence) is required.'
    });
  }

  const meta = calculateExpiryMeta(expiryDate);

  const newDoc = await Compliance.create({
    entityName: entityName.trim(),
    entityType,
    documentName: documentName.trim(),
    documentNumber: documentNumber ? documentNumber.trim() : undefined,
    issueDate: issueDate || undefined,
    expiryDate: expiryDate || '',
    issuingAuthority: issuingAuthority ? issuingAuthority.trim() : undefined,
    documentPhoto: documentPhoto || null,
    notes: notes ? notes.trim() : undefined,
    expiryLabel: meta.expiryLabel,
    statusType: meta.statusType,
    daysLeft: meta.daysLeft
  });

  const obj = newDoc.toObject();
  obj.id = obj._id.toString();

  res.status(201).json({
    success: true,
    message: `${documentName} compliance recorded for ${entityName}.`,
    data: obj
  });
});

/**
 * @desc    Update a compliance document
 * @route   PUT /api/compliance/:id
 * @access  Public / Private
 */
export const updateComplianceDoc = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let doc = await Compliance.findById(id);
  if (!doc) {
    return res.status(404).json({
      success: false,
      error: `Compliance document not found with ID '${id}'.`
    });
  }

  const allowed = [
    'entityName',
    'entityType',
    'documentName',
    'documentNumber',
    'issueDate',
    'expiryDate',
    'issuingAuthority',
    'documentPhoto',
    'notes'
  ];

  allowed.forEach(field => {
    if (req.body[field] !== undefined) {
      doc[field] = req.body[field];
    }
  });

  if (req.body.expiryDate !== undefined) {
    const meta = calculateExpiryMeta(req.body.expiryDate);
    doc.expiryLabel = meta.expiryLabel;
    doc.statusType = meta.statusType;
    doc.daysLeft = meta.daysLeft;
  }

  await doc.save();

  const obj = doc.toObject();
  obj.id = obj._id.toString();

  res.status(200).json({
    success: true,
    message: `${doc.documentName} updated successfully.`,
    data: obj
  });
});

/**
 * @desc    Delete a compliance document
 * @route   DELETE /api/compliance/:id
 * @access  Public / Private
 */
export const deleteComplianceDoc = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doc = await Compliance.findByIdAndDelete(id);
  if (!doc) {
    return res.status(404).json({
      success: false,
      error: `Compliance document not found with ID '${id}'.`
    });
  }

  res.status(200).json({
    success: true,
    message: `${doc.documentName} for ${doc.entityName} deleted successfully.`
  });
});
