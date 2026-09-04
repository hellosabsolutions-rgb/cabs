import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import {
  PageId,
  Vehicle,
  VehicleType,
  VehicleStatus,
  VehicleSubTab,
  Driver,
  DriverAttendance,
  DriverExpenseItem,
  AttendanceStatus,
  DepartmentContract,
  DailyDutyLog,
  MonthlyDepartmentBill,
  DepartmentPayment,
  FuelLogEntry,
  FastagTransaction,
  ContractDepartment,
  TripFinancial,
  ExpenseRecord,
  DocumentCompliance,
  MaintenanceRecord,
  ToastNotification,
  ToastType
} from '../types/fleet';
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
  initialContracts,
  initialTrips,
  initialExpenses,
  vehicleComplianceDocs,
  driverComplianceDocs,
  initialMaintenanceRecords
} from '../data/mockFleetData';

interface PageHeaderInfo {
  title: string;
  subtitle: string;
}

const pageHeaders: Record<PageId, PageHeaderInfo> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview across department and trip operations' },
  vehicles: { title: 'Vehicles', subtitle: 'Department and trip-based fleet' },
  drivers: { title: 'Drivers', subtitle: 'Driver roster, attendance and expenses' },
  departments: { title: 'Departments & contracts', subtitle: 'Contract vehicles, duty logs and billing' },
  trips: { title: 'Trips', subtitle: 'One way and round trip financials' },
  expenses: { title: 'Expenses', subtitle: 'Fuel, toll, driver and maintenance costs' },
  profitability: { title: 'Profitability', subtitle: 'Department, trip and overall P&L' },
  compliance: { title: 'Compliance', subtitle: 'Vehicle and driver document tracking' },
  maintenance: { title: 'Maintenance', subtitle: 'Service, repair and tyre change records' }
};

import {
  FleetContext,
  FleetContextType,
  AlertItem,
  DriverSubTab,
  DepartmentSubTab
} from './FleetContextDef';

