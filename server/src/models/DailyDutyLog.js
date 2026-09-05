import mongoose from 'mongoose';

const dailyDutyLogSchema = new mongoose.Schema(
  {
    dutySlipNumber: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
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
    dutyType: {
      type: String,
      enum: ['Official Department Duty', 'Weekend / Off-Duty Trip'],
      default: 'Official Department Duty',
      index: true
    },
    tripDestination: {
      type: String,
      trim: true
    },
    tripFare: {
      type: Number,
      default: 0
    },
    tripNetProfit: {
      type: Number,
      default: 0
    },
    startKm: {
      type: Number,
      required: true
    },
    endKm: {
      type: Number,
      required: true
    },
    totalKm: {
      type: Number,
      required: true
    },
    extraKm: {
      type: Number,
      default: 0
    },
    startTime: {
      type: String,
      default: '09:00 AM'
    },
    endTime: {
      type: String,
      default: '07:00 PM'
    },
    totalHours: {
      type: Number,
      default: 10
    },
    extraHours: {
      type: Number,
      default: 0
    },
    tollParkingAmount: {
      type: Number,
      default: 0
    },
    fuelAmount: {
      type: Number,
      default: 0
    },
    fuelLitres: {
      type: Number,
      default: 0
    },
    officerName: {
      type: String,
      trim: true
    },
    officerDesignation: {
      type: String,
      trim: true,
      default: ''
    },
    journeyFrom: {
      type: String,
      trim: true,
      default: ''
    },
    journeyTo: {
      type: String,
      trim: true,
      default: ''
    },
    purposeOfJourney: {
      type: String,
      trim: true,
      default: 'Official Office Duty'
    },
    headOfAccount: {
      type: String,
      trim: true,
      default: ''
    },
    motorOilUsed: {
      type: String,
      trim: true,
      default: 'None'
    },
    officerSignatureStatus: {
      type: String,
      enum: ['Signed', 'Pending', 'Exempt'],
      default: 'Signed'
    },
    driverSignatureStatus: {
      type: String,
      enum: ['Signed', 'Pending'],
      default: 'Signed'
    },
    dutySlipPhoto: {
      type: String,
      default: null
    },
    fuelBillPhoto: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
      default: 'Approved',
      index: true
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

dailyDutyLogSchema.index({ vehicle: 1, date: -1 });

export const DailyDutyLog = mongoose.model('DailyDutyLog', dailyDutyLogSchema);
