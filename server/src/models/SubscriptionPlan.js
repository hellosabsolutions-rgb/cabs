import mongoose from 'mongoose';

/**
 * Fully managed subscription catalog (Superadmin only).
 * One plan row per (code + country) so pricing can differ by market.
 */
const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true, index: true },
    category: {
      type: String,
      enum: ['Free', 'Starter', 'Professional', 'Growth', 'Enterprise', 'Custom'],
      default: 'Starter',
      index: true
    },
    description: { type: String, trim: true, default: '' },
    /** Benefit bullets shown on pricing / assign UI */
    benefits: {
      type: [
        {
          title: { type: String, trim: true, required: true },
          detail: { type: String, trim: true, default: '' }
        }
      ],
      default: []
    },
    /** ISO 3166-1 alpha-2 */
    country: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'IN',
      index: true
    },
    countryName: { type: String, trim: true, default: 'India' },
    currency: { type: String, trim: true, uppercase: true, default: 'INR' },
    priceMonthly: { type: Number, default: 0 },
    priceYearly: { type: Number, default: 0 },
    /** Display helper: Free / Custom / Paid */
    pricingLabel: { type: String, trim: true, default: '' },
    trialDays: { type: Number, default: 14 },
    limits: {
      vehicles: { type: Number, default: 25 },
      drivers: { type: Number, default: 50 },
      users: { type: Number, default: 5 }
    },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    /** Legacy alias kept in sync with benefits titles */
    features: [{ type: String }]
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

subscriptionPlanSchema.index({ code: 1, country: 1 }, { unique: true });
subscriptionPlanSchema.index({ country: 1, category: 1, sortOrder: 1 });

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
export default SubscriptionPlan;
