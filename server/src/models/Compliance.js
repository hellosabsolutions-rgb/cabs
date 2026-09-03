import mongoose from 'mongoose';

const complianceSchema = new mongoose.Schema(
  {
    entityName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      enum: ['Vehicle', 'Driver'],
      index: true
    },
    documentName: {
      type: String,
      required: true,
      trim: true
    },
    documentNumber: {
      type: String,
      trim: true
    },
    issueDate: {
      type: String
    },
    expiryDate: {
      type: String,
      index: true
    },
    issuingAuthority: {
      type: String,
      trim: true
    },
    documentPhoto: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      trim: true
    },
    expiryLabel: {
      type: String,
      default: 'Valid'
    },
    statusType: {
      type: String,
      enum: ['ok', 'soon', 'late'],
      default: 'ok',
      index: true
    },
    daysLeft: {
      type: Number
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

export const Compliance = mongoose.model('Compliance', complianceSchema);
