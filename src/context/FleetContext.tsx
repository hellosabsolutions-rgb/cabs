import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  bookings: { title: 'Booking', subtitle: 'Commercial, outstation and advance bookings management' },
  trips: { title: 'Booking', subtitle: 'Commercial, outstation and advance bookings management' },
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
  const location = useLocation();
  const navigate = useNavigate();

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

  // Synchronize route pathname with activePage and subTabs
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path === '/' || path.startsWith('/dashboard')) {
      setActivePage('dashboard');
    } else if (path.startsWith('/vehicles')) {
      setActivePage('vehicles');
    } else if (path.startsWith('/drivers')) {
      setActivePage('drivers');
      if (path.includes('/attendance')) setDriverSubTab('attendance');
      else if (path.includes('/expenses')) setDriverSubTab('expenses');
      else setDriverSubTab('list');
    } else if (path.startsWith('/departments')) {
      setActivePage('departments');
      if (path.includes('/duty-logs')) setDepartmentSubTab('duty-logs');
      else if (path.includes('/billing')) setDepartmentSubTab('billing');
      else if (path.includes('/payments')) setDepartmentSubTab('payments');
      else setDepartmentSubTab('contracts');
    } else if (path.startsWith('/bookings') || path.startsWith('/trips')) {
      setActivePage('bookings');
    } else if (path.startsWith('/expenses')) {
      setActivePage('expenses');
      if (path.includes('/fuel')) setExpenseSubTab('fuel');
      else if (path.includes('/all')) setExpenseSubTab('all');
      else setExpenseSubTab('fastag');
    } else if (path.startsWith('/profitability')) {
      setActivePage('profitability');
    } else if (path.startsWith('/compliance')) {
      setActivePage('compliance');
    } else if (path.startsWith('/maintenance')) {
      setActivePage('maintenance');
    }
  }, [location.pathname]);

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
    setActivePage(page);
    const targetMap: Record<PageId, string> = {
      dashboard: '/dashboard',
      vehicles: '/vehicles',
      drivers: driverSubTab === 'attendance' ? '/drivers/attendance' : driverSubTab === 'expenses' ? '/drivers/expenses' : '/drivers/list',
      departments: departmentSubTab === 'duty-logs' ? '/departments/duty-logs' : departmentSubTab === 'billing' ? '/departments/billing' : departmentSubTab === 'payments' ? '/departments/payments' : '/departments/contracts',
      bookings: '/booking',
      trips: '/booking',
      expenses: expenseSubTab === 'fuel' ? '/expenses/fuel' : expenseSubTab === 'all' ? '/expenses/all' : '/expenses/fastag',
      profitability: '/profitability',
      compliance: '/compliance',
      maintenance: '/maintenance'
    };
    const target = targetMap[page] || `/${page}`;
    if (location.pathname !== target) {
      navigate(target);
    }
  };

  const handleSetDriverSubTab = (tab: DriverSubTab) => {
    setDriverSubTab(tab);
    const target = `/drivers/${tab}`;
    if (location.pathname !== target) {
      navigate(target);
    }
  };

  const handleSetDepartmentSubTab = (tab: DepartmentSubTab) => {
    setDepartmentSubTab(tab);
    const target = `/departments/${tab}`;
    if (location.pathname !== target) {
      navigate(target);
    }
  };

  const handleSetExpenseSubTab = (tab: 'fuel' | 'fastag' | 'all') => {
    setExpenseSubTab(tab);
    const target = `/expenses/${tab}`;
    if (location.pathname !== target) {
      navigate(target);
    }
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

  // Fetch contracts from live backend API
  const fetchLiveContracts = async () => {
    try {
      const res = await api.get('/contracts?limit=100');
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDepartmentContracts(res.data);
      }
    } catch (err) {
      console.warn('Backend contracts API not reachable, using local contracts cache.', err);
    }
  };

  // Fetch compliance documents & live expiry calculation from backend API
  const fetchLiveCompliance = async () => {
    try {
      const res = await api.get('/compliance/expiry');
      if (res.success && res.data) {
        if (Array.isArray(res.data.vehicleDocs) && res.data.vehicleDocs.length > 0) {
          setVehicleCompliance(res.data.vehicleDocs);
        }
        if (Array.isArray(res.data.driverDocs) && res.data.driverDocs.length > 0) {
          setDriverCompliance(res.data.driverDocs);
        }
      }
    } catch (err) {
      console.warn('Backend compliance API not reachable, using local compliance cache.', err);
    }
  };

  // Fetch attendance from live backend API (supports date, month, or year)
  const fetchLiveAttendance = async (queryParam?: string | { date?: string; month?: string; year?: string }) => {
    try {
      let endpoint = '/attendance?limit=500';
      if (typeof queryParam === 'string') {
        if (queryParam.length === 7) {
          endpoint = `/attendance?month=${encodeURIComponent(queryParam)}&limit=500`;
        } else if (queryParam.length === 4) {
          endpoint = `/attendance?year=${encodeURIComponent(queryParam)}&limit=500`;
        } else if (queryParam) {
          endpoint = `/attendance?date=${encodeURIComponent(queryParam)}&limit=100`;
        }
      } else if (queryParam && typeof queryParam === 'object') {
        if (queryParam.month) endpoint = `/attendance?month=${encodeURIComponent(queryParam.month)}&limit=500`;
        else if (queryParam.year) endpoint = `/attendance?year=${encodeURIComponent(queryParam.year)}&limit=500`;
        else if (queryParam.date) endpoint = `/attendance?date=${encodeURIComponent(queryParam.date)}&limit=100`;
      }

      const res = await api.get(endpoint);
      if (res.success && Array.isArray(res.data)) {
        setAttendanceRecords(prev => {
          const newMap = new Map();
          res.data.forEach((item: DriverAttendance) => {
            const key = item.id || `${item.driverId}_${item.date}`;
            newMap.set(key, item);
          });
          const kept = prev.filter(p => !newMap.has(p.id) && !newMap.has(`${p.driverId}_${p.date}`));
          return [...res.data, ...kept];
        });
      }
    } catch (err) {
      console.warn('Backend attendance API not reachable, using local attendance cache.', err);
    }
  };

  // Fetch driver expenses from live backend API
  const fetchLiveDriverExpenses = async (queryParam?: string | { date?: string; month?: string; year?: string; driver?: string; driverName?: string; driverId?: string }) => {
    try {
      let endpoint = '/driver-expenses?limit=500';
      if (typeof queryParam === 'string') {
        if (queryParam.length === 7) {
          endpoint = `/driver-expenses?month=${encodeURIComponent(queryParam)}&limit=500`;
        } else if (queryParam.length === 4) {
          endpoint = `/driver-expenses?year=${encodeURIComponent(queryParam)}&limit=500`;
        } else if (queryParam) {
          endpoint = `/driver-expenses?date=${encodeURIComponent(queryParam)}&limit=100`;
        }
      } else if (queryParam && typeof queryParam === 'object') {
        const params = new URLSearchParams();
        params.append('limit', '500');
        if (queryParam.month) params.append('month', queryParam.month);
        if (queryParam.year) params.append('year', queryParam.year);
        if (queryParam.date) params.append('date', queryParam.date);
        const drv = queryParam.driver || queryParam.driverName || queryParam.driverId;
        if (drv && drv !== 'All') params.append('driverName', drv);
        endpoint = `/driver-expenses?${params.toString()}`;
      }

      const res = await api.get(endpoint);
      if (res.success && Array.isArray(res.data)) {
        setDriverExpenses(prev => {
          const newMap = new Map();
          res.data.forEach((item: DriverExpenseItem) => {
            newMap.set(item.id, item);
          });
          const kept = prev.filter(p => !newMap.has(p.id));
          return [...res.data, ...kept];
        });
      }
    } catch (err) {
      console.warn('Backend driver expenses API not reachable, using local cache.', err);
    }
  };

  const fetchLiveBookings = async (queryParam?: { month?: string; date?: string; status?: string }) => {
    try {
      let url = '/bookings';
      const params = new URLSearchParams();
      if (queryParam?.month) params.append('month', queryParam.month);
      if (queryParam?.date) params.append('date', queryParam.date);
      if (queryParam?.status && queryParam.status !== 'All') params.append('status', queryParam.status);
      const q = params.toString();
      if (q) url += `?${q}`;

      const res = await api.get(url);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setTrips(res.data.map((item: any) => ({
          ...item,
          id: item.id || item._id,
          revenue: Number(item.revenue || item.totalAmount || 0),
          totalAmount: Number(item.totalAmount || item.revenue || 0),
          advanceAmount: Number(item.advanceAmount || 0),
          balancePaid: Number(item.balancePaid || 0),
          pendingAmount: Number(item.pendingAmount || 0)
        })));
      }
    } catch (err) {
      console.warn('Backend bookings API not reachable, using local cache.', err);
    }
  };

  const fetchLiveDailyDutyLogs = async (queryParam?: { month?: string; date?: string; vehicle?: string; department?: string; status?: string; search?: string }) => {
    try {
      let endpoint = '/duty-logs?limit=200';
      if (queryParam) {
        const params = new URLSearchParams();
        if (queryParam.month) params.append('month', queryParam.month);
        if (queryParam.date) params.append('date', queryParam.date);
        if (queryParam.vehicle) params.append('vehicle', queryParam.vehicle);
        if (queryParam.department) params.append('departmentName', queryParam.department);
        if (queryParam.status && queryParam.status !== 'All') params.append('status', queryParam.status);
        if (queryParam.search) params.append('search', queryParam.search);
        const qStr = params.toString();
        if (qStr) endpoint += `&${qStr}`;
      }
      const res = await api.get(endpoint);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setDailyDutyLogs(res.data.map((item: any) => ({
          ...item,
          id: item.id || item._id
        })));
      }
    } catch (err) {
      console.warn('Backend daily duty logs API not reachable, using local cache.', err);
    }
  };

  useEffect(() => {
    fetchLiveVehicles();
    fetchLiveDrivers();
    fetchLiveContracts();
    fetchLiveCompliance();
    fetchLiveAttendance();
    fetchLiveDriverExpenses();
    fetchLiveBookings();
    fetchLiveDailyDutyLogs();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    setLoadingKey('refreshing');
    try {
      await Promise.all([
        fetchLiveVehicles(),
        fetchLiveDrivers(),
        fetchLiveContracts(),
        fetchLiveCompliance(),
        fetchLiveAttendance(),
        fetchLiveDriverExpenses(),
        fetchLiveBookings(),
        fetchLiveDailyDutyLogs()
      ]);
      showToast('info', 'Fleet, Drivers, Contracts, Daily Duty Logs, Bookings, Expenses & Compliance synchronized with live server.', 'Refreshed');
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

          createDoc('RC', vehicleData.rcExpiry, vehicleData.rcPhoto);
          createDoc('Insurance', vehicleData.insuranceExpiry, vehicleData.insurancePhoto);
          createDoc('PUC', vehicleData.pollutionExpiry, vehicleData.pollutionPhoto);
          createDoc('Permit', vehicleData.permitExpiry, vehicleData.permitPhoto);
          createDoc('Auth', vehicleData.authExpiry, vehicleData.authPhoto);

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

      createDoc('RC', vehicleData.rcExpiry, vehicleData.rcPhoto);
      createDoc('Insurance', vehicleData.insuranceExpiry, vehicleData.insurancePhoto);
      createDoc('PUC', vehicleData.pollutionExpiry, vehicleData.pollutionPhoto);
      createDoc('Permit', vehicleData.permitExpiry, vehicleData.permitPhoto);
      createDoc('Auth', vehicleData.authExpiry, vehicleData.authPhoto);

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

  const addBooking = async (bookingData: Partial<TripFinancial>) => {
    try {
      setIsLoading(true);
      const res = await api.post('/bookings', bookingData);
      if (res && res.success && res.data) {
        const saved = res.data;
        const normalized: TripFinancial = {
          ...saved,
          id: saved.id || saved._id
        };
        setTrips(prev => [normalized, ...prev.filter(t => t.id !== normalized.id)]);
        showToast(
          'success',
          `Booking #${normalized.bookingNumber || normalized.tripNumber} created for ₹${Number(normalized.revenue).toLocaleString('en-IN')}.`,
          'Booking Confirmed'
        );
        return { success: true, data: normalized };
      }
    } catch (err: any) {
      console.warn('Booking API call failed, creating locally:', err);
    } finally {
      setIsLoading(false);
    }

    // Local fallback
    const totalExp =
      Number(bookingData.fuelCost || 0) +
      Number(bookingData.fastagCost || 0) +
      Number(bookingData.driverBata || 0) +
      Number(bookingData.otherExpenses || 0);
    const rev = Number(bookingData.revenue || bookingData.totalAmount || 0);
    const adv = Number(bookingData.advanceAmount || 0);
    const pend = Math.max(0, rev - adv);

    const newTrip: TripFinancial = {
      ...(bookingData as any),
      id: 'b_' + Date.now(),
      bookingNumber: bookingData.bookingNumber || `BKG-${Math.floor(Math.random() * 9000 + 1000)}`,
      tripNumber: bookingData.tripNumber || `TRIP-${Math.floor(Math.random() * 9000 + 1000)}`,
      revenue: rev,
      totalAmount: rev,
      advanceAmount: adv,
      pendingAmount: pend,
      paymentStatus: pend === 0 && rev > 0 ? 'Paid' : adv > 0 ? 'Partial' : 'Unpaid',
      expenses: totalExp,
      profit: rev - totalExp,
      margin: rev > 0 ? (((rev - totalExp) / rev) * 100).toFixed(1) + '%' : '0%',
      status: bookingData.status || (bookingData.startDate && bookingData.startDate > new Date().toISOString().split('T')[0] ? 'Scheduled' : 'Ongoing')
    };

    setTrips(prev => [newTrip, ...prev]);
    showToast('success', `Booking #${newTrip.bookingNumber} booked locally.`, 'Booking Created');
    return { success: true, data: newTrip };
  };

  const completeBooking = async (
    id: string,
    data: {
      endOdometer: number;
      fuelCost: number;
      fastagCost: number;
      driverBata: number;
      otherExpenses?: number;
      notes?: string;
      balanceReceived?: boolean;
      balancePaid?: number;
      balancePaymentMode?: string;
      paymentNotes?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      const res = await api.patch(`/bookings/${id}/complete`, data);
      if (res && res.success && res.data) {
        const updated = res.data;
        const normalized: TripFinancial = {
          ...updated,
          id: updated.id || updated._id
        };
        setTrips(prev => prev.map(t => (t.id === id || (t._id && t._id === id) ? normalized : t)));
        showToast('success', 'Booking completed and payment settlement updated!', 'Booking Completed');
        return { success: true, data: normalized };
      }
    } catch (err) {
      console.warn('Complete booking API failed, updating locally:', err);
    } finally {
      setIsLoading(false);
    }

    // Local fallback
    setTrips(prev =>
      prev.map(t => {
        if (t.id === id || t._id === id) {
          const totalKm = Math.max(0, data.endOdometer - t.startOdometer);
          const totalExp = data.fuelCost + data.fastagCost + data.driverBata + (data.otherExpenses || 0);
          const profit = t.revenue - totalExp;
          const margin = t.revenue > 0 ? ((profit / t.revenue) * 100).toFixed(1) + '%' : '0%';

          const balPaid = (Number(t.balancePaid) || 0) + (data.balanceReceived ? Number(data.balancePaid || 0) : 0);
          const totalPaid = (Number(t.advanceAmount) || 0) + balPaid;
          const pend = Math.max(0, Number(t.revenue) - totalPaid);

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
            balancePaid: balPaid,
            balancePaymentMode: (data.balancePaymentMode as any) || t.balancePaymentMode,
            balancePaymentDate: data.balanceReceived ? new Date().toISOString().split('T')[0] : t.balancePaymentDate,
            pendingAmount: pend,
            paymentStatus: pend === 0 && t.revenue > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
            endDate: new Date().toISOString().split('T')[0],
            notes: data.notes || t.notes
          };
        }
        return t;
      })
    );
    showToast('success', 'Trip completed and balance recorded.', 'Completed');
    return { success: true, data: undefined };
  };

  const completeTrip = (id: string, data: any) => {
    return completeBooking(id, data);
  };

  const recordBookingPayment = async (
    id: string,
    payment: {
      amount: number;
      paymentMode?: string;
      paymentDate?: string;
      notes?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      const res = await api.patch(`/bookings/${id}/payment`, payment);
      if (res && res.success && res.data) {
        const updated = res.data;
        const normalized: TripFinancial = {
          ...updated,
          id: updated.id || updated._id
        };
        setTrips(prev => prev.map(t => (t.id === id || (t._id && t._id === id) ? normalized : t)));
        showToast('success', `Payment of ₹${payment.amount.toLocaleString('en-IN')} recorded successfully!`, 'Payment Received');
        return { success: true, data: normalized };
      }
    } catch (err) {
      console.warn('Record payment API failed, updating locally:', err);
    } finally {
      setIsLoading(false);
    }

    // Local fallback
    setTrips(prev =>
      prev.map(t => {
        if (t.id === id || t._id === id) {
          const balPaid = (Number(t.balancePaid) || 0) + Number(payment.amount || 0);
          const totalPaid = (Number(t.advanceAmount) || 0) + balPaid;
          const pend = Math.max(0, Number(t.revenue) - totalPaid);
          return {
            ...t,
            balancePaid: balPaid,
            balancePaymentMode: (payment.paymentMode as any) || 'UPI',
            balancePaymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
            pendingAmount: pend,
            paymentStatus: pend === 0 && t.revenue > 0 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
            paymentNotes: payment.notes || t.paymentNotes
          };
        }
        return t;
      })
    );
    showToast('success', `Payment of ₹${payment.amount.toLocaleString('en-IN')} recorded.`, 'Payment Recorded');
    return { success: true, data: undefined };
  };

  const checkVehicleAvailability = async (date: string) => {
    try {
      const res = await api.get(`/bookings/availability?date=${date}`);
      if (res && res.success) {
        return res;
      }
    } catch (err) {
      console.warn('API availability check failed, calculating from local state:', err);
    }

    const checkDate = date || new Date().toISOString().split('T')[0];
    const bookedList = trips.filter(
      t =>
        (t.startDate === checkDate || (t.startDate <= checkDate && (t.endDate || t.startDate) >= checkDate)) &&
        (t.status === 'Scheduled' || t.status === 'Ongoing')
    );
    const bookedRegs = new Set(bookedList.map(b => b.vehicle));

    const availableVehicles = vehicles
      .filter(v => !bookedRegs.has(v.registrationNumber))
      .map(v => ({
        vehicle: v.registrationNumber,
        model: v.model || v.type,
        type: v.type,
        currentStatus: v.status,
        assignedDriver: v.assignedDriver || 'None'
      }));

    const bookedVehicles = bookedList.map(b => ({
      vehicle: b.vehicle,
      model: b.vehicleModel || 'Commercial Vehicle',
      type: 'Trip-based',
      bookingId: b.id,
      bookingNumber: b.bookingNumber || b.tripNumber,
      customerName: b.customerName,
      driverName: b.driverName,
      route: b.route,
      status: b.status,
      fare: b.revenue
    }));

    return {
      date: checkDate,
      totalVehicles: vehicles.length,
      availableCount: availableVehicles.length,
      bookedCount: bookedVehicles.length,
      availableVehicles,
      bookedVehicles
    };
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

          // Auto-sync driver Driving Licence compliance document
          if (serverDriver.licenseNumber || driverData.licenseNumber || driverData.licensePhoto) {
            const dlExp = driverData.licenseExpiry || (() => {
              const d = new Date();
              d.setFullYear(d.getFullYear() + 3);
              return d.toISOString().split('T')[0];
            })();
            const now = new Date();
            const exp = new Date(dlExp);
            const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            let statusType: 'ok' | 'soon' | 'late' = 'ok';
            let expiryLabel = 'Valid · 3 years';
            if (!isNaN(diff)) {
              if (diff < 0) {
                statusType = 'late';
                expiryLabel = `Expired ${Math.abs(diff)}d ago`;
              } else if (diff <= 30) {
                statusType = 'soon';
                expiryLabel = `In ${diff} days`;
              } else {
                statusType = 'ok';
                expiryLabel = `Valid (${diff}d left)`;
              }
            }

            const dlDoc: DocumentCompliance = {
              id: 'dc_' + Date.now(),
              entityName: serverDriver.name,
              entityType: 'Driver',
              documentName: 'Driving licence',
              documentNumber: serverDriver.licenseNumber || driverData.licenseNumber,
              expiryDate: dlExp,
              documentPhoto: serverDriver.licensePhoto || driverData.licensePhoto || null,
              expiryLabel,
              statusType,
              daysLeft: diff
            };
            setDriverCompliance(prev => [dlDoc, ...prev.filter(d => !(d.entityName === serverDriver.name && d.documentName.includes('licence')))]);
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

  const markAttendance = async (recordData: Omit<DriverAttendance, 'id'>) => {
    try {
      const res = await api.post('/attendance', recordData);
      if (res.success && res.data) {
        const saved: DriverAttendance = res.data;
        setAttendanceRecords(prev => {
          const existsIndex = prev.findIndex(r => (r.driverId === saved.driverId || r.id === saved.id) && r.date === saved.date);
          if (existsIndex >= 0) {
            const copy = [...prev];
            copy[existsIndex] = saved;
            return copy;
          }
          return [saved, ...prev];
        });
        showToast('success', `Attendance marked as ${saved.status} for ${saved.driverName}.`, 'Attendance Logged');
        return { success: true, data: saved };
      }
      throw new Error(res.error || 'Failed to mark attendance');
    } catch (err: any) {
      console.warn('API error marking attendance, falling back to local state', err);
      const fallbackRec: DriverAttendance = {
        ...recordData,
        id: 'att_' + Date.now()
      };
      setAttendanceRecords(prev => {
        const existsIndex = prev.findIndex(r => r.driverId === fallbackRec.driverId && r.date === fallbackRec.date);
        if (existsIndex >= 0) {
          const copy = [...prev];
          copy[existsIndex] = fallbackRec;
          return copy;
        }
        return [fallbackRec, ...prev];
      });
      showToast('success', `Attendance marked as ${fallbackRec.status} for ${fallbackRec.driverName}.`, 'Attendance Logged');
      return { success: true, data: fallbackRec };
    }
  };

  const updateAttendanceStatus = async (id: string, status: AttendanceStatus) => {
    try {
      if (!id.startsWith('temp_') && !id.startsWith('att_')) {
        const res = await api.patch(`/attendance/${id}/status`, { status });
        if (res.success && res.data) {
          const updated: DriverAttendance = res.data;
          setAttendanceRecords(prev =>
            prev.map(item => (item.id === id ? updated : item))
          );
          showToast('info', `Attendance updated to ${status}.`, 'Attendance Updated');
          return { success: true, data: updated };
        }
      }
      // Offline fallback
      setAttendanceRecords(prev =>
        prev.map(item => {
          if (item.id === id) {
            const isOff = status === 'Absent' || status === 'On Leave';
            return {
              ...item,
              status,
              checkIn: isOff ? '—' : (item.checkIn === '—' ? '08:30 AM' : item.checkIn),
              checkOut: isOff ? '—' : (item.checkOut === '—' ? '06:30 PM' : item.checkOut),
              workingHours: isOff ? 0 : (item.workingHours || 10)
            };
          }
          return item;
        })
      );
      showToast('info', `Attendance updated to ${status}.`, 'Attendance Updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update attendance', err);
      showToast('error', 'Attendance status update failed.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const bulkMarkAttendance = async (date: string, records: Omit<DriverAttendance, 'id'>[]) => {
    try {
      const res = await api.post('/attendance/bulk', { date, records });
      if (res.success && Array.isArray(res.data)) {
        const updatedList: DriverAttendance[] = res.data;
        setAttendanceRecords(prev => {
          const others = prev.filter(r => r.date !== date);
          return [...updatedList, ...others];
        });
        showToast('success', `All drivers marked as Present for ${date}.`, 'Attendance Updated');
        return { success: true };
      }
      throw new Error(res.error || 'Failed bulk attendance');
    } catch (err: any) {
      console.warn('API error in bulkMarkAttendance, applying locally', err);
      setAttendanceRecords(prev => {
        const others = prev.filter(r => r.date !== date);
        const newRecords: DriverAttendance[] = records.map((r, idx) => ({
          ...r,
          id: 'att_' + Date.now() + '_' + idx
        }));
        return [...newRecords, ...others];
      });
      showToast('success', `All drivers marked as Present.`, 'Attendance Updated');
      return { success: true };
    }
  };

  const updateAttendance = async (id: string, data: Partial<DriverAttendance>) => {
    try {
      const res = await api.put(`/attendance/${id}`, data);
      if (res.success && res.data) {
        const updated: DriverAttendance = res.data;
        setAttendanceRecords(prev =>
          prev.map(item => (item.id === id || (item.driverId === updated.driverId && item.date === updated.date) ? updated : item))
        );
        showToast('success', `Attendance updated for ${updated.driverName} (${updated.date}).`, 'Attendance Saved');
        return { success: true, data: updated };
      }
      throw new Error(res.error || 'Failed to update attendance');
    } catch (err: any) {
      console.warn('API error in updateAttendance, applying locally', err);
      setAttendanceRecords(prev =>
        prev.map(item => (item.id === id ? { ...item, ...data } : item))
      );
      showToast('info', 'Attendance updated locally.', 'Attendance Saved');
      return { success: true };
    }
  };

  const addDriverExpense = async (expenseData: Omit<DriverExpenseItem, 'id'>) => {
    try {
      const res = await api.post('/driver-expenses', expenseData);
      if (res.success && res.data) {
        const newExp: DriverExpenseItem = res.data;
        setDriverExpenses(prev => [newExp, ...prev]);
        showToast('success', `Driver expense of ₹${newExp.amount.toLocaleString('en-IN')} (${newExp.category}) recorded for ${newExp.driverName}.`, 'Expense Saved');
        return { success: true, data: newExp };
      }
      throw new Error(res.error || 'Failed to save driver expense');
    } catch (err: any) {
      console.warn('API error saving driver expense, falling back locally', err);
      const newExp: DriverExpenseItem = {
        ...expenseData,
        id: 'de_' + Date.now()
      };
      setDriverExpenses(prev => [newExp, ...prev]);
      showToast('success', `Driver expense of ₹${newExp.amount.toLocaleString('en-IN')} (${newExp.category}) recorded for ${newExp.driverName}.`, 'Expense Saved');
      return { success: true, data: newExp };
    }
  };

  const updateDriverExpense = async (id: string, data: Partial<DriverExpenseItem>) => {
    try {
      const res = await api.put(`/driver-expenses/${id}`, data);
      if (res.success && res.data) {
        const updated: DriverExpenseItem = res.data;
        setDriverExpenses(prev => prev.map(item => (item.id === id ? updated : item)));
        showToast('success', `Driver expense updated successfully.`, 'Expense Updated');
        return { success: true, data: updated };
      }
      throw new Error(res.error || 'Failed to update expense');
    } catch (err: any) {
      console.warn('API error in updateDriverExpense, updating locally', err);
      setDriverExpenses(prev => prev.map(item => (item.id === id ? { ...item, ...data } : item)));
      showToast('info', 'Expense updated locally.', 'Expense Updated');
      return { success: true };
    }
  };

  const updateDriverExpenseStatus = async (id: string, status: 'Approved' | 'Pending' | 'Paid') => {
    try {
      setDriverExpenses(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Expense status updated to ${status}.`, 'Status Updated');
      if (!id.startsWith('de_')) {
        const res = await api.patch(`/driver-expenses/${id}/status`, { status });
        if (res.success && res.data) {
          return { success: true, data: res.data };
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update expense status', err);
      showToast('error', 'Could not update expense status.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const deleteDriverExpense = async (id: string) => {
    try {
      setDriverExpenses(prev => prev.filter(item => item.id !== id));
      showToast('info', 'Driver expense record removed.', 'Deleted');
      if (!id.startsWith('de_')) {
        await api.delete(`/driver-expenses/${id}`);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete expense', err);
      showToast('error', 'Could not delete expense.', 'Error');
      return { success: false, error: err.message };
    }
  };

  // Department Actions
  const addDepartmentContract = async (contractData: Omit<DepartmentContract, 'id'>) => {
    try {
      if (!contractData.contractNumber?.trim() || !contractData.departmentName?.trim()) {
        showToast('error', 'Contract number and department name are required.', 'Missing Fields');
        return { success: false, error: 'Contract number and department name are required.' };
      }

      // 1. Post to live backend API
      try {
        const res = await api.post('/contracts', contractData);
        if (res.success && res.data) {
          const serverContract: DepartmentContract = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setDepartmentContracts(prev => [serverContract, ...prev.filter(c => c.contractNumber !== serverContract.contractNumber)]);

          // Cross-entity: update assigned vehicle to Department mode
          if (serverContract.vehicle) {
            setVehicles(prev =>
              prev.map(v =>
                v.registrationNumber === serverContract.vehicle
                  ? {
                      ...v,
                      type: 'Department',
                      departmentName: serverContract.departmentName,
                      assignedTo: serverContract.departmentName,
                      assignedDriver: serverContract.driverName && serverContract.driverName !== '—' ? serverContract.driverName : v.assignedDriver
                    }
                  : v
              )
            );
          }

          showToast(
            'success',
            `Contract ${serverContract.contractNumber} (${serverContract.departmentName}) registered successfully.`,
            'Contract Registered'
          );
          return { success: true, contract: serverContract };
        } else if (res.error) {
          showToast('error', res.error, 'Contract Registration Error');
          return { success: false, error: res.error };
        }
      } catch (apiErr: any) {
        console.warn('API notice when adding contract, saving locally:', apiErr.message);
      }

      // 2. Offline fallback
      const newContract: DepartmentContract = {
        ...contractData,
        id: 'cnt_' + Date.now()
      };
      setDepartmentContracts(prev => [newContract, ...prev]);

      if (newContract.vehicle) {
        setVehicles(prev =>
          prev.map(v =>
            v.registrationNumber === newContract.vehicle
              ? {
                  ...v,
                  type: 'Department',
                  departmentName: newContract.departmentName,
                  assignedTo: newContract.departmentName,
                  assignedDriver: newContract.driverName && newContract.driverName !== '—' ? newContract.driverName : v.assignedDriver
                }
              : v
          )
        );
      }

      showToast('success', `Contract ${newContract.contractNumber} (${newContract.departmentName}) added locally.`, 'Contract Registered');
      return { success: true, contract: newContract };
    } catch (err: any) {
      console.error('Failed to add contract', err);
      showToast('error', err.message || 'Could not register department contract.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const updateContractStatus = async (id: string, status: DepartmentContract['status']) => {
    try {
      setDepartmentContracts(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Contract status changed to ${status}.`, 'Contract Updated');
      try {
        await api.patch(`/contracts/${id}/status`, { status });
      } catch {
        // silent fallback for offline
      }
    } catch (err) {
      console.error('Failed to update contract status', err);
      showToast('error', 'Could not update contract status.', 'Error');
    }
  };

  const updateDepartmentContract = async (id: string, data: Partial<DepartmentContract>) => {
    try {
      try {
        const res = await api.put(`/contracts/${id}`, data);
        if (res.success && res.data) {
          const updated: DepartmentContract = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setDepartmentContracts(prev => prev.map(c => (c.id === id ? updated : c)));
          showToast('success', `Contract ${updated.contractNumber} updated successfully.`, 'Contract Saved');
          return { success: true, contract: updated };
        }
      } catch (apiErr: any) {
        showToast('error', apiErr.message || 'Failed to update contract.', 'Update Failed');
        return { success: false, error: apiErr.message };
      }

      // Offline fallback
      setDepartmentContracts(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
      showToast('success', 'Contract updated locally.', 'Contract Saved');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update contract', err);
      showToast('error', 'Could not update contract.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const deleteDepartmentContract = async (id: string) => {
    try {
      const target = departmentContracts.find(c => c.id === id);
      setDepartmentContracts(prev => prev.filter(c => c.id !== id));
      showToast('info', `Contract ${target?.contractNumber || ''} removed.`, 'Contract Deleted');
      try {
        await api.delete(`/contracts/${id}`);
        return { success: true };
      } catch (apiErr: any) {
        return { success: false, error: apiErr.message };
      }
    } catch (err: any) {
      console.error('Failed to delete contract', err);
      showToast('error', 'Could not delete contract.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const addDailyDutyLog = async (logData: Omit<DailyDutyLog, 'id'>) => {
    try {
      try {
        const res = await api.post('/duty-logs', logData);
        if (res.success && res.data) {
          const newLog: DailyDutyLog = {
            ...res.data,
            id: res.data.id || res.data._id
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
          showToast('success', `Duty slip #${newLog.dutySlipNumber} (${newLog.vehicle}) recorded in database.`, 'Duty Slip Saved');
          return { success: true, log: newLog };
        }
      } catch (apiErr: any) {
        console.warn('Backend duty-logs POST failed, fallback to local', apiErr);
      }

      // Offline fallback
      const newLog: DailyDutyLog = {
        ...logData,
        id: 'log_' + Date.now()
      };
      setDailyDutyLogs(prev => [newLog, ...prev]);

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
      return { success: true, log: newLog };
    } catch (err: any) {
      console.error('Failed to add duty log', err);
      showToast('error', 'Could not save duty log.', 'Error');
      return { success: false, error: err.message };
    }
  };

  const updateDailyDutyLogStatus = async (id: string, status: DailyDutyLog['status']) => {
    try {
      setDailyDutyLogs(prev =>
        prev.map(item => (item.id === id ? { ...item, status } : item))
      );
      showToast('info', `Duty log status changed to ${status}.`, 'Log Updated');
      try {
        await api.put(`/duty-logs/${id}`, { status });
      } catch (apiErr) {
        console.warn('Backend update duty log status failed', apiErr);
      }
    } catch (err) {
      console.error('Failed to update duty log status', err);
      showToast('error', 'Could not update duty log status.', 'Error');
    }
  };

  const deleteDailyDutyLog = async (id: string) => {
    try {
      const target = dailyDutyLogs.find(l => l.id === id);
      setDailyDutyLogs(prev => prev.filter(l => l.id !== id));
      showToast('info', `Duty log #${target?.dutySlipNumber || ''} removed.`, 'Log Deleted');
      try {
        await api.delete(`/duty-logs/${id}`);
        return { success: true };
      } catch (apiErr: any) {
        return { success: false, error: apiErr.message };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
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

  const addVehicleComplianceDoc = async (docData: Omit<DocumentCompliance, 'id'>) => {
    try {
      try {
        const res = await api.post('/compliance', { ...docData, entityType: 'Vehicle' });
        if (res.success && res.data) {
          const serverDoc: DocumentCompliance = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setVehicleCompliance(prev => [serverDoc, ...prev]);
          showToast('success', `${serverDoc.documentName} for vehicle ${serverDoc.entityName} recorded.`, 'Compliance Updated');
          return;
        }
      } catch (apiErr) {
        // silent fallback for offline
      }

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

  const addDriverComplianceDoc = async (docData: Omit<DocumentCompliance, 'id'>) => {
    try {
      try {
        const res = await api.post('/compliance', { ...docData, entityType: 'Driver' });
        if (res.success && res.data) {
          const serverDoc: DocumentCompliance = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setDriverCompliance(prev => [serverDoc, ...prev]);
          showToast('success', `${serverDoc.documentName} for driver ${serverDoc.entityName} verified and saved.`, 'Compliance Updated');
          return;
        }
      } catch (apiErr) {
        // silent fallback for offline
      }

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

  const pageHeader = pageHeaders[activePage] || pageHeaders.dashboard;

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
        setDriverSubTab: handleSetDriverSubTab,
        departmentSubTab,
        setDepartmentSubTab: handleSetDepartmentSubTab,
        departmentContracts,
        addDepartmentContract,
        updateContractStatus,
        updateDepartmentContract,
        deleteDepartmentContract,
        dailyDutyLogs,
        fetchLiveDailyDutyLogs,
        addDailyDutyLog,
        updateDailyDutyLogStatus,
        deleteDailyDutyLog,
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
        updateAttendance,
        bulkMarkAttendance,
        fetchLiveAttendance,
        driverExpenses,
        fetchLiveDriverExpenses,
        addDriverExpense,
        updateDriverExpense,
        updateDriverExpenseStatus,
        deleteDriverExpense,
        contracts,
        trips,
        bookings: trips,
        fetchLiveBookings,
        addTrip,
        addBooking,
        completeTrip,
        completeBooking,
        recordBookingPayment,
        checkVehicleAvailability,
        expenses,
        addExpense,
        expenseSubTab,
        setExpenseSubTab: handleSetExpenseSubTab,
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
