import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema(
  {
    tripNumber: {
      type: String,
      trim: true,
      index: true
    },
    tripType: {
      type: String,
      enum: ['One-way (Single)', 'Round Trip'],
      default: 'Round Trip'
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    vehicleModel: {
      type: String,
      trim: true
    },
    isDepartmentVehicle: {
      type: Boolean,
      default: false
    },
    departmentName: {
      type: String,
      trim: true
    },
    weekendDutyType: {
      type: String,
      enum: ['Saturday Trip', 'Sunday Trip', 'Weekend Round Trip', 'Regular Commercial Trip'],
      default: 'Regular Commercial Trip'
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true
    },
    dropLocation: {
      type: String,
      required: true,
      trim: true
    },
    route: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: String,
      required: true,
      index: true
    },
    startTime: {
      type: String
    },
    endDate: {
      type: String
    },
    startOdometer: {
      type: Number,
      required: true
    },
    endOdometer: {
      type: Number
    },
    totalKmRun: {
      type: Number,
      default: 0
    },
    initialFuelLitres: {
      type: Number,
      default: 0
    },
    fuelCost: {
      type: Number,
      default: 0
    },
    fastagCost: {
      type: Number,
      default: 0
    },
    driverBata: {
      type: Number,
      default: 0
    },
    otherExpenses: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      required: true
    },
    expenses: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    margin: {
      type: String,
      default: '0%'
    },
    status: {
      type: String,
      enum: ['Ongoing', 'Completed', 'Scheduled'],
      default: 'Ongoing',
      index: true
    },
    customerName: {
      type: String,
      trim: true
    },
    customerPhone: {
      type: String,
      trim: true
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

tripSchema.index({ status: 1, startDate: -1 });

export const Trip = mongoose.model('Trip', tripSchema);
