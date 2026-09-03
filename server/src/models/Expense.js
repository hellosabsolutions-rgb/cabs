import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      index: true
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Fuel', 'FASTag / Toll', 'Driver', 'Maintenance', 'General'],
      index: true
    },
    linkedTo: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
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

expenseSchema.index({ vehicle: 1, date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
