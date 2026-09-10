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
    plan: {
      type: String,
      enum: ['Basic', 'Professional', 'Enterprise'],
      default: 'Professional'
    },
    status: {
      type: String,
      enum: ['Active', 'Trial', 'Expired', 'Suspended'],
      default: 'Active',
      index: true
    },
    vlimit: {
      type: Number,
      default: 25
    },
    dlimit: {
      type: Number,
      default: 25
    },
    ulimit: {
      type: Number,
      default: 10
    },
    amount: {
      type: String,
      default: '₹1,999'
    },
    startDate: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    },
    expiryDate: {
      type: String,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      }
    },
    lastLogin: {
      type: String,
      default: 'Just now'
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
    },
    toObject: { virtuals: true }
  }
);

agencySchema.index({ owner: 1, name: 1 });

export const Agency = mongoose.model('Agency', agencySchema);
