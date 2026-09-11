import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
      index: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      index: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true
    },
    googleId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    photo: {
      type: String,
      default: null
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      type: String,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    licensePhoto: {
      type: String,
      default: null
    },
    licenseExpiry: {
      type: String
    },
    driverType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Contract', 'Owner Driver'],
      default: 'Full Time',
      index: true
    },
    assignedVehicle: {
      type: String,
      trim: true,
      index: true
    },
    joiningDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    status: {
      type: String,
      enum: ['On duty', 'Off duty'],
      default: 'On duty',
      index: true
    },
    monthlySalary: {
      type: Number,
      default: 0,
      min: 0
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret.password;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

driverSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

driverSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return bcrypt.compare(enteredPassword, this.password);
};

export const Driver = mongoose.model('Driver', driverSchema);
export default Driver;
