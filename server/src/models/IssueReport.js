import mongoose from 'mongoose';

const issueReportSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      index: true
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      default: null,
      index: true
    },
    agencyName: {
      type: String,
      default: '',
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    reportType: {
      type: String,
      enum: ['issue', 'query', 'feature_request', 'other'],
      default: 'issue',
      index: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    module: {
      type: String,
      default: 'General',
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    reporterName: {
      type: String,
      required: [true, 'Reporter name is required'],
      trim: true
    },
    reporterEmail: {
      type: String,
      trim: true,
      default: ''
    },
    reporterPhone: {
      type: String,
      trim: true,
      default: ''
    },
    attachments: [
      {
        name: { type: String, default: '' },
        url: { type: String, default: '' },
        type: { type: String, default: '' }
      }
    ],
    resolutionNotes: {
      type: String,
      default: '',
      trim: true
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate ticketId if not present
issueReportSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = this.reportType === 'query' ? 'QRY' : 'REP';
    this.ticketId = `${prefix}-${Date.now().toString().slice(-4)}${randomNum}`;
  }
  next();
});

const IssueReport = mongoose.model('IssueReport', issueReportSchema);
export default IssueReport;