export const FleetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleSubTab, setVehicleSubTab] = useState<VehicleSubTab>('all');
  const [driverSubTab, setDriverSubTab] = useState<DriverSubTab>('list');
  const [departmentSubTab, setDepartmentSubTab] = useState<DepartmentSubTab>('contracts');
  const [expenseSubTab, setExpenseSubTab] = useState<'fuel' | 'fastag' | 'all'>('fastag');
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [attendanceRecords, setAttendanceRecords] = useState<DriverAttendance[]>(initialDriverAttendance);
  const [driverExpenses, setDriverExpenses] = useState<DriverExpenseItem[]>(initialDriverExpenses);
  
  const [departmentContracts, setDepartmentContracts] = useState<DepartmentContract[]>(initialDepartmentContracts);
  const [dailyDutyLogs, setDailyDutyLogs] = useState<DailyDutyLog[]>(initialDailyDutyLogs);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyDepartmentBill[]>(initialMonthlyBills);
  const [departmentPayments, setDepartmentPayments] = useState<DepartmentPayment[]>(initialDepartmentPayments);
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>(initialFuelLogs);
  const [fastagTransactions, setFastagTransactions] = useState<FastagTransaction[]>(initialFastagTransactions);
  
  const [contracts] = useState<ContractDepartment[]>(initialContracts);
  const [trips, setTrips] = useState<TripFinancial[]>(initialTrips);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [vehicleCompliance, setVehicleCompliance] = useState<DocumentCompliance[]>(vehicleComplianceDocs);
  const [driverCompliance, setDriverCompliance] = useState<DocumentCompliance[]>(driverComplianceDocs);
  
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (type: ToastType, message: string, title?: string, duration = 3500) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastNotification = { id, type, title, message, duration };
    setToasts(prev => [...prev, newToast]);
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleSetActivePage = (page: PageId) => {
    if (page === activePage) return;
    setIsLoading(true);
    setActivePage(page);
    setTimeout(() => {
      setIsLoading(false);
    }, 280);
  };

  const withLoading = async <T,>(fn: () => Promise<T> | T, key?: string): Promise<T> => {
    setIsLoading(true);
    if (key) setLoadingKey(key);
    try {
      const res = await Promise.resolve(fn());
      return res;
    } finally {
      setIsLoading(false);
      setLoadingKey(null);
    }
  };

  // Fetch vehicles from live backend API
  const fetchLiveVehicles = async () => {
    try {
      const res = await api.get('/vehicles?limit=100');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setVehicles(res.data);
      }
    } catch (err) {
      console.warn('Backend vehicles API not reachable, using local fleet cache.', err);
    }
  };

  // Fetch drivers from live backend API
  const fetchLiveDrivers = async () => {
    try {
      const res = await api.get('/drivers?limit=100');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDrivers(res.data);
      }
    } catch (err) {
      console.warn('Backend drivers API not reachable, using local driver cache.', err);
    }
  };

  useEffect(() => {
    fetchLiveVehicles();
    fetchLiveDrivers();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    setLoadingKey('refreshing');
    try {
      await Promise.all([fetchLiveVehicles(), fetchLiveDrivers()]);
      showToast('info', 'Fleet & Driver roster synchronized with live server.', 'Refreshed');
    } finally {
      setIsLoading(false);
      setLoadingKey(null);
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    try {
      if (!vehicleData.registrationNumber?.trim()) {
        showToast('error', 'Vehicle registration number is required.', 'Validation Error');
        return { success: false, error: 'Vehicle registration number is required.' };
      }

      // 1. Post to backend API
      try {
        const res = await api.post('/vehicles', vehicleData);
        if (res.success && res.data) {
          const serverVehicle: Vehicle = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setVehicles(prev => [serverVehicle, ...prev.filter(v => v.registrationNumber !== serverVehicle.registrationNumber)]);

          // Sync compliance records for the 5 documents
          const cleanReg = serverVehicle.registrationNumber;
          const calcMeta = (expDate?: string) => {
            if (!expDate) return { statusType: 'ok' as const, daysLeft: 365, expiryLabel: 'Valid' };
            const exp = new Date(expDate);
            const now = new Date();
            const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (isNaN(diff)) return { statusType: 'ok' as const, daysLeft: 365, expiryLabel: 'Valid' };
            if (diff < 0) return { statusType: 'late' as const, daysLeft: diff, expiryLabel: `Expired ${Math.abs(diff)}d ago` };
            if (diff <= 30) return { statusType: 'soon' as const, daysLeft: diff, expiryLabel: `Expires in ${diff}d` };
            return { statusType: 'ok' as const, daysLeft: diff, expiryLabel: `Valid (${diff}d left)` };
          };

          const docsToAdd: DocumentCompliance[] = [];
          const createDoc = (name: string, exp?: string, photo?: string | null) => {
            if (!exp && !photo) return;
            const meta = calcMeta(exp);
            docsToAdd.push({
              id: 'vc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              entityName: cleanReg,
              entityType: 'Vehicle',
              documentName: name,
              expiryDate: exp || '',
              documentPhoto: photo || null,
              expiryLabel: meta.expiryLabel,
              statusType: meta.statusType,
              daysLeft: meta.daysLeft
            });
          };

          createDoc('Registration Certificate (RC)', vehicleData.rcExpiry, vehicleData.rcPhoto);
          createDoc('Commercial Insurance Policy', vehicleData.insuranceExpiry, vehicleData.insurancePhoto);
          createDoc('Pollution Under Control (PUCC)', vehicleData.pollutionExpiry, vehicleData.pollutionPhoto);
          createDoc('Commercial Vehicle Permit', vehicleData.permitExpiry, vehicleData.permitPhoto);
          createDoc('Permit Authorization (Auth)', vehicleData.authExpiry, vehicleData.authPhoto);

          if (docsToAdd.length > 0) {
            setVehicleCompliance(prev => [...docsToAdd, ...prev]);
          }

          showToast(
            'success',
            `Vehicle ${serverVehicle.registrationNumber} onboarded with 5 compliance documents.`,
            'Vehicle Registered'
          );
          return { success: true, vehicle: serverVehicle };
        } else if (res.error) {
          showToast('error', res.error, 'Registration Error');
          return { success: false, error: res.error };
        }
      } catch (apiErr: any) {
        const msg = apiErr.message || 'Registration failed';
        showToast('error', msg, 'Registration Failed');
        return { success: false, error: msg };
      }

      // 2. Fallback if offline
      const newVehicle: Vehicle = {
        ...vehicleData,
        id: 'v_' + Date.now(),
        revenue: vehicleData.revenue || 0,
        expense: vehicleData.expense || 0,
        profit: (vehicleData.revenue || 0) - (vehicleData.expense || 0)
      };
      setVehicles(prev => [newVehicle, ...prev]);

      const cleanReg = newVehicle.registrationNumber;
      const calcMeta = (expDate?: string) => {
        if (!expDate) return { statusType: 'ok' as const, daysLeft: 365, expiryLabel: 'Valid' };
        const exp = new Date(expDate);
        const now = new Date();
        const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (isNaN(diff)) return { statusType: 'ok' as const, daysLeft: 365, expiryLabel: 'Valid' };
        if (diff < 0) return { statusType: 'late' as const, daysLeft: diff, expiryLabel: `Expired ${Math.abs(diff)}d ago` };
        if (diff <= 30) return { statusType: 'soon' as const, daysLeft: diff, expiryLabel: `Expires in ${diff}d` };
        return { statusType: 'ok' as const, daysLeft: diff, expiryLabel: `Valid (${diff}d left)` };
      };

      const docsToAdd: DocumentCompliance[] = [];
      const createDoc = (name: string, exp?: string, photo?: string | null) => {
        if (!exp && !photo) return;
        const meta = calcMeta(exp);
        docsToAdd.push({
          id: 'vc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          entityName: cleanReg,
          entityType: 'Vehicle',
          documentName: name,
          expiryDate: exp || '',
          documentPhoto: photo || null,
          expiryLabel: meta.expiryLabel,
          statusType: meta.statusType,
          daysLeft: meta.daysLeft
        });
      };

      createDoc('Registration Certificate (RC)', vehicleData.rcExpiry, vehicleData.rcPhoto);
      createDoc('Commercial Insurance Policy', vehicleData.insuranceExpiry, vehicleData.insurancePhoto);
      createDoc('Pollution Under Control (PUCC)', vehicleData.pollutionExpiry, vehicleData.pollutionPhoto);
      createDoc('Commercial Vehicle Permit', vehicleData.permitExpiry, vehicleData.permitPhoto);
      createDoc('Permit Authorization (Auth)', vehicleData.authExpiry, vehicleData.authPhoto);

      if (docsToAdd.length > 0) {
        setVehicleCompliance(prev => [...docsToAdd, ...prev]);
      }

      showToast(
        'success',
        `Vehicle ${newVehicle.registrationNumber} added to ${newVehicle.type} fleet.`,
        'Vehicle Registered'
      );
      return { success: true, vehicle: newVehicle };
    } catch (err: any) {
      console.error('Failed to add vehicle', err);
      showToast('error', err.message || 'Failed to register vehicle.', 'System Error');
      return { success: false, error: err.message };
    }
  };

  const updateVehicleStatus = async (id: string, status: VehicleStatus) => {
    try {
      setVehicles(prev =>
        prev.map(v => (v.id === id ? { ...v, status } : v))
      );
      showToast('info', `Vehicle duty status updated to "${status}".`, 'Status Changed');
      try {
        await api.put(`/vehicles/${id}`, { status });
      } catch (e) {
        // silent local fallback
      }
    } catch (err) {
      console.error('Failed to update vehicle status', err);
      showToast('error', 'Could not update vehicle status.', 'Error');
    }
  };

  const switchVehicleMode = async (id: string, mode: VehicleType) => {
    try {
      let updatedMeta = '';
      setVehicles(prev =>
        prev.map(v => {
          if (v.id === id) {
            updatedMeta =
              mode === 'Trip-based'
                ? `Weekend Trip Duty · ${v.assignedTo}`
                : `${v.departmentName || v.assignedTo} Department Duty`;
            return {
              ...v,
              currentOperationMode: mode,
              meta: updatedMeta
            };
          }
          return v;
        })
      );
      showToast('info', `Vehicle operation mode switched to ${mode}.`, 'Mode Switched');
      try {
        await api.put(`/vehicles/${id}`, { currentOperationMode: mode, meta: updatedMeta });
      } catch (e) {
        // silent local fallback
      }
    } catch (err) {
      console.error('Failed to switch vehicle mode', err);
      showToast('error', 'Failed to switch vehicle mode.', 'Error');
    }
  };

  const addFuelLog = (entryData: Omit<FuelLogEntry, 'id'>) => {
    try {
      if (!entryData.vehicle || !entryData.litres || !entryData.totalCost) {
        showToast('error', 'Please fill vehicle, litres and total amount.', 'Missing Fields');
        return;
      }
      const newFuel: FuelLogEntry = {
        ...entryData,
        id: 'fuel_' + Date.now()
      };
      setFuelLogs(prev => [newFuel, ...prev]);

      // Automatically sync with fleet expenses
      const expEntry: ExpenseRecord = {
        id: 'e_' + Date.now(),
        date: newFuel.date,
        vehicle: newFuel.vehicle,
        category: 'Fuel',
        linkedTo: `${newFuel.stationName} (${newFuel.litres}L @ ₹${newFuel.ratePerLitre}/L)`,
        amount: newFuel.totalCost
      };
      setExpenses(prev => [expEntry, ...prev]);
      showToast(
        'success',
        `Logged ₹${newFuel.totalCost.toLocaleString('en-IN')} (${newFuel.litres}L) for ${newFuel.vehicle}.`,
        'Fuel Refill Recorded'
      );
    } catch (err) {
      console.error('Failed to add fuel log', err);
      showToast('error', 'Could not record fuel refill.', 'Error');
    }
  };

  const addFastagTransaction = (txData: Omit<FastagTransaction, 'id'>) => {
    try {
      const newTx: FastagTransaction = {
        ...txData,
        id: 'ft_' + Date.now()
      };
      setFastagTransactions(prev => [newTx, ...prev]);

      // Update vehicle's fastag balance
      setVehicles(prev =>
        prev.map(v => {
          if (v.registrationNumber === newTx.vehicle) {
            const currentBal = v.fastagBalance || 0;
            const newBal =
              newTx.type === 'Recharge'
                ? currentBal + newTx.amount
                : Math.max(0, currentBal - newTx.amount);
            return { ...v, fastagBalance: newBal };
          }
          return v;
        })
      );

      // If toll deduction, auto record in fleet expenses
      if (newTx.type === 'Toll Deduction') {
        const tollExp: ExpenseRecord = {
          id: 'e_' + Date.now(),
          date: newTx.date,
          vehicle: newTx.vehicle,
          category: 'FASTag / Toll',
          linkedTo: `${newTx.tollPlaza || 'Toll Plaza'} (${newTx.transactionRef})`,
          amount: newTx.amount
        };
        setExpenses(prev => [tollExp, ...prev]);
        showToast(
          'info',
          `Toll deduction of ₹${newTx.amount.toLocaleString('en-IN')} recorded for ${newTx.vehicle}.`,
          'Toll Deducted'
        );
      }
    } catch (err) {
      console.error('Failed to record FASTag transaction', err);
      showToast('error', 'FASTag transaction could not be recorded.', 'Error');
    }
  };

  const rechargeFastag = (
    vehicleReg: string,
    amount: number,
    paymentMode: string,
    proof?: string | null
  ) => {
    try {
      if (!vehicleReg || amount <= 0) {
        showToast('error', 'Valid vehicle and recharge amount greater than 0 required.', 'Invalid Input');
        return;
      }
      const v = vehicles.find(item => item.registrationNumber === vehicleReg);
      const prevBal = v?.fastagBalance || 0;
      const newBal = prevBal + amount;

      const tx: FastagTransaction = {
        id: 'ft_' + Date.now(),
        vehicle: vehicleReg,
        tagId: v?.fastagTagId || 'TAG-FASTAG',
        type: 'Recharge',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        tollPlaza: `${v?.fastagBank || 'FASTag'} Wallet Recharge (${paymentMode})`,
        amount,
        balanceAfter: newBal,
        transactionRef: `REC-${Date.now().toString().slice(-8)}`,
        linkedDutyOrTrip: 'Wallet Topup',
        proofSlip: proof || null,
        status: 'Successful'
      };

      setFastagTransactions(prev => [tx, ...prev]);
      setVehicles(prev =>
        prev.map(item =>
          item.registrationNumber === vehicleReg ? { ...item, fastagBalance: newBal } : item
        )
      );
      showToast(
        'success',
        `₹${amount.toLocaleString('en-IN')} added to ${vehicleReg} FASTag wallet (New Balance: ₹${newBal.toLocaleString('en-IN')}).`,
        'Recharge Complete'
      );
    } catch (err) {
      console.error('Failed to recharge FASTag', err);
      showToast('error', 'FASTag recharge failed.', 'Error');
    }
  };

  const updateFastagDetails = (vehicleReg: string, balance: number, bank?: string, tagId?: string) => {
    try {
      setVehicles(prev =>
        prev.map(item => {
          if (item.registrationNumber === vehicleReg) {
            return {
              ...item,
              fastagBalance: balance,
              fastagBank: bank !== undefined ? bank : item.fastagBank,
              fastagTagId: tagId !== undefined ? tagId : item.fastagTagId
            };
          }
          return item;
        })
      );
      showToast('success', `FASTag balance updated to ₹${balance.toLocaleString('en-IN')} for ${vehicleReg}.`, 'FASTag Updated');
    } catch (err) {
      console.error('Failed to update FASTag details', err);
      showToast('error', 'Could not update FASTag details.', 'Error');
    }
  };

  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    try {
      const newExpense: ExpenseRecord = {
        ...expenseData,
        id: 'e_' + Date.now()
      };
      setExpenses(prev => [newExpense, ...prev]);
      showToast('success', `Expense of ₹${newExpense.amount.toLocaleString('en-IN')} logged under ${newExpense.category}.`, 'Expense Logged');
    } catch (err) {
      console.error('Failed to add expense', err);
      showToast('error', 'Failed to log expense.', 'Error');
    }
  };

  const addTrip = (tripData: Omit<TripFinancial, 'id'>) => {
    try {
      if (!tripData.vehicle || !tripData.route || !tripData.revenue) {
        showToast('error', 'Please provide vehicle, route and customer revenue.', 'Missing Information');
        return;
      }
      const totalExp =
        tripData.fuelCost +
        tripData.fastagCost +
        tripData.driverBata +
        (tripData.otherExpenses || 0);
      const netProfit = tripData.revenue - totalExp;
      const margin =
        tripData.revenue > 0 ? ((netProfit / tripData.revenue) * 100).toFixed(1) + '%' : '0%';

      const newTrip: TripFinancial = {
        ...tripData,
        id: 't_' + Date.now(),
        tripNumber: tripData.tripNumber || `TRIP-${Math.floor(Math.random() * 9000 + 1000)}`,
        expenses: totalExp,
        profit: netProfit,
        margin
      };

      setTrips(prev => [newTrip, ...prev]);

      // Also sync initial trip fuel and FASTag expenses into fleet expenses
      if (newTrip.fuelCost > 0) {
        setExpenses(prev => [
          {
            id: 'e_fuel_' + Date.now(),
            date: newTrip.startDate,
            vehicle: newTrip.vehicle,
            category: 'Fuel',
            linkedTo: `Trip ${newTrip.tripNumber}: ${newTrip.route}`,
            amount: newTrip.fuelCost
          },
          ...prev
        ]);
      }

      if (newTrip.fastagCost > 0) {
        setExpenses(prev => [
          {
            id: 'e_fastag_' + Date.now(),
            date: newTrip.startDate,
            vehicle: newTrip.vehicle,
            category: 'FASTag / Toll',
            linkedTo: `Trip ${newTrip.tripNumber}: ${newTrip.route}`,
            amount: newTrip.fastagCost
          },
          ...prev
        ]);
      }
      showToast('success', `Trip #${newTrip.tripNumber} (${newTrip.route}) booked for ₹${newTrip.revenue.toLocaleString('en-IN')}.`, 'Trip Created');
    } catch (err) {
      console.error('Failed to add trip', err);
      showToast('error', 'Failed to create trip.', 'Error');
    }
  };

  const completeTrip = (
    id: string,
    data: {
      endOdometer: number;
      fuelCost: number;
      fastagCost: number;
      driverBata: number;
      otherExpenses?: number;
      notes?: string;
    }
  ) => {
    try {
      setTrips(prev =>
        prev.map(t => {
          if (t.id === id) {
            const totalKm = Math.max(0, data.endOdometer - t.startOdometer);
            const totalExp =
              data.fuelCost + data.fastagCost + data.driverBata + (data.otherExpenses || 0);
            const profit = t.revenue - totalExp;
            const margin = t.revenue > 0 ? ((profit / t.revenue) * 100).toFixed(1) + '%' : '0%';

            return {
              ...t,
              endOdometer: data.endOdometer,
              totalKmRun: totalKm,
              fuelCost: data.fuelCost,
              fastagCost: data.fastagCost,
              driverBata: data.driverBata,
              otherExpenses: data.otherExpenses || 0,
              expenses: totalExp,
              profit,
              margin,
              status: 'Completed',
              endDate: new Date().toISOString().split('T')[0],
              notes: data.notes || t.notes
            };
          }
          return t;
        })
      );
      showToast('success', 'Trip marked completed and net profit recorded.', 'Trip Completed');
    } catch (err) {
      console.error('Failed to complete trip', err);
      showToast('error', 'Could not complete trip.', 'Error');
    }
  };

  const addDriver = async (driverData: Omit<Driver, 'id'>) => {
    try {
      if (!driverData.name?.trim()) {
        showToast('error', 'Driver full name is mandatory.', 'Validation Error');
        return { success: false, error: 'Driver full name is mandatory.' };
      }
      if (!driverData.phone?.trim()) {
        showToast('error', 'Driver phone number is mandatory.', 'Validation Error');
        return { success: false, error: 'Driver phone number is mandatory.' };
      }

      // 1. Post to backend Driver API
      try {
        const res = await api.post('/drivers', driverData);
        if (res.success && res.data) {
          const serverDriver: Driver = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setDrivers(prev => [serverDriver, ...prev.filter(d => d.id !== serverDriver.id)]);

          // If assignedVehicle was specified, sync with local vehicle state
          if (serverDriver.assignedVehicle && serverDriver.assignedVehicle !== '—') {
            setVehicles(prev =>
              prev.map(v =>
                v.registrationNumber === serverDriver.assignedVehicle
                  ? { ...v, assignedDriver: serverDriver.name }
                  : v
              )
            );
          }

          showToast(
            'success',
            `Driver ${serverDriver.name} added to ${serverDriver.driverType || 'roster'}.`,
            'Driver Registered'
          );
          return { success: true, driver: serverDriver };
        } else if (res.error) {
          showToast('error', res.error, 'Registration Error');
          return { success: false, error: res.error };
        }
      } catch (apiErr: any) {
        const msg = apiErr.message || 'Registration failed';
        showToast('error', msg, 'Registration Failed');
        return { success: false, error: msg };
      }

      // 2. Offline fallback
      const newDriver: Driver = {
        ...driverData,
        id: 'd_' + Date.now()
      };
      setDrivers(prev => [newDriver, ...prev]);
      showToast(
        'success',
        `Driver ${newDriver.name} added to ${newDriver.driverType || 'roster'}.`,
        'Driver Registered'
      );
      return { success: true, driver: newDriver };
    } catch (err: any) {
      console.error('Failed to add driver', err);
      showToast('error', err.message || 'Could not register driver.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const updateDriverStatus = async (id: string, status: 'On duty' | 'Off duty') => {
    try {
      setDrivers(prev =>
        prev.map(d => (d.id === id ? { ...d, status } : d))
      );
      showToast('info', `Driver duty status updated to "${status}".`, 'Status Updated');
      try {
        await api.patch(`/drivers/${id}/status`, { status });
      } catch {
        // Silent fallback for offline
      }
    } catch (err) {
      console.error('Failed to update driver status', err);
      showToast('error', 'Could not update driver status.', 'Error');
    }
  };

  const updateDriver = async (id: string, data: Partial<Driver>) => {
    try {
      try {
        const res = await api.put(`/drivers/${id}`, data);
        if (res.success && res.data) {
          const updated: Driver = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setDrivers(prev => prev.map(d => (d.id === id ? updated : d)));
          showToast('success', `Driver ${updated.name} updated successfully.`, 'Driver Updated');
          return { success: true, driver: updated };
        }
      } catch (apiErr: any) {
        showToast('error', apiErr.message || 'Failed to update driver.', 'Update Failed');
        return { success: false, error: apiErr.message };
      }

      // Offline fallback
      setDrivers(prev => prev.map(d => (d.id === id ? { ...d, ...data } : d)));
      showToast('success', 'Driver updated locally.', 'Driver Updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update driver', err);
      showToast('error', 'Could not update driver.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      const targetDriver = drivers.find(d => d.id === id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      if (targetDriver?.assignedVehicle && targetDriver.assignedVehicle !== '—') {
        setVehicles(prev =>
          prev.map(v =>
            v.registrationNumber === targetDriver.assignedVehicle && v.assignedDriver === targetDriver.name
              ? { ...v, assignedDriver: undefined }
              : v
          )
        );
      }
      showToast('info', `Driver ${targetDriver?.name || ''} removed from roster.`, 'Driver Deleted');
      try {
        await api.delete(`/drivers/${id}`);
        return { success: true };
      } catch (apiErr: any) {
        return { success: false, error: apiErr.message };
      }
    } catch (err: any) {
      console.error('Failed to delete driver', err);
      showToast('error', 'Could not delete driver.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const markAttendance = (recordData: Omit<DriverAttendance, 'id'>) => {
    try {
      const newRec: DriverAttendance = {
        ...recordData,
        id: 'att_' + Date.now()
      };
      setAttendanceRecords(prev => [newRec, ...prev]);
      showToast('success', `Attendance marked as ${newRec.status} for ${newRec.driverName}.`, 'Attendance Logged');
    } catch (err) {
      console.error('Failed to mark attendance', err);
      showToast('error', 'Could not record attendance.', 'Error');
    }
  };

  const updateAttendanceStatus = (id: string, status: AttendanceStatus) => {
    try {
      setAttendanceRecords(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Attendance updated to ${status}.`, 'Attendance Updated');
    } catch (err) {
      console.error('Failed to update attendance', err);
      showToast('error', 'Attendance status update failed.', 'Error');
    }
  };

  const addDriverExpense = (expenseData: Omit<DriverExpenseItem, 'id'>) => {
    try {
      const newExp: DriverExpenseItem = {
        ...expenseData,
        id: 'de_' + Date.now()
      };
      setDriverExpenses(prev => [newExp, ...prev]);
      showToast('success', `Driver expense of ₹${newExp.amount.toLocaleString('en-IN')} (${newExp.category}) recorded for ${newExp.driverName}.`, 'Expense Saved');
    } catch (err) {
      console.error('Failed to add driver expense', err);
      showToast('error', 'Failed to record driver expense.', 'Error');
    }
  };

  const updateDriverExpenseStatus = (id: string, status: 'Approved' | 'Pending' | 'Paid') => {
    try {
      setDriverExpenses(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Expense status updated to ${status}.`, 'Status Updated');
    } catch (err) {
      console.error('Failed to update expense status', err);
      showToast('error', 'Could not update expense status.', 'Error');
    }
  };

  // Department Actions
  const addDepartmentContract = (contractData: Omit<DepartmentContract, 'id'>) => {
    try {
      if (!contractData.contractNumber || !contractData.departmentName) {
        showToast('error', 'Contract number and department name are required.', 'Missing Fields');
        return;
      }
      const newContract: DepartmentContract = {
        ...contractData,
        id: 'cnt_' + Date.now()
      };
      setDepartmentContracts(prev => [newContract, ...prev]);
      showToast('success', `Contract ${newContract.contractNumber} (${newContract.departmentName}) added.`, 'Contract Registered');
    } catch (err) {
      console.error('Failed to add contract', err);
      showToast('error', 'Could not register department contract.', 'Error');
    }
  };

  const updateContractStatus = (id: string, status: DepartmentContract['status']) => {
    try {
      setDepartmentContracts(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Contract status changed to ${status}.`, 'Contract Updated');
    } catch (err) {
      console.error('Failed to update contract status', err);
      showToast('error', 'Could not update contract status.', 'Error');
    }
  };

  const addDailyDutyLog = (logData: Omit<DailyDutyLog, 'id'>) => {
    try {
      const newLog: DailyDutyLog = {
        ...logData,
        id: 'log_' + Date.now()
      };
      setDailyDutyLogs(prev => [newLog, ...prev]);

      // Auto record fuel expense if entered in duty slip
      if (newLog.fuelAmount && newLog.fuelAmount > 0) {
        const fuelExp: ExpenseRecord = {
          id: 'e_' + Date.now(),
          date: newLog.date,
          vehicle: newLog.vehicle,
          category: 'Fuel',
          linkedTo: `Duty ${newLog.dutySlipNumber} (${newLog.departmentName})`,
          amount: newLog.fuelAmount
        };
        setExpenses(prev => [fuelExp, ...prev]);
      }
      showToast('success', `Duty slip #${newLog.dutySlipNumber} (${newLog.vehicle}) recorded successfully.`, 'Duty Slip Saved');
    } catch (err) {
      console.error('Failed to add duty log', err);
      showToast('error', 'Could not save duty log.', 'Error');
    }
  };

  const updateDailyDutyLogStatus = (id: string, status: DailyDutyLog['status']) => {
    try {
      setDailyDutyLogs(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Duty log status changed to ${status}.`, 'Log Updated');
    } catch (err) {
      console.error('Failed to update duty log status', err);
      showToast('error', 'Could not update duty log status.', 'Error');
    }
  };

  const addMonthlyBill = (billData: Omit<MonthlyDepartmentBill, 'id'>) => {
    try {
      const newBill: MonthlyDepartmentBill = {
        ...billData,
        id: 'bill_' + Date.now()
      };
      setMonthlyBills(prev => [newBill, ...prev]);
      showToast('success', `Invoice ${newBill.billNumber} for ₹${newBill.totalBill.toLocaleString('en-IN')} created.`, 'Invoice Generated');
    } catch (err) {
      console.error('Failed to generate bill', err);
      showToast('error', 'Failed to generate invoice.', 'Error');
    }
  };

  const updateBillStatus = (id: string, status: MonthlyDepartmentBill['status']) => {
    try {
      setMonthlyBills(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Invoice status marked as ${status}.`, 'Invoice Updated');
    } catch (err) {
      console.error('Failed to update bill status', err);
      showToast('error', 'Could not update invoice status.', 'Error');
    }
  };

  const addDepartmentPayment = (paymentData: Omit<DepartmentPayment, 'id'>) => {
    try {
      const newPay: DepartmentPayment = {
        ...paymentData,
        id: 'pay_' + Date.now()
      };
      setDepartmentPayments(prev => [newPay, ...prev]);
      showToast('success', `Payment of ₹${newPay.amountPaid.toLocaleString('en-IN')} recorded for ${newPay.departmentName}.`, 'Payment Recorded');
    } catch (err) {
      console.error('Failed to record department payment', err);
      showToast('error', 'Could not record payment.', 'Error');
    }
  };

  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id' | 'status'>) => {
    try {
      const newRecord: MaintenanceRecord = {
        ...recordData,
        id: 'm_' + Date.now(),
        status: 'Completed'
      };
      setMaintenanceRecords(prev => [newRecord, ...prev]);
      showToast('success', `${newRecord.type} for ${newRecord.vehicle} (₹${newRecord.cost.toLocaleString('en-IN')}) saved.`, 'Maintenance Logged');
    } catch (err) {
      console.error('Failed to add maintenance record', err);
      showToast('error', 'Failed to save maintenance record.', 'Error');
    }
  };

  const addVehicleComplianceDoc = (docData: Omit<DocumentCompliance, 'id'>) => {
    try {
      const newDoc: DocumentCompliance = {
        ...docData,
        id: 'vdoc_' + Date.now()
      };
      setVehicleCompliance(prev => [newDoc, ...prev]);
      showToast('success', `${newDoc.documentName} for vehicle ${newDoc.entityName} uploaded.`, 'Compliance Updated');
    } catch (err) {
      console.error('Failed to add vehicle compliance doc', err);
      showToast('error', 'Could not save compliance document.', 'Error');
    }
  };

  const addDriverComplianceDoc = (docData: Omit<DocumentCompliance, 'id'>) => {
    try {
      const newDoc: DocumentCompliance = {
        ...docData,
        id: 'ddoc_' + Date.now()
      };
      setDriverCompliance(prev => [newDoc, ...prev]);
      showToast('success', `${newDoc.documentName} for driver ${newDoc.entityName} verified and saved.`, 'Compliance Updated');
    } catch (err) {
      console.error('Failed to add driver compliance doc', err);
      showToast('error', 'Could not save driver compliance doc.', 'Error');
    }
  };

  const complianceStats = useMemo(() => {
    const allDocs = [...vehicleCompliance, ...driverCompliance];
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let driverDueCount = 0;
    const alerts: AlertItem[] = [];

    allDocs.forEach(doc => {
      if (doc.statusType === 'soon') {
        expiringSoonCount++;
        alerts.push({
          type: 'soon',
          who: doc.entityName,
          doc: doc.documentName,
          text: doc.expiryLabel
        });
      } else if (doc.statusType === 'late') {
        expiredCount++;
        alerts.push({
          type: 'late',
          who: doc.entityName,
          doc: doc.documentName,
          text: doc.expiryLabel
        });
      }
    });

    driverCompliance.forEach(doc => {
      if (doc.statusType === 'soon' || doc.statusType === 'late') {
        driverDueCount++;
      }
    });

    // Sort alerts: expired ('late') first
    alerts.sort((a, b) => (a.type === 'late' ? -1 : 1));

    return {
      expiringSoonCount,
      expiredCount,
      driverDueCount,
      totalDocsCount: allDocs.length,
      alerts
    };
  }, [vehicleCompliance, driverCompliance]);

  const pageHeader = pageHeaders[activePage];

  return (
    <FleetContext.Provider
      value={{
        activePage,
        setActivePage: handleSetActivePage,
        pageHeader,
        searchQuery,
        setSearchQuery,
        isLoading,
        loadingKey,
        refreshData,
        withLoading,
        toasts,
        showToast,
        dismissToast,
        driverSubTab,
        setDriverSubTab,
        departmentSubTab,
        setDepartmentSubTab,
        departmentContracts,
        addDepartmentContract,
        updateContractStatus,
        dailyDutyLogs,
        addDailyDutyLog,
        updateDailyDutyLogStatus,
        monthlyBills,
        addMonthlyBill,
        updateBillStatus,
        departmentPayments,
        addDepartmentPayment,
        vehicleSubTab,
        setVehicleSubTab,
        vehicles,
        addVehicle,
        updateVehicleStatus,
        switchVehicleMode,
        drivers,
        addDriver,
        updateDriverStatus,
        updateDriver,
        deleteDriver,
        attendanceRecords,
        markAttendance,
        updateAttendanceStatus,
        driverExpenses,
        addDriverExpense,
        updateDriverExpenseStatus,
        contracts,
        trips,
        addTrip,
        completeTrip,
        expenses,
        addExpense,
        expenseSubTab,
        setExpenseSubTab,
        fuelLogs,
        addFuelLog,
        fastagTransactions,
        addFastagTransaction,
        rechargeFastag,
        updateFastagDetails,
        maintenanceRecords,
        addMaintenanceRecord,
        vehicleCompliance,
        addVehicleComplianceDoc,
        driverCompliance,
        addDriverComplianceDoc,
        complianceStats
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export { useFleet } from './useFleet';
