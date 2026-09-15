import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { broadcastAll } from '../services/socketService.js';
import { getAgencyId, stampAgencyId, withAgencyFilter } from '../utils/tenantQuery.js';
import { processMediaFields } from '../utils/mediaUploadHelper.js';

function serializeCrudDoc(doc) {
  if (!doc) return null;
  const json = typeof doc.toJSON === 'function' ? doc.toJSON() : { ...(doc.toObject?.() || doc) };
  json.id = json.id || json._id?.toString();
  return json;
}

function emitCrudSocket(socketPrefix, action, payload) {
  if (!socketPrefix) return;
  try {
    broadcastAll(`${socketPrefix}:${action}`, payload);
  } catch (err) {
    console.warn(`Socket emit ${socketPrefix}:${action} failed:`, err.message);
  }
}

function tenantQuery(req, baseFilter, options) {
  if (options.tenantScoped === false) return baseFilter;
  return withAgencyFilter(req, baseFilter);
}

function tenantIdQuery(req, id, options) {
  const base = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
  return tenantQuery(req, base, options);
}

/**
 * Creates standard high-performance CRUD handlers for a Mongoose Model
 * Features: Pagination, lean queries, search, filtering, field projection, sorting, agency scoping
 */
export const createCrudController = (Model, searchFields = [], options = {}) => {
  const socketPrefix = options.socketPrefix || null;
  const tenantScoped = options.tenantScoped !== false;
  const mediaFields = options.mediaFields || [];

  return {
    getAll: asyncHandler(async (req, res) => {
      let queryObj = { ...req.query };

      const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'agencyId'];
      excludedFields.forEach(el => delete queryObj[el]);

      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, match => `$${match}`);
      let mongoFilter = JSON.parse(queryStr);

      if (req.query.search && searchFields.length > 0) {
        const searchRegex = new RegExp(req.query.search, 'i');
        mongoFilter.$or = searchFields.map(field => ({ [field]: searchRegex }));
      }

      mongoFilter = tenantScoped ? withAgencyFilter(req, mongoFilter) : mongoFilter;

      let query = Model.find(mongoFilter);

      if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
      }

      if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
      } else {
        query = query.sort('-createdAt');
      }

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const skip = (page - 1) * limit;

      const total = await Model.countDocuments(mongoFilter);
      const docs = await query.skip(skip).limit(limit).lean();

      const data = docs.map(doc => ({
        ...doc,
        id: doc._id.toString()
      }));

      res.status(200).json({
        success: true,
        count: data.length,
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        data
      });
    }),

    getById: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const query = tenantIdQuery(req, id, { tenantScoped });
      const doc = await Model.findOne(query).lean();

      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Resource not found with ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        data: {
          ...doc,
          id: doc._id.toString()
        }
      });
    }),

    create: asyncHandler(async (req, res) => {
      let payload = tenantScoped ? stampAgencyId(req, req.body) : { ...req.body };
      if (mediaFields.length) {
        payload = await processMediaFields(payload, mediaFields);
      }
      const doc = await Model.create(payload);
      const serialized = serializeCrudDoc(doc);
      emitCrudSocket(socketPrefix, 'created', { action: 'created', log: serialized, data: serialized });
      res.status(201).json({
        success: true,
        data: doc
      });
    }),

    update: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const query = tenantIdQuery(req, id, { tenantScoped });
      const { agencyId: _drop, ...body } = req.body;
      const payload = mediaFields.length ? await processMediaFields(body, mediaFields) : body;

      const doc = await Model.findOneAndUpdate(query, payload, {
        new: true,
        runValidators: true
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Resource not found with ID ${id}`
        });
      }

      const serialized = serializeCrudDoc(doc);
      emitCrudSocket(socketPrefix, 'updated', { action: 'updated', log: serialized, data: serialized });
      res.status(200).json({
        success: true,
        data: doc
      });
    }),

    delete: asyncHandler(async (req, res) => {
      const { id } = req.params;
      const query = tenantIdQuery(req, id, { tenantScoped });

      const doc = await Model.findOneAndDelete(query);

      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Resource not found with ID ${id}`
        });
      }

      emitCrudSocket(socketPrefix, 'deleted', { action: 'deleted', id: doc._id.toString() });
      res.status(200).json({
        success: true,
        message: 'Resource deleted successfully',
        data: {}
      });
    })
  };
};
