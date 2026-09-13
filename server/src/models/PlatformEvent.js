import mongoose from 'mongoose';

/**
 * Full platform activity trail for Superadmin:
 * logins, returns, onboards, subscription changes, etc.
 */
const platformEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'admin_login',
        'admin_return',
        'superadmin_login',
        'org_onboard',
        'org_status',
        'project_status',
        'user_suspend',
        'user_activate',
        'lead_created',
        'lead_updated',
        'lead_converted',
        'subscription_assigned',
        'subscription_renewed',
        'trial_started',
        'trial_ended',
        'plan_created',
        'plan_updated'
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, trim: true },
    actorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorEmail: { type: String, trim: true, lowercase: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'PlatformLead', default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_d, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      }
    }
  }
);

platformEventSchema.index({ createdAt: -1 });
platformEventSchema.index({ type: 1, createdAt: -1 });

export const PlatformEvent = mongoose.model('PlatformEvent', platformEventSchema);
export default PlatformEvent;
