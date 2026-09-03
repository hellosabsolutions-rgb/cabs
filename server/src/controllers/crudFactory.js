import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Creates standard high-performance CRUD handlers for a Mongoose Model
 * Features: Pagination, lean queries, search, filtering, field projection, and sorting
 */
export const createCrudController = (Model, searchFields = []) => {
  return {
    // GET ALL with search, filter, sort, pagination, lean
    getAll: asyncHandler(async (req, res) => {
      let queryObj = { ...req.query };

      // Exclude special query parameters from direct filter
      const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
      excludedFields.forEach(el => delete queryObj[el]);

      // Advanced filtering ($gte, $gt, $lte, $lt)
      let queryStr = JSON.stringify(queryObj);
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|ne)\b/g, match => `$${match}`);
      const mongoFilter = JSON.parse(queryStr);

      // Search across specified string fields
      if (req.query.search && searchFields.length > 0) {
        const searchRegex = new RegExp(req.query.search, 'i');
        mongoFilter.$or = searchFields.map(field => ({ [field]: searchRegex }));
      }

      // Initial Query with .lean() for maximum memory/speed performance
      let query = Model.find(mongoFilter);

      // Field Selection (?fields=name,registrationNumber)
      if (req.query.fields) {
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
      }

      // Sorting (?sort=-createdAt,profit)
      if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
      } else {
        query = query.sort('-createdAt');
      }

      // Pagination (?page=1&limit=25)
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const skip = (page - 1) * limit;

      const total = await Model.countDocuments(mongoFilter);
      const docs = await query.skip(skip).limit(limit).lean();

      // Transform _id to id for client convenience
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

    // GET SINGLE BY ID (supports _id or custom id field)
    getById: asyncHandler(async (req, res) => {
      const { id } = req.params;
      let doc = null;

      if (mongoose.Types.ObjectId.isValid(id)) {
        doc = await Model.findById(id).lean();
      }
      if (!doc) {
        doc = await Model.findOne({ id }).lean();
      }

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

    // CREATE
    create: asyncHandler(async (req, res) => {
      const doc = await Model.create(req.body);
      res.status(201).json({
        success: true,
        data: doc
      });
    }),

    // UPDATE BY ID
    update: asyncHandler(async (req, res) => {
      const { id } = req.params;
      let query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

      const doc = await Model.findOneAndUpdate(query, req.body, {
        new: true,
        runValidators: true
      });

      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Resource not found with ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        data: doc
      });
    }),

    // DELETE BY ID
    delete: asyncHandler(async (req, res) => {
      const { id } = req.params;
      let query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };

      const doc = await Model.findOneAndDelete(query);

      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Resource not found with ID ${id}`
        });
      }

      res.status(200).json({
        success: true,
        message: 'Resource deleted successfully',
        data: {}
      });
    })
  };
};
