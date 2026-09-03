import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      index: true
    },
    dateLabel: {
      type: String
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      enum: ['Service', 'Repair', 'Tyre Change'],
      required: true
    },
    tyreCount: {
      type: Number,
      default: 0
    },
    cost: {
      type: Number,
      required: true,
      min: 0
    },
    bill: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['Completed', 'In Progress', 'Scheduled'],
      default: 'Completed',
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

export const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
