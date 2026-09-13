import mongoose from 'mongoose';

/** Org subscription / trial — Superadmin only for now. */
const organizationSubscriptionSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true
    },
    status: {
      type: String,
      enum: ['Trial', 'Active', 'PastDue', 'Cancelled', 'Expired'],
      default: 'Trial',
      index: true
    },
    billingCycle: {
      type: String,
      enum: ['Monthly', 'Yearly', 'Custom'],
      default: 'Monthly'
    },
    trialStartsAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, default: null },
    notes: { type: String, trim: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
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

organizationSubscriptionSchema.index({ organization: 1, status: 1 });

export const OrganizationSubscription = mongoose.model(
  'OrganizationSubscription',
  organizationSubscriptionSchema
);
export default OrganizationSubscription;
