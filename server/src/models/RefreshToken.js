import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    device: {
      deviceType: {
        type: String,
        enum: ['desktop', 'mobile', 'tablet', 'unknown'],
        default: 'desktop'
      },
      browser: {
        type: String,
        default: 'Unknown Browser'
      },
      os: {
        type: String,
        default: 'Unknown OS'
      },
      ip: {
        type: String,
        default: 'Unknown IP'
      },
      userAgent: {
        type: String,
        default: ''
      },
      label: {
        type: String,
        default: 'Desktop Browser'
      }
    },
    rememberMe: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // TTL index: MongoDB auto-removes expired documents
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual for ID
refreshTokenSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

refreshTokenSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    delete ret.tokenHash; // Never expose token hash in API responses
    return ret;
  }
});

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
