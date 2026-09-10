import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const superUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: 'Aarav Mehta'
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    role: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Support Specialist', 'Operations Manager'],
      default: 'Super Admin'
    },
    phone: {
      type: String,
      default: '+91 98000 00000'
    },
    avatar: {
      type: String,
      default: 'SA'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

superUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

superUserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const SuperUser = mongoose.model('SuperUser', superUserSchema);
