import mongoose from 'mongoose';

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    time: {
      type: String,
      default: '09:00 AM'
    },
    odometer: {
      type: Number,
      required: true
    },
    fuelType: {
      type: String,
      enum: ['Diesel', 'Petrol', 'CNG'],
      default: 'Diesel'
    },
    litres: {
      type: Number,
      required: true,
      min: 0
    },
    ratePerLitre: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    },
    stationName: {
      type: String,
      trim: true
    },
    paymentMode: {
      type: String,
      enum: ['Fleet Card', 'Cash', 'UPI', 'Company Credit'],
      default: 'Fleet Card'
    },
    meterPhoto: {
      type: String,
      default: null
    },
    receiptPhoto: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      trim: true
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

fuelLogSchema.index({ vehicle: 1, date: -1 });

export const FuelLog = mongoose.model('FuelLog', fuelLogSchema);
