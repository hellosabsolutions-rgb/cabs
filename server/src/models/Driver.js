import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    photo: {
      type: String,
      default: null
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      type: String,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    licensePhoto: {
      type: String,
      default: null
    },
    driverType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract', 'Owner Driver'],
      default: 'Full Time',
      index: true
    },
    assignedVehicle: {
      type: String,
      trim: true,
      index: true
    },
    joiningDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    status: {
      type: String,
      enum: ['On duty', 'Off duty'],
      default: 'On duty',
      index: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
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
    },
    toObject: { virtuals: true }
  }
);

export const Driver = mongoose.model('Driver', driverSchema);
