import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      default: null,
      index: true
    },
    category: {
      type: String,
      enum: ['compliance', 'maintenance', 'fleet', 'financial', 'bookings', 'system', 'chat'],
      required: true,
      index: true
    },
    priority: {
      type: String,
      enum: ['critical', 'warning', 'info', 'success'],
      default: 'info'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    // Deep link route for instant navigation
    link: {
      type: String,
      default: null,
      trim: true
    },
    // Flexible metadata for linking to the source record
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for fast querying
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });
notificationSchema.index({ agencyId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
