import './config/loadEnv.js';

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
import { Expense } from './models/Expense.js';
import { Compliance } from './models/Compliance.js';
import { Maintenance } from './models/Maintenance.js';

// Seed data (development / demo only — never runs in production)
import {
  initialVehicles,
  initialDrivers,
  initialDriverAttendance,
  initialDriverExpenses,
  initialDriverAdvances,
  initialDriverPenalties,
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

if (process.env.NODE_ENV === 'production') {
  console.error('❌ Seed is disabled in production. Dummy data is for local development only.');
  console.error('   Run: npm run seed  (uses .env.development + local MongoDB)');
  process.exit(1);
}

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@fleetos.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'admin123';
const adminName = process.env.SEED_ADMIN_NAME || 'Rahul Sharma';
const adminPhone = process.env.SEED_ADMIN_PHONE || '+91 98101 23456';

const sanitizeDocs = (items) => items.map((item) => ({ ...item }));

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to MongoDB for seeding (development)...');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Agency.deleteMany({}),
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
      Expense.deleteMany({}),
      Compliance.deleteMany({}),
      Maintenance.deleteMany({})
    ]);

    console.log('👤 Creating default Administrator account & Agency...');
    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      phone: adminPhone
    });

    const defaultAgency = await Agency.create({
      name: 'Sharma Fleet & Logistics Pvt. Ltd.',
      owner: adminUser._id,
      businessType: 'Department & Tour Operator',
      phone: adminPhone,
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

    console.log(`  🔑 Admin: ${adminUser.email} (password: ${adminPassword})`);
    console.log(`  🏢 Agency: ${defaultAgency.name}`);

    console.log('📦 Inserting demo fleet data...');

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
      DriverAdvance.insertMany(sanitizeDocs(initialDriverAdvances)),
      DriverPenalty.insertMany(sanitizeDocs(initialDriverPenalties)),
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
