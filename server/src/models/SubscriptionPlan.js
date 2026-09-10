import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    price: {
      type: Number,
      default: null // null indicates Custom / Enterprise pricing
    },
    vehicles: {
      type: String,
      default: '25 Vehicles'
    },
    vlimit: {
      type: Number,
      default: 25
    },
    drivers: {
      type: String,
      default: '25 Drivers'
    },
    dlimit: {
      type: Number,
      default: 25
    },
    users: {
      type: String,
      default: '10 Users'
    },
    ulimit: {
      type: Number,
      default: 10
    },
    active: {
      type: Number,
      default: 0
    },
    features: [
      {
        type: String
      }
    ],
    featured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
