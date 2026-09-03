import mongoose from 'mongoose';

const driverAttendanceSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: true,
      index: true
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['Present', 'Late', 'Absent', 'On Trip', 'On Leave'],
      default: 'Present',
      index: true
    },
    checkIn: {
      type: String,
      default: '08:30 AM'
    },
    checkOut: {
      type: String,
      default: '06:30 PM'
    },
    assignedVehicle: {
      type: String,
      trim: true
    },
    dutyType: {
      type: String,
      enum: ['Department Duty', 'Trip Duty', 'Standby', 'Yard Duty'],
      default: 'Department Duty'
    },
    workingHours: {
      type: Number,
      default: 10
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

// Compound index for fast queries by driver and date
driverAttendanceSchema.index({ driverId: 1, date: -1 });

export const DriverAttendance = mongoose.model('DriverAttendance', driverAttendanceSchema);
