import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      trim: true,
      index: true
    },
    bookingDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0]
    },
    tripType: {
      type: String,
      enum: ['One-way (Single)', 'Round Trip'],
      default: 'Round Trip'
    },
    vehicle: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    vehicleModel: {
      type: String,
      trim: true
    },
    isDepartmentVehicle: {
      type: Boolean,
      default: false
    },
    departmentName: {
      type: String,
      trim: true
    },
    weekendDutyType: {
      type: String,
      enum: ['Saturday Trip', 'Sunday Trip', 'Weekend Round Trip', 'Regular Commercial Trip'],
      default: 'Regular Commercial Trip'
    },
    driverName: {
      type: String,
      required: true,
      trim: true
    },
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerPhone: {
      type: String,
      trim: true
    },
    pickupLocation: {
      type: String,
      required: true,
      trim: true
    },
    dropLocation: {
      type: String,
      required: true,
      trim: true
    },
    route: {
      type: String,
      required: true,
      trim: true
    },
    startDate: {
      type: String,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      default: '09:00 AM'
    },
    endDate: {
      type: String
    },
    endTime: {
      type: String
    },
    startOdometer: {
      type: Number,
      default: 0
    },
    endOdometer: {
      type: Number
    },
    totalKmRun: {
      type: Number,
      default: 0
    },

    // Financial & Payment breakdown
    revenue: {
      type: Number,
      required: true,
      default: 0
    }, // Total agreed fare
    totalAmount: {
      type: Number,
      default: 0
    }, // Alias for revenue
    advanceAmount: {
      type: Number,
      default: 0
    }, // Advance payment received
    advancePaymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Not Paid'],
      default: 'UPI'
    },
    advanceDate: {
      type: String
    },
    balancePaid: {
      type: Number,
      default: 0
    }, // Balance payment collected
    balancePaymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Pending'],
      default: 'Pending'
    },
    balancePaymentDate: {
      type: String
    },
    pendingAmount: {
      type: Number,
      default: 0
    }, // Pending amount to collect
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Unpaid'],
      default: 'Unpaid',
      index: true
    },
    paymentNotes: {
      type: String,
      trim: true
    },

    // Expenses & Profit
    initialFuelLitres: {
      type: Number,
      default: 0
    },
    fuelCost: {
      type: Number,
      default: 0
    },
    fastagCost: {
      type: Number,
      default: 0
    },
    driverBata: {
      type: Number,
      default: 0
    },
    otherExpenses: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    margin: {
      type: String,
      default: '0%'
    },

    // Status: Scheduled (Advance booking), Ongoing, Completed, Cancelled
    status: {
      type: String,
      enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true
    },
    notes: {
      type: String,
      trim: true
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

// Pre-save calculation hook for financial consistency
bookingSchema.pre('save', function (next) {
  if (this.totalAmount && !this.revenue) {
    this.revenue = this.totalAmount;
  } else if (this.revenue && !this.totalAmount) {
    this.totalAmount = this.revenue;
  }

  const advance = Number(this.advanceAmount) || 0;
  const balance = Number(this.balancePaid) || 0;
  const total = Number(this.revenue) || 0;

  this.pendingAmount = Math.max(0, total - (advance + balance));

  if (this.pendingAmount === 0 && total > 0) {
    this.paymentStatus = 'Paid';
  } else if (advance > 0 || balance > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Unpaid';
  }

  // Calculate expenses & profit
  const exp = (Number(this.fuelCost) || 0) + (Number(this.fastagCost) || 0) + (Number(this.driverBata) || 0) + (Number(this.otherExpenses) || 0);
  this.expenses = exp;
  this.profit = total - exp;
  this.margin = total > 0 ? ((this.profit / total) * 100).toFixed(1) + '%' : '0%';

  next();
});

bookingSchema.index({ status: 1, startDate: -1 });
bookingSchema.index({ vehicle: 1, startDate: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
export const Trip = Booking; // Alias for backwards compatibility
