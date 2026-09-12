import express from 'express';
import { Expense } from '../models/Expense.js';
import { Maintenance } from '../models/Maintenance.js';
import { createCrudController } from '../controllers/crudFactory.js';

const router = express.Router();
const expenseController = createCrudController(Expense, ['vehicle', 'category', 'linkedTo']);

// Middleware to auto-sync any maintenance records into expenses collection
const syncMaintenanceExpenses = async (req, res, next) => {
  try {
    const maintenances = await Maintenance.find().lean();
    if (maintenances.length > 0) {
      for (const m of maintenances) {
        const exists = await Expense.findOne({
          $or: [
            { maintenanceId: m._id },
            { vehicle: m.vehicle, category: 'Maintenance', amount: m.cost, date: m.dateLabel || m.date }
          ]
        });
        if (!exists) {
          await Expense.create({
            date: m.dateLabel || m.date,
            vehicle: m.vehicle,
            category: 'Maintenance',
            linkedTo: `Maintenance - ${m.type}`,
            amount: m.cost,
            maintenanceId: m._id
          });
        }
      }
    }
  } catch (err) {
    console.warn('Syncing maintenance to expenses failed:', err.message);
  }
  next();
};

router
  .route('/')
  .get(syncMaintenanceExpenses, expenseController.getAll)
  .post(expenseController.create);

router
  .route('/:id')
  .get(expenseController.getById)
  .put(expenseController.update)
  .delete(expenseController.delete);

export default router;
