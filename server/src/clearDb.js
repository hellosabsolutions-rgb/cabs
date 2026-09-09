import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

// Models
import { Vehicle } from './models/Vehicle.js';
import { User } from './models/User.js';
import { Agency } from './models/Agency.js';
import { Driver } from './models/Driver.js';
import { DriverAttendance } from './models/DriverAttendance.js';
import { DriverExpense } from './models/DriverExpense.js';
import { DriverAdvance } from './models/DriverAdvance.js';
import { DriverPenalty } from './models/DriverPenalty.js';
import { DriverPayrollSettlement } from './models/DriverPayrollSettlement.js';
import { DepartmentContract } from './models/DepartmentContract.js';
import { DailyDutyLog } from './models/DailyDutyLog.js';
import { MonthlyBill } from './models/MonthlyBill.js';
import { DepartmentPayment } from './models/DepartmentPayment.js';
import { FuelLog } from './models/FuelLog.js';
import { FastagTransaction } from './models/FastagTransaction.js';
import { Trip } from './models/Trip.js';
import { Booking } from './models/Booking.js';
import { Expense } from './models/Expense.js';
import { Compliance } from './models/Compliance.js';
import { Maintenance } from './models/Maintenance.js';
import { Notification } from './models/Notification.js';
import IssueReport from './models/IssueReport.js';

const clearDatabase = async () => {
  try {
    console.log('Connecting to MongoDB to clear database...');
    await connectDB();

    console.log('Clearing all operational collections...');
    const results = await Promise.all([
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      DriverAttendance.deleteMany({}),
      DriverExpense.deleteMany({}),
      DriverAdvance.deleteMany({}),
      DriverPenalty.deleteMany({}),
      DriverPayrollSettlement.deleteMany({}),
      DepartmentContract.deleteMany({}),
      DailyDutyLog.deleteMany({}),
      MonthlyBill.deleteMany({}),
      DepartmentPayment.deleteMany({}),
      FuelLog.deleteMany({}),
      FastagTransaction.deleteMany({}),
      Trip.deleteMany({}),
      Booking.deleteMany({}),
      Expense.deleteMany({}),
      Compliance.deleteMany({}),
      Maintenance.deleteMany({}),
      Notification.deleteMany({}),
      IssueReport.deleteMany({})
    ]);

    console.log('Operational collections cleared successfully.');

    // Clean up test users, keep main admin accounts (sundan@gmail.com, admin@fleetos.com)
    await User.deleteMany({
      email: { $nin: ['sundan@gmail.com', 'admin@fleetos.com'] }
    });

    console.log('Database successfully cleared of all dummy and operational data.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();
