import React, { createContext, useContext, useState, useMemo } from 'react';
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
  MaintenanceRecord
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
  const [vehicleCompliance] = useState<DocumentCompliance[]>(vehicleComplianceDocs);
  const [driverCompliance] = useState<DocumentCompliance[]>(driverComplianceDocs);
  
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(initialMaintenanceRecords);

  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'v_' + Date.now(),
      revenue: vehicleData.revenue || 0,
      expense: vehicleData.expense || 0,
      profit: (vehicleData.revenue || 0) - (vehicleData.expense || 0)
    };
    setVehicles(prev => [newVehicle, ...prev]);
  };

  const updateVehicleStatus = (id: string, status: VehicleStatus) => {
    setVehicles(prev =>
      prev.map(v => (v.id === id ? { ...v, status } : v))
    );
  };

  const switchVehicleMode = (id: string, mode: VehicleType) => {
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === id) {
          return {
            ...v,
            currentOperationMode: mode,
            meta:
              mode === 'Trip-based'
                ? `Weekend Trip Duty · ${v.assignedTo}`
                : `${v.departmentName || v.assignedTo} Department Duty`
          };
        }
        return v;
      })
    );
  };

  const addFuelLog = (entryData: Omit<FuelLogEntry, 'id'>) => {
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
  };

  const addFastagTransaction = (txData: Omit<FastagTransaction, 'id'>) => {
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
    }
  };

  const rechargeFastag = (
    vehicleReg: string,
    amount: number,
    paymentMode: string,
    proof?: string | null
  ) => {
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
  };

  const updateFastagDetails = (vehicleReg: string, balance: number, bank?: string, tagId?: string) => {
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
  };

  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: 'e_' + Date.now()
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const addTrip = (tripData: Omit<TripFinancial, 'id'>) => {
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
  };

  const addDriver = (driverData: Omit<Driver, 'id'>) => {
    const newDriver: Driver = {
      ...driverData,
      id: 'd_' + Date.now()
    };
    setDrivers(prev => [newDriver, ...prev]);
  };

  const markAttendance = (recordData: Omit<DriverAttendance, 'id'>) => {
    const newRec: DriverAttendance = {
      ...recordData,
      id: 'att_' + Date.now()
    };
    setAttendanceRecords(prev => [newRec, ...prev]);
  };

  const updateAttendanceStatus = (id: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const addDriverExpense = (expenseData: Omit<DriverExpenseItem, 'id'>) => {
    const newExp: DriverExpenseItem = {
      ...expenseData,
      id: 'de_' + Date.now()
    };
    setDriverExpenses(prev => [newExp, ...prev]);
  };

  const updateDriverExpenseStatus = (id: string, status: 'Approved' | 'Pending' | 'Paid') => {
    setDriverExpenses(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  // Department Actions
  const addDepartmentContract = (contractData: Omit<DepartmentContract, 'id'>) => {
    const newContract: DepartmentContract = {
      ...contractData,
      id: 'cnt_' + Date.now()
    };
    setDepartmentContracts(prev => [newContract, ...prev]);
  };

  const updateContractStatus = (id: string, status: DepartmentContract['status']) => {
    setDepartmentContracts(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const addDailyDutyLog = (logData: Omit<DailyDutyLog, 'id'>) => {
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
  };

  const updateDailyDutyLogStatus = (id: string, status: DailyDutyLog['status']) => {
    setDailyDutyLogs(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const addMonthlyBill = (billData: Omit<MonthlyDepartmentBill, 'id'>) => {
    const newBill: MonthlyDepartmentBill = {
      ...billData,
      id: 'bill_' + Date.now()
    };
    setMonthlyBills(prev => [newBill, ...prev]);
  };

  const updateBillStatus = (id: string, status: MonthlyDepartmentBill['status']) => {
    setMonthlyBills(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
  };

  const addDepartmentPayment = (paymentData: Omit<DepartmentPayment, 'id'>) => {
    const newPay: DepartmentPayment = {
      ...paymentData,
      id: 'pay_' + Date.now()
    };
    setDepartmentPayments(prev => [newPay, ...prev]);
  };

  const addMaintenanceRecord = (recordData: Omit<MaintenanceRecord, 'id' | 'status'>) => {
    const newRecord: MaintenanceRecord = {
      ...recordData,
      id: 'm_' + Date.now(),
      status: 'Completed'
    };
    setMaintenanceRecords(prev => [newRecord, ...prev]);
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
        setActivePage,
        pageHeader,
        searchQuery,
        setSearchQuery,
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
        driverCompliance,
        complianceStats
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export { useFleet } from './useFleet';
