import mongoose from 'mongoose';

const driverAssignmentSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver ID is required'],
      index: true
    },
    driverName: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      index: true
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
      index: true
    },
    vehicleRegistration: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      trim: true,
      uppercase: true,
      index: true
    },
    assignedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    unassignedAt: {
      type: Date,
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'UNASSIGNED'],
      default: 'ACTIVE',
      index: true
    },
    assignedBy: {
      type: String,
      default: 'Admin',
      trim: true
    },
    unassignedBy: {
      type: String,
      default: null,
      trim: true
    },
    reason: {
      type: String,
      default: 'Roster assignment',
      trim: true
    },
    odometerAtAssignment: {
      type: Number,
      default: 0,
      min: 0
    },
    odometerAtUnassignment: {
      type: Number,
      default: null,
      min: 0
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// High performance compound indexes for fast & scalable querying:
// 1. Driver's active assignment or chronological history
driverAssignmentSchema.index({ driverId: 1, status: 1, assignedAt: -1 });

// 2. Vehicle registration active assignment or history
driverAssignmentSchema.index({ vehicleRegistration: 1, status: 1, assignedAt: -1 });

// 3. Vehicle ObjectId index
driverAssignmentSchema.index({ vehicleId: 1, status: 1 });

// 4. Global active/historical timeline queries
driverAssignmentSchema.index({ status: 1, assignedAt: -1 });

// 5. Agency multi-tenant scoping
driverAssignmentSchema.index({ agencyId: 1, status: 1, assignedAt: -1 });

export const DriverAssignment =
  mongoose.models.DriverAssignment ||
  mongoose.model('DriverAssignment', driverAssignmentSchema);

export default DriverAssignment;
