import mongoose from 'mongoose';

const agencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agency / Company name is required'],
      trim: true,
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
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
      default: 'Department & Tour Operator'
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true
    },
    logo: {
      type: String,
      default: null
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    defaultGstRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    },
    defaultGstType: {
      type: String,
      enum: ['CGST_SGST', 'IGST'],
      default: 'CGST_SGST'
    },
    gstEffectiveDate: {
      type: Date,
      default: Date.now
    },
    gstHistory: [
      {
        rate: { type: Number, required: true },
        gstType: { type: String, enum: ['CGST_SGST', 'IGST'], default: 'CGST_SGST' },
        effectiveDate: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'Admin' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String }
      }
    ]
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
    },
    toObject: { virtuals: true }
  }
);

agencySchema.index({ owner: 1, name: 1 });

export const Agency = mongoose.model('Agency', agencySchema);
