import mongoose from 'mongoose';

/**
 * Platform-level customer organization (managed from Superadmin).
 * Each org typically owns one or more admin Agencies / Projects.
 */
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      index: true
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },
    businessType: {
      type: String,
      enum: [
        'Department & Tour Operator',
        'Cab & Taxi Fleet',
        'Outstation & Corporate Travel',
        'Goods & Logistics',
        'Other'
      ],
      default: 'Cab & Taxi Fleet'
    },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Suspended', 'Churned'],
      default: 'Pending',
      index: true
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    notes: { type: String, trim: true },
    /** Primary admin user for this org (fleet admin login) */
    primaryAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    /** Default / first agency created at onboard */
    primaryAgency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      default: null
    },
    onboardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    onboardedAt: {
      type: Date,
      default: null
    },
    activatedAt: {
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

organizationSchema.index({ status: 1, createdAt: -1 });
organizationSchema.index({ name: 'text', email: 'text' });

export const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
