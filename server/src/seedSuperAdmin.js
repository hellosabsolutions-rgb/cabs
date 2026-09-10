import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { SubscriptionPlan } from './models/SubscriptionPlan.js';
import { SuperTransaction } from './models/SuperTransaction.js';
import { SupportTicket } from './models/SupportTicket.js';
import { ActivityAuditLog } from './models/ActivityAuditLog.js';
import { Agency } from './models/Agency.js';
import { connectDB } from './config/db.js';

const seed = async () => {
  await connectDB();
  console.log('Seeding SuperAdmin initial datasets...');

  // 1. Subscription Plans
  const existingPlans = await SubscriptionPlan.countDocuments();
  if (existingPlans === 0) {
    await SubscriptionPlan.create([
      {
        name: 'Basic',
        price: 999,
        vehicles: '5 Vehicles',
        vlimit: 5,
        drivers: '5 Drivers',
        dlimit: 5,
        users: '5 Users',
        ulimit: 5,
        active: 9,
        features: ['5 vehicle limit', '5 driver limit', 'Trip & KM tracking', 'Fuel & FASTag log', 'Email support']
      },
      {
        name: 'Professional',
        price: 1999,
        vehicles: '25 Vehicles',
        vlimit: 25,
        drivers: '25 Drivers',
        dlimit: 25,
        users: '10 Users',
        ulimit: 10,
        active: 22,
        features: ['25 vehicle limit', '25 driver limit', 'Everything in Basic', 'Driver expense tracking', 'Priority support'],
        featured: true
      },
      {
        name: 'Enterprise',
        price: null,
        vehicles: 'Unlimited Vehicles',
        vlimit: 999,
        drivers: 'Unlimited Drivers',
        dlimit: 999,
        users: 'Unlimited Users',
        ulimit: 999,
        active: 11,
        features: ['Unlimited vehicles & drivers', 'Everything in Professional', 'Custom pricing', 'Dedicated account manager', 'API access']
      }
    ]);
    console.log('✔ Plans seeded');
  }

  // 2. Sample SuperTransactions
  const existingTxns = await SuperTransaction.countDocuments();
  if (existingTxns === 0) {
    await SuperTransaction.create([
      { txnId: 'TXN-88213', biz: 'Speedway Fleet', amount: '₹8,499', method: 'UPI', date: '25 Aug 2026', status: 'success', type: 'transaction' },
      { txnId: 'TXN-88212', biz: 'ABC Travels', amount: '₹1,999', method: 'Card', date: '25 Aug 2026', status: 'success', type: 'transaction' },
      { txnId: 'TXN-88211', biz: 'Highway Kings', amount: '₹999', method: 'UPI', date: '24 Aug 2026', status: 'failed', type: 'failed', reason: 'Insufficient balance' },
      { txnId: 'TXN-88210', biz: 'Urban Wheels', amount: '₹11,999', method: 'Netbanking', date: '24 Aug 2026', status: 'success', type: 'transaction' },
      { txnId: 'TXN-88209', biz: 'Prime Movers', amount: '₹8,499', method: 'Card', date: '23 Aug 2026', status: 'success', type: 'transaction' },
      { txnId: 'TXN-88208', biz: 'GoRide Logistics', amount: '₹1,999', method: 'UPI', date: '22 Aug 2026', status: 'failed', type: 'failed', reason: 'Card expired' },
      { txnId: 'TXN-88207', biz: 'Coastal Cabs', amount: '₹1,999', method: 'Card', date: '22 Aug 2026', status: 'success', type: 'transaction' },
      { txnId: 'TXN-88206', biz: 'Skyline Rides', amount: '₹1,999', method: 'UPI', date: '20 Aug 2026', status: 'pending', type: 'transaction' }
    ]);
    console.log('✔ Transactions seeded');
  }

  // 3. Support Tickets
  const existingTickets = await SupportTicket.countDocuments();
  if (existingTickets === 0) {
    await SupportTicket.create([
      { ticketId: 'TCK-4021', biz: 'Highway Kings', subject: 'Unable to reactivate account', priority: 'Critical', assigned: 'Ishaan P.', status: 'Open', type: 'Ticket' },
      { ticketId: 'TCK-4020', biz: 'GoRide Logistics', subject: 'Payment not reflecting', priority: 'High', assigned: 'Meera S.', status: 'In Progress', type: 'Ticket' },
      { ticketId: 'TCK-4019', biz: 'Coastal Cabs', subject: 'FASTag entries missing for 2 vehicles', priority: 'Medium', assigned: 'Ishaan P.', status: 'In Progress', type: 'Ticket' },
      { ticketId: 'TCK-4018', biz: 'Metro Cabs Co.', subject: 'Trial extension request', priority: 'Low', assigned: 'Meera S.', status: 'Open', type: 'Ticket' },
      { ticketId: 'TCK-4017', biz: 'ABC Travels', subject: 'Driver expense report export', priority: 'Medium', assigned: 'Rohan D.', status: 'Resolved', type: 'Ticket' },
      { ticketId: 'TCK-4016', biz: 'Skyline Rides', subject: 'Login OTP not received', priority: 'Critical', assigned: 'Rohan D.', status: 'Critical', type: 'Ticket' },
      { ticketId: 'FDB-101', biz: 'Speedway Fleet', subject: 'Bulk vehicle import via Excel', priority: 'Low', assigned: 'Product Team', status: 'Open', type: 'Feature request', message: 'Add bulk vehicle import via Excel' },
      { ticketId: 'FDB-102', biz: 'Urban Wheels', subject: 'Dashboard chart tablet overlap', priority: 'Medium', assigned: 'Frontend Team', status: 'In Progress', type: 'Bug report', message: 'Dashboard chart overlaps on tablet view' },
      { ticketId: 'FDB-103', biz: 'Prime Movers', subject: 'Loving driver expense module', priority: 'Low', assigned: 'Product Team', status: 'Resolved', type: 'Feedback', message: 'Loving the driver expense module, saves us hours' }
    ]);
    console.log('✔ Support tickets seeded');
  }

  // 4. Audit Logs
  const existingAudit = await ActivityAuditLog.countDocuments();
  if (existingAudit === 0) {
    await ActivityAuditLog.create([
      { time: '26 Aug, 3:20 PM', text: 'changed <b>ABC Travels</b> plan Basic → Professional', actor: 'Aarav Mehta (Super Admin)' },
      { time: '26 Aug, 1:05 PM', text: 'suspended business <b>Highway Kings</b>', actor: 'Aarav Mehta (Super Admin)' },
      { time: '25 Aug, 6:42 PM', text: 'processed refund of ₹999 for <b>Metro Cabs Co.</b>', actor: 'Meera S. (Admin)' },
      { time: '25 Aug, 11:15 AM', text: 'created new business <b>Northline Transport</b>', actor: 'System' },
      { time: '24 Aug, 9:30 AM', text: 'deleted user <b>ajay.old@abctravels.in</b>', actor: 'Aarav Mehta (Super Admin)' },
      { time: '23 Aug, 4:12 PM', text: 'updated plan pricing for <b>Professional</b>', actor: 'Aarav Mehta (Super Admin)' },
      { time: '22 Aug, 2:00 PM', text: 'logged in from Mumbai, IN', actor: 'Aarav Mehta (Super Admin)' }
    ]);
    console.log('✔ Audit logs seeded');
  }

  // Ensure default agency has status and plan set
  await Agency.updateMany(
    { status: { $exists: false } },
    { $set: { status: 'Active', plan: 'Professional', vlimit: 25, dlimit: 25, ulimit: 10, amount: '₹1,999' } }
  );

  console.log('✅ SuperAdmin Seeding Complete');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
