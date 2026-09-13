/**
 * Backfill agencyId on fleet records that pre-date multi-tenant scoping.
 * Usage: node server/scripts/backfillAgencyId.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { Agency } from '../src/models/Agency.js';
import { User } from '../src/models/User.js';
import { Driver } from '../src/models/Driver.js';
import { Vehicle } from '../src/models/Vehicle.js';
import { Booking } from '../src/models/Booking.js';
import { Expense } from '../src/models/Expense.js';
import { TripExpense } from '../src/models/TripExpense.js';
import { DriverExpense } from '../src/models/DriverExpense.js';
import { DriverAttendance } from '../src/models/DriverAttendance.js';
import { FuelLog } from '../src/models/FuelLog.js';
import { FastagTransaction } from '../src/models/FastagTransaction.js';
import { Maintenance } from '../src/models/Maintenance.js';
import { Compliance } from '../src/models/Compliance.js';
import { DepartmentContract } from '../src/models/DepartmentContract.js';
import { DailyDutyLog } from '../src/models/DailyDutyLog.js';
import { DepartmentPayment } from '../src/models/DepartmentPayment.js';
import { MonthlyBill } from '../src/models/MonthlyBill.js';
import { Revenue } from '../src/models/Revenue.js';

const COLLECTIONS = [
  Driver,
  Vehicle,
  Booking,
  Expense,
  TripExpense,
  DriverExpense,
  DriverAttendance,
  FuelLog,
  FastagTransaction,
  Maintenance,
  Compliance,
  DepartmentContract,
  DailyDutyLog,
  DepartmentPayment,
  MonthlyBill,
  Revenue
];

async function inferAgencyId(doc, defaultAgencyId, vehicleMap, driverMap) {
  if (doc.agencyId) return doc.agencyId;
  if (doc.vehicle) {
    const v = vehicleMap.get(String(doc.vehicle).replace(/[\s-]/g, '').toUpperCase());
    if (v?.agencyId) return v.agencyId;
  }
  if (doc.driverId) {
    const d = driverMap.get(String(doc.driverId));
    if (d?.agencyId) return d.agencyId;
  }
  if (doc.driverName) {
    const d = driverMap.get(doc.driverName.toLowerCase());
    if (d?.agencyId) return d.agencyId;
  }
  return defaultAgencyId;
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const agencies = await Agency.find().lean();
  if (agencies.length === 0) {
    console.log('No agencies found — nothing to backfill.');
    await mongoose.disconnect();
    return;
  }

  const defaultAgency = agencies[0];
  console.log(`Default agency: ${defaultAgency.name} (${defaultAgency._id})`);

  const drivers = await Driver.find().lean();
  const vehicles = await Vehicle.find().lean();
  const driverMap = new Map();
  drivers.forEach(d => {
    driverMap.set(d._id.toString(), d);
    if (d.name) driverMap.set(d.name.toLowerCase(), d);
  });
  const vehicleMap = new Map();
  vehicles.forEach(v => {
    if (v.registrationNumber) {
      vehicleMap.set(String(v.registrationNumber).replace(/[\s-]/g, '').toUpperCase(), v);
    }
  });

  for (const Model of COLLECTIONS) {
    const name = Model.collection.name;
    const missing = await Model.find({
      $or: [{ agencyId: { $exists: false } }, { agencyId: null }]
    });

    if (missing.length === 0) {
      console.log(`✓ ${name}: already scoped`);
      continue;
    }

    let updated = 0;
    for (const doc of missing) {
      const agencyId = await inferAgencyId(doc, defaultAgency._id, vehicleMap, driverMap);
      await Model.updateOne({ _id: doc._id }, { $set: { agencyId } });
      updated++;
    }
    console.log(`✓ ${name}: backfilled ${updated} records`);
  }

  // Ensure users with agencies have currentAgency
  const users = await User.find({ agencies: { $exists: true, $ne: [] } });
  for (const user of users) {
    if (!user.currentAgency && user.agencies.length > 0) {
      user.currentAgency = user.agencies[0];
      await user.save();
      console.log(`Set currentAgency for user ${user.email}`);
    }
  }

  await mongoose.disconnect();
  console.log('Backfill complete.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
