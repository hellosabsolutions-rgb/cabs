import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    biz: {
      type: String,
      required: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    },
    subject: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true
    },
    assigned: {
      type: String,
      default: 'Ishaan P.'
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Critical'],
      default: 'Open',
      index: true
    },
    type: {
      type: String,
      enum: ['Ticket', 'Feature request', 'Bug report', 'Feedback'],
      default: 'Ticket',
      index: true
    },
    message: {
      type: String,
      default: ''
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    }
  },
  {
    timestamps: true
  }
);

supportTicketSchema.index({ type: 1, status: 1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
