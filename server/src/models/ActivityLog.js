import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    },
    agencyName: {
      type: String,
      trim: true
    },
    actorId: {
      type: String,
      index: true
    },
    actorName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    actorEmail: {
      type: String,
      trim: true
    },
    actorRole: {
      type: String,
      enum: ['admin', 'manager', 'operator', 'driver', 'system'],
      default: 'admin',
      index: true
    },
    actorAvatar: {
      type: String,
      default: null
    },
    actorType: {
      type: String,
      enum: ['user', 'driver', 'system'],
      default: 'user',
      index: true
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: ['trips', 'duty', 'vehicles', 'attendance', 'expenses', 'payroll', 'auth', 'system'],
      default: 'system',
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    targetEntity: {
      type: String,
      trim: true
    },
    targetId: {
      type: String,
      trim: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
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

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ agencyId: 1, createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
