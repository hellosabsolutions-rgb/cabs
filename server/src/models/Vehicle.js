import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      enum: ['Department', 'Trip-based'],
      default: 'Trip-based',
      index: true
    },
    assignedTo: {
      type: String,
      required: [true, 'Assigned department or stand is required'],
      trim: true
    },
    departmentName: {
      type: String,
      trim: true
    },
    isWeekendTripEnabled: {
      type: Boolean,
      default: false
    },
    currentOperationMode: {
      type: String,
      enum: ['Department', 'Trip-based'],
      default: function () {
        return this.type;
      }
    },
    status: {
      type: String,
      enum: ['Running', 'Active', 'Idle', 'Maintenance'],
      default: 'Active',
      index: true
    },
    meta: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    revenue: {
      type: Number,
      default: 0
    },
    expense: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    model: {
      type: String,
      trim: true
    },
    fuelType: {
      type: String,
      enum: ['Diesel', 'Petrol', 'CNG', 'Electric'],
      default: 'Diesel'
    },
    seatingCapacity: {
      type: Number,
      default: 5
    },
    assignedDriver: {
      type: String,
      trim: true
    },
    odometer: {
      type: Number,
      default: 0
    },
    fastagTagId: {
      type: String,
      trim: true
    },
    fastagBank: {
      type: String,
      trim: true
    },
    fastagBalance: {
      type: Number,
      default: 0
    },
    gpsImei: {
      type: String,
      trim: true
    },
    rcPhoto: {
      type: String,
      default: null
    },
    vehiclePhoto: {
      type: String,
      default: null
    },
    hubStand: {
      type: String,
      trim: true
    },
    insuranceExpiry: {
      type: String
    },
    fitnessExpiry: {
      type: String
    },
    puccExpiry: {
      type: String
    },
    permitExpiry: {
      type: String
    },
    roadTaxExpiry: {
      type: String
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

// Compound indexes for optimized filtering
vehicleSchema.index({ type: 1, status: 1 });
vehicleSchema.index({ departmentName: 1 });

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
