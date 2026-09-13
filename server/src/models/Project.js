import mongoose from 'mongoose';

/**
 * A tracked "project" = an admin workspace (Agency) under an Organization.
 * Superadmin uses this to follow onboarding → live usage.
 */
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      index: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
      index: true
    },
    adminUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Onboarding', 'Active', 'Paused', 'Archived'],
      default: 'Onboarding',
      index: true
    },
    plan: {
      type: String,
      enum: ['Trial', 'Starter', 'Growth', 'Enterprise', 'Custom'],
      default: 'Trial'
    },
    notes: { type: String, trim: true },
    /** Lightweight cached counters refreshed from live collections */
    metrics: {
      vehicles: { type: Number, default: 0 },
      drivers: { type: Number, default: 0 },
      bookings: { type: Number, default: 0 },
      lastActivityAt: { type: Date, default: null }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    goLiveAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

projectSchema.index({ organization: 1, status: 1 });
projectSchema.index({ agency: 1 }, { unique: true });

export const Project = mongoose.model('Project', projectSchema);
export default Project;
