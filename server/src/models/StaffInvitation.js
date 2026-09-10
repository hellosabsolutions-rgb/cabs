import mongoose from 'mongoose';

const staffInvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Staff email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ],
      index: true
    },
    agency: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      required: true,
      index: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    role: {
      type: String,
      enum: ['manager', 'operator', 'admin'],
      default: 'operator'
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    inviteToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked', 'expired'],
      default: 'pending',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    acceptedAt: {
      type: Date,
      default: null
    },
    acceptedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
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

staffInvitationSchema.index({ agency: 1, email: 1 });

export const StaffInvitation = mongoose.model('StaffInvitation', staffInvitationSchema);
export default StaffInvitation;
