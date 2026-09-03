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
import { DepartmentContract } from './models/DepartmentContract.js';
import { DailyDutyLog } from './models/DailyDutyLog.js';
import { MonthlyBill } from './models/MonthlyBill.js';
import { DepartmentPayment } from './models/DepartmentPayment.js';
import { FuelLog } from './models/FuelLog.js';
import { FastagTransaction } from './models/FastagTransaction.js';
import { Trip } from './models/Trip.js';
import { Expense } from './models/Expense.js';
import { Compliance } from './models/Compliance.js';
import { Maintenance } from './models/Maintenance.js';

// Seed data
import {
  initialVehicles,
  initialDrivers,
  initialDriverAttendance,
  initialDriverExpenses,
  initialDepartmentContracts,
  initialDailyDutyLogs,
  initialMonthlyBills,
  initialDepartmentPayments,
  initialFuelLogs,
  initialFastagTransactions,
  initialTrips,
  initialExpenses,
  vehicleComplianceDocs,
  driverComplianceDocs,
  initialMaintenanceRecords
} from './data/seedData.js';

const sanitizeDocs = (items) => {
  return items.map(item => {
    const doc = { ...item };
    // Keep custom string id if present, or let mongo create _id
    return doc;
  });
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to MongoDB for seeding...');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Agency.deleteMany({}),
      Vehicle.deleteMany({}),
      Driver.deleteMany({}),
      DriverAttendance.deleteMany({}),
      DriverExpense.deleteMany({}),
      DepartmentContract.deleteMany({}),
      DailyDutyLog.deleteMany({}),
      MonthlyBill.deleteMany({}),
      DepartmentPayment.deleteMany({}),
      FuelLog.deleteMany({}),
      FastagTransaction.deleteMany({}),
      Trip.deleteMany({}),
      Expense.deleteMany({}),
      Compliance.deleteMany({}),
      Maintenance.deleteMany({})
    ]);

    console.log('👤 Creating default Administrator account & Agency...');
    const adminUser = await User.create({
      name: 'Rahul Sharma',
      email: 'admin@fleetos.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98101 23456'
    });

    const defaultAgency = await Agency.create({
      name: 'Sharma Fleet & Logistics Pvt. Ltd.',
      owner: adminUser._id,
      businessType: 'Department & Tour Operator',
      phone: '+91 98101 23456',
      email: 'info@sharmafleet.com',
      address: 'Plot 42, Transport Nagar, Phase-2',
      city: 'New Delhi',
      state: 'Delhi',
      gstin: '07AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      isDefault: true
    });

    adminUser.currentAgency = defaultAgency._id;
    adminUser.agencies = [defaultAgency._id];
    await adminUser.save();

    console.log(`  🔑 Default Admin Created: ${adminUser.email} (Password: admin123)`);
    console.log(`  🏢 Default Agency Created: ${defaultAgency.name}`);

    console.log('📦 Inserting initial mock data...');

    const [
      vehicles,
      drivers,
      attendance,
      driverExpenses,
      contracts,
      dutyLogs,
      bills,
      payments,
      fuelLogs,
      fastag,
      trips,
      expenses,
      compliance,
      maintenance
    ] = await Promise.all([
      Vehicle.insertMany(sanitizeDocs(initialVehicles)),
      Driver.insertMany(sanitizeDocs(initialDrivers)),
      DriverAttendance.insertMany(sanitizeDocs(initialDriverAttendance)),
      DriverExpense.insertMany(sanitizeDocs(initialDriverExpenses)),
      DepartmentContract.insertMany(sanitizeDocs(initialDepartmentContracts)),
      DailyDutyLog.insertMany(sanitizeDocs(initialDailyDutyLogs)),
      MonthlyBill.insertMany(sanitizeDocs(initialMonthlyBills)),
      DepartmentPayment.insertMany(sanitizeDocs(initialDepartmentPayments)),
      FuelLog.insertMany(sanitizeDocs(initialFuelLogs)),
      FastagTransaction.insertMany(sanitizeDocs(initialFastagTransactions)),
      Trip.insertMany(sanitizeDocs(initialTrips)),
      Expense.insertMany(sanitizeDocs(initialExpenses)),
      Compliance.insertMany(sanitizeDocs([...vehicleComplianceDocs, ...driverComplianceDocs])),
      Maintenance.insertMany(sanitizeDocs(initialMaintenanceRecords))
    ]);

    console.log('✨ Seed Summary:');
    console.log(`  🚗 Vehicles: ${vehicles.length}`);
    console.log(`  👤 Drivers: ${drivers.length}`);
    console.log(`  📅 Attendance: ${attendance.length}`);
    console.log(`  💵 Driver Expenses: ${driverExpenses.length}`);
    console.log(`  📑 Contracts: ${contracts.length}`);
    console.log(`  📋 Duty Logs: ${dutyLogs.length}`);
    console.log(`  🧾 Monthly Bills: ${bills.length}`);
    console.log(`  💳 Department Payments: ${payments.length}`);
    console.log(`  ⛽ Fuel Logs: ${fuelLogs.length}`);
    console.log(`  🛣️ FASTag Transactions: ${fastag.length}`);
    console.log(`  🧳 Trips: ${trips.length}`);
    console.log(`  💰 Expenses: ${expenses.length}`);
    console.log(`  🛡️ Compliance Docs: ${compliance.length}`);
    console.log(`  🔧 Maintenance Records: ${maintenance.length}`);

    console.log('🎉 Database seeded successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seedDatabase();
