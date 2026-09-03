import mongoose from 'mongoose';

const departmentContractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    driverName: {
      type: String,
      trim: true
    },
    monthlyBaseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    includedKmPerMonth: {
      type: Number,
      default: 2500
    },
    includedHoursPerMonth: {
      type: Number,
      default: 250
    },
    extraKmRate: {
      type: Number,
      default: 14
    },
    extraHourRate: {
      type: Number,
      default: 120
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Pending Renewal'],
      default: 'Active',
      index: true
    },
    documentFile: {
      type: String,
      default: null
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

export const DepartmentContract = mongoose.model('DepartmentContract', departmentContractSchema);
