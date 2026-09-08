import mongoose from 'mongoose';

const driverPenaltySchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: [true, 'Driver ID is required'],
      index: true
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true
    },
    vehicle: {
      type: String,
      trim: true,
      default: '—'
    },
    challanNumber: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Penalty/Challan amount is required'],
      min: [1, 'Amount must be greater than zero']
    },
    date: {
      type: String,
      required: [true, 'Penalty date is required'],
      default: () => new Date().toISOString().split('T')[0],
      index: true
    },
    reason: {
      type: String,
      required: [true, 'Reason or violation description is required'],
      trim: true,
      default: 'Traffic Challan'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DEDUCTED'],
      default: 'ACTIVE',
      index: true
    },
    settledInMonth: {
      type: String,
      trim: true
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
        return ret;
      }
    }
  }
);

export const DriverPenalty = mongoose.model('DriverPenalty', driverPenaltySchema);
