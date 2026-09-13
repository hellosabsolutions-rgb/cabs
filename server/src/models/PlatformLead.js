import mongoose from 'mongoose';

/**
 * Sales / inbound lead tracked only on Superadmin.
 * Can convert into an Organization onboard.
 */
const platformLeadSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, index: true },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    city: { type: String, trim: true },
    source: {
      type: String,
      enum: ['Manual', 'Website', 'Referral', 'Inbound', 'Demo', 'Other'],
      default: 'Manual'
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Qualified', 'Trial', 'Won', 'Lost'],
      default: 'New',
      index: true
    },
    notes: { type: String, trim: true },
    interestedPlan: { type: String, trim: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    lastTouchAt: { type: Date, default: Date.now },
    convertedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
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

platformLeadSchema.index({ status: 1, createdAt: -1 });

export const PlatformLead = mongoose.model('PlatformLead', platformLeadSchema);
export default PlatformLead;
