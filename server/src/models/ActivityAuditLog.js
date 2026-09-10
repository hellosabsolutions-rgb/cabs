import mongoose from 'mongoose';

const activityAuditLogSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    },
    text: {
      type: String,
      required: true
    },
    actor: {
      type: String,
      default: 'Super Admin'
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

activityAuditLogSchema.index({ createdAt: -1 });

export const ActivityAuditLog = mongoose.model('ActivityAuditLog', activityAuditLogSchema);
