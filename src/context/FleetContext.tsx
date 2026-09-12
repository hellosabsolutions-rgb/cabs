import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketManager } from '../services/socket';
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
  ToastType,
  DriverPayrollItem,
  DashboardStatsData
} from '../types/fleet';

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
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DriverAttendance[]>([]);
  const [driverExpenses, setDriverExpenses] = useState<DriverExpenseItem[]>([]);
  
  const [departmentContracts, setDepartmentContracts] = useState<DepartmentContract[]>([]);
  const [dailyDutyLogs, setDailyDutyLogs] = useState<DailyDutyLog[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyDepartmentBill[]>([]);
  const [activeGstRate, setActiveGstRate] = useState<number>(5);
  const [activeGstType, setActiveGstType] = useState<'CGST_SGST' | 'IGST'>('CGST_SGST');
  const [departmentPayments, setDepartmentPayments] = useState<DepartmentPayment[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>([]);
  const [fastagTransactions, setFastagTransactions] = useState<FastagTransaction[]>([]);
  
  const [contracts] = useState<ContractDepartment[]>([]);
  const [trips, setTrips] = useState<TripFinancial[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [vehicleCompliance, setVehicleCompliance] = useState<DocumentCompliance[]>([]);
  const [driverCompliance, setDriverCompliance] = useState<DocumentCompliance[]>([]);
  
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);

  const [dashboardStats, setDashboardStats] = useState<DashboardStatsData | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(false);

  // Per-tab granular loading states for independent skeleton loaders
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [isLoadingCompliance, setIsLoadingCompliance] = useState(false);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [isLoadingProfitability, setIsLoadingProfitability] = useState(false);

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
      else if (path.includes('/payroll')) setDriverSubTab('payroll');
      else setDriverSubTab('list');
    } else if (path.startsWith('/departments')) {
      setActivePage('departments');
      if (path.includes('/duty-logs')) setDepartmentSubTab('duty-logs');
      else if (path.includes('/weekend-billing')) setDepartmentSubTab('weekend-billing');
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
    setIsLoadingVehicles(true);
    try {
      const res = await api.get('/vehicles?limit=100');
      if (res && res.success && Array.isArray(res.data)) {
        setVehicles(res.data);
      }
    } catch (err) {
      console.warn('Backend vehicles API not reachable:', err);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Fetch drivers from live backend API
  const fetchLiveDrivers = async (): Promise<Driver[]> => {
    setIsLoadingDrivers(true);
    try {
      const res = await api.get('/drivers?limit=500');
      if (res && res.success && Array.isArray(res.data)) {
        const liveDrivers: Driver[] = res.data.map((d: any) => ({
          ...d,
          id: d.id || d._id?.toString()
        }));
        setDrivers(liveDrivers);
        return liveDrivers;
      }
    } catch (err) {
      console.warn('Backend drivers API not reachable:', err);
    } finally {
      setIsLoadingDrivers(false);
    }
    return [];
  };

  // Fetch contracts from live backend API
  const fetchLiveContracts = async (queryParam?: { search?: string; status?: string; vehicle?: string; department?: string }) => {
    try {
      let endpoint = '/contracts?limit=100';
      if (queryParam) {
        const params = new URLSearchParams();
        if (queryParam.search) params.append('search', queryParam.search);
        if (queryParam.status && queryParam.status !== 'All') params.append('status', queryParam.status);
        if (queryParam.vehicle && queryParam.vehicle !== 'All') params.append('vehicle', queryParam.vehicle);
        if (queryParam.department && queryParam.department !== 'All') params.append('department', queryParam.department);
        const qStr = params.toString();
        if (qStr) endpoint += `&${qStr}`;
      }
      const res = await api.get(endpoint);
      if (res && res.success && Array.isArray(res.data)) {
        setDepartmentContracts(
          res.data.map((item: any) => ({
            ...item,
            id: item.id || item._id
          }))
        );
      }
    } catch (err) {
      console.warn('Backend contracts API not reachable:', err);
    }
  };

  // Fetch compliance documents & live expiry calculation from backend API
  const fetchLiveCompliance = async () => {
    setIsLoadingCompliance(true);
    try {
      const res = await api.get('/compliance/expiry');
      if (res && res.success && res.data) {
        setVehicleCompliance(Array.isArray(res.data.vehicleDocs) ? res.data.vehicleDocs : []);
        setDriverCompliance(Array.isArray(res.data.driverDocs) ? res.data.driverDocs : []);
      }
    } catch (err) {
      console.warn('Backend compliance API not reachable:', err);
    } finally {
      setIsLoadingCompliance(false);
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
      if (res && res.success && Array.isArray(res.data)) {
        setAttendanceRecords(res.data);
      }
    } catch (err) {
      console.warn('Backend attendance API not reachable:', err);
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
      if (res && res.success && Array.isArray(res.data)) {
        setDriverExpenses(res.data);
      }
    } catch (err) {
      console.warn('Backend driver expenses API not reachable:', err);
    }
  };

  const fetchLiveBookings = async (queryParam?: { month?: string; date?: string; status?: string }) => {
    setIsLoadingBookings(true);
    try {
      let url = '/bookings';
      const params = new URLSearchParams();
      if (queryParam?.month) params.append('month', queryParam.month);
      if (queryParam?.date) params.append('date', queryParam.date);
      if (queryParam?.status && queryParam.status !== 'All') params.append('status', queryParam.status);
      const q = params.toString();
      if (q) url += `?${q}`;

      const res = await api.get(url);
      if (res && res.success && Array.isArray(res.data)) {
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
      console.warn('Backend bookings API not reachable:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchLiveDailyDutyLogs = async (queryParam?: { month?: string; date?: string; vehicle?: string; department?: string; status?: string; search?: string }) => {
    setIsLoadingDepartments(true);
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
      if (res && res.success && Array.isArray(res.data)) {
        setDailyDutyLogs(res.data.map((item: any) => ({
          ...item,
          id: item.id || item._id
        })));
      }
    } catch (err) {
      console.warn('Backend daily duty logs API not reachable:', err);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const fetchLiveFastagTransactions = async (queryParam?: { vehicle?: string; type?: string; month?: string; search?: string }) => {
    setIsLoadingExpenses(true);
    try {
      let endpoint = '/fastag?limit=300';
      if (queryParam) {
        const params = new URLSearchParams();
        if (queryParam.vehicle && queryParam.vehicle !== 'All') params.append('vehicle', queryParam.vehicle);
        if (queryParam.type && queryParam.type !== 'All') params.append('type', queryParam.type);
        if (queryParam.month) params.append('month', queryParam.month);
        if (queryParam.search) params.append('search', queryParam.search);
        const qStr = params.toString();
        if (qStr) endpoint += `&${qStr}`;
      }
      const res = await api.get(endpoint);
      if (res && res.success && Array.isArray(res.data)) {
        setFastagTransactions(
          res.data.map((item: any) => ({
            ...item,
            id: item.id || item._id
          }))
        );
      }
    } catch (err) {
      console.warn('Backend FASTag API not reachable:', err);
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const fetchLiveMonthlyBills = async (queryParam?: { month?: string; department?: string; status?: string; search?: string }) => {
    try {
      let endpoint = '/bills?limit=100';
      if (queryParam) {
        const params = new URLSearchParams();
        if (queryParam.month && queryParam.month !== 'All') params.append('billingMonth', queryParam.month);
        if (queryParam.department && queryParam.department !== 'All') params.append('departmentName', queryParam.department);
        if (queryParam.status && queryParam.status !== 'All') params.append('status', queryParam.status);
        if (queryParam.search) params.append('search', queryParam.search);
        const qStr = params.toString();
        if (qStr) endpoint += `&${qStr}`;
      }
      const res = await api.get(endpoint);
      if (res && res.success && Array.isArray(res.data)) {
        setMonthlyBills(
          res.data.map((item: any) => ({
            ...item,
            id: item.id || item._id
          }))
        );
      }
    } catch (err) {
      console.warn('Backend bills API not reachable:', err);
    }
  };

  // Fetch live aggregated dashboard statistics
  const fetchLiveDashboardStats = async (): Promise<DashboardStatsData | null> => {
    setIsLoadingDashboard(true);
    try {
      const res = await api.get('/dashboard/stats');
      if (res && res.success && res.data) {
        setDashboardStats(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn('Backend dashboard stats API not reachable:', err);
    } finally {
      setIsLoadingDashboard(false);
    }
    return null;
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
    fetchLiveFastagTransactions();
    fetchLiveMonthlyBills();
    fetchPayrollSummary();
    fetchLiveDashboardStats();
  }, []);

  // Real-time fleet and booking synchronization via Socket.IO
  useEffect(() => {
    const socket = socketManager.getNotificationSocket();

    const handleBookingCreated = (data: any) => {
      if (!data) return;
      const id = data.id || data._id;
      setTrips(prev => {
        if (prev.some(t => t.id === id || t._id === id)) return prev;
        const normalized: TripFinancial = {
          ...data,
          id,
          revenue: Number(data.revenue || data.totalAmount || 0),
          totalAmount: Number(data.totalAmount || data.revenue || 0),
          advanceAmount: Number(data.advanceAmount || 0),
          balancePaid: Number(data.balancePaid || 0),
          pendingAmount: Number(data.pendingAmount || 0)
        };
        return [normalized, ...prev];
      });
      showToast('info', `New Booking #${data.bookingNumber || data.tripNumber || ''} created.`, 'Booking Created');
    };

    const handleBookingUpdated = (data: any) => {
      if (!data) return;
      const id = data.id || data._id;
      setTrips(prev =>
        prev.map(t => {
          if (t.id === id || t._id === id) {
            return {
              ...t,
              ...data,
              id: t.id,
              status: data.status || t.status,
              driver: data.driver || data.driverName || t.driver,
              driverName: data.driverName || data.driver || t.driverName,
              vehicle: data.vehicle || t.vehicle,
              endOdometer: data.endOdometer !== undefined ? data.endOdometer : t.endOdometer,
              totalKmRun: data.totalKmRun !== undefined ? data.totalKmRun : t.totalKmRun
            };
          }
          return t;
        })
      );
    };

    const handleBookingCompleted = (data: any) => {
      if (!data) return;
      const id = data.id || data._id;
      setTrips(prev =>
        prev.map(t => (t.id === id || t._id === id ? { ...t, ...data, id: t.id, status: 'Completed' } : t))
      );
      showToast('success', `Booking #${data.bookingNumber || id} completed by driver.`, 'Trip Completed');
      fetchLiveVehicles();
      fetchLiveDrivers();
    };

    const handleBookingAssigned = (data: any) => {
      if (!data) return;
      const id = data.id || data._id || data.bookingId;
      setTrips(prev =>
        prev.map(t => (t.id === id || t._id === id ? {
          ...t,
          driver: data.driver || data.driverName || t.driver,
          driverName: data.driverName || data.driver || t.driverName,
          vehicle: data.vehicle || t.vehicle
        } : t))
      );
    };

    const handleBookingUnassigned = (data: any) => {
      if (!data) return;
      const id = data.id || data._id || data.bookingId;
      setTrips(prev =>
        prev.map(t => (t.id === id || t._id === id ? {
          ...t,
          driver: 'Unassigned',
          driverName: 'Unassigned'
        } : t))
      );
    };

    const handleDriverAnyChange = () => {
      fetchLiveBookings();
      fetchLiveVehicles();
      fetchLiveDrivers();
    };

    socket.on('booking:created', handleBookingCreated);
    socket.on('booking:updated', handleBookingUpdated);
    socket.on('booking:completed', handleBookingCompleted);
    socket.on('booking:assigned', handleBookingAssigned);
    socket.on('booking:unassigned', handleBookingUnassigned);
    socket.on('driver:any_change', handleDriverAnyChange);

    return () => {
      socket.off('booking:created', handleBookingCreated);
      socket.off('booking:updated', handleBookingUpdated);
      socket.off('booking:completed', handleBookingCompleted);
      socket.off('booking:assigned', handleBookingAssigned);
      socket.off('booking:unassigned', handleBookingUnassigned);
      socket.off('driver:any_change', handleDriverAnyChange);
    };
  }, []);

  // Tab-change: fresh data fetch on every tab navigation
  // Agar data pehle se loaded hai → SoftRefreshBar dikhega, skeleton nahi
  // Agar data empty hai → full skeleton dikhega
  useEffect(() => {
    switch (activePage) {
      case 'dashboard':
        fetchLiveDashboardStats();
        break;
      case 'vehicles':
        fetchLiveVehicles();
        break;
      case 'drivers':
        fetchLiveDrivers();
        fetchLiveAttendance();
        fetchLiveDriverExpenses();
        break;
      case 'departments':
        fetchLiveContracts();
        fetchLiveDailyDutyLogs();
        fetchLiveMonthlyBills();
        break;
      case 'bookings':
      case 'trips':
        fetchLiveBookings();
        break;
      case 'expenses':
        fetchLiveFastagTransactions();
        break;
      case 'compliance':
        fetchLiveCompliance();
        break;
      case 'profitability':
        setIsLoadingProfitability(true);
        Promise.all([fetchLiveBookings(), fetchLiveDailyDutyLogs()])
          .finally(() => setIsLoadingProfitability(false));
        break;
      case 'maintenance':
        setIsLoadingMaintenance(true);
        // maintenance records don't have a separate API yet, use vehicles for context
        fetchLiveVehicles().finally(() => setIsLoadingMaintenance(false));
        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage]);

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
        fetchLiveDailyDutyLogs(),
        fetchLiveFastagTransactions(),
        fetchLiveMonthlyBills(),
        fetchPayrollSummary(),
        fetchLiveDashboardStats()
      ]);
      showToast('info', 'Fleet, Drivers, FASTag, Daily Duty Logs, Invoices, Expenses & Dashboard synchronized with live server.', 'Refreshed');
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

          if (serverVehicle.assignedDriver && serverVehicle.registrationNumber) {
            const driverName = serverVehicle.assignedDriver.trim().toLowerCase();
            const plate = serverVehicle.registrationNumber;
            setDrivers(prev =>
              prev.map(d => {
                const sameDriver = d.name.trim().toLowerCase() === driverName;
                const hadThisPlate =
                  d.assignedVehicle &&
                  d.assignedVehicle.replace(/[\s-]/g, '').toUpperCase() ===
                    plate.replace(/[\s-]/g, '').toUpperCase();
                if (sameDriver) return { ...d, assignedVehicle: plate };
                if (hadThisPlate && !sameDriver) return { ...d, assignedVehicle: '—' };
                return d;
              })
            );
          }

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

  const updateVehicle = async (id: string, updatedData: Partial<Vehicle>): Promise<{ success: boolean; error?: string }> => {
    try {
      let savedVehicle: Vehicle | null = null;
      try {
        const res = await api.put(`/vehicles/${id}`, updatedData);
        if (res && res.data) {
          savedVehicle = {
            ...res.data,
            id: res.data._id || res.data.id || id
          };
        }
      } catch (apiErr: any) {
        console.warn('API update failed, applying locally', apiErr);
      }

      setVehicles(prev =>
        prev.map(v => {
          if (v.id !== id) return v;
          const merged = savedVehicle || { ...v, ...updatedData };
          // Explicit unassign from form sends null
          if (
            Object.prototype.hasOwnProperty.call(updatedData, 'assignedDriver') &&
            (updatedData.assignedDriver == null ||
              updatedData.assignedDriver === '' ||
              updatedData.assignedDriver === 'Unassigned')
          ) {
            return { ...merged, assignedDriver: undefined };
          }
          return merged;
        })
      );

      // Keep driver.assignedVehicle in sync when vehicle.assignedDriver changes
      const existingVehicle = vehicles.find(v => v.id === id);
      const plate = (savedVehicle?.registrationNumber ||
        updatedData.registrationNumber ||
        existingVehicle?.registrationNumber ||
        '') as string;

      if (Object.prototype.hasOwnProperty.call(updatedData, 'assignedDriver') && plate) {
        const rawNext = updatedData.assignedDriver;
        const nextDriverName =
          rawNext && rawNext !== 'Unassigned' && String(rawNext).trim()
            ? String(rawNext).trim()
            : '';
        const previousDriverName = existingVehicle?.assignedDriver?.trim() || '';

        setDrivers(prev =>
          prev.map(d => {
            const nameKey = d.name.trim().toLowerCase();
            const isNext =
              nextDriverName && nameKey === nextDriverName.toLowerCase();
            const isPrevious =
              previousDriverName && nameKey === previousDriverName.toLowerCase();
            const hadThisPlate =
              d.assignedVehicle &&
              d.assignedVehicle.replace(/[\s-]/g, '').toUpperCase() ===
                plate.replace(/[\s-]/g, '').toUpperCase();

            if (isNext) {
              return { ...d, assignedVehicle: plate };
            }
            // Unassign / switch: clear previous holder and anyone with this plate
            if ((!nextDriverName && (isPrevious || hadThisPlate)) || (hadThisPlate && !isNext)) {
              return { ...d, assignedVehicle: '—' };
            }
            return d;
          })
        );
      }

      // Also update compliance records if compliance dates changed
      if (
        updatedData.rcExpiry !== undefined ||
        updatedData.insuranceExpiry !== undefined ||
        updatedData.pollutionExpiry !== undefined ||
        updatedData.permitExpiry !== undefined ||
        updatedData.authExpiry !== undefined
      ) {
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

        const targetVehicle = vehicles.find(v => v.id === id);
        const reg = updatedData.registrationNumber || targetVehicle?.registrationNumber || '';

        setVehicleCompliance(prev =>
          prev.map(c => {
            if (c.entityName === reg) {
              if (c.documentName === 'RC' && updatedData.rcExpiry) {
                const meta = calcMeta(updatedData.rcExpiry);
                return { ...c, expiryDate: updatedData.rcExpiry, documentPhoto: updatedData.rcPhoto !== undefined ? updatedData.rcPhoto : c.documentPhoto, ...meta };
              }
              if (c.documentName === 'Insurance' && updatedData.insuranceExpiry) {
                const meta = calcMeta(updatedData.insuranceExpiry);
                return { ...c, expiryDate: updatedData.insuranceExpiry, documentPhoto: updatedData.insurancePhoto !== undefined ? updatedData.insurancePhoto : c.documentPhoto, ...meta };
              }
              if ((c.documentName === 'PUC' || c.documentName === 'Pollution') && updatedData.pollutionExpiry) {
                const meta = calcMeta(updatedData.pollutionExpiry);
                return { ...c, expiryDate: updatedData.pollutionExpiry, documentPhoto: updatedData.pollutionPhoto !== undefined ? updatedData.pollutionPhoto : c.documentPhoto, ...meta };
              }
              if (c.documentName === 'Permit' && updatedData.permitExpiry) {
                const meta = calcMeta(updatedData.permitExpiry);
                return { ...c, expiryDate: updatedData.permitExpiry, documentPhoto: updatedData.permitPhoto !== undefined ? updatedData.permitPhoto : c.documentPhoto, ...meta };
              }
              if (c.documentName === 'Auth' && updatedData.authExpiry) {
                const meta = calcMeta(updatedData.authExpiry);
                return { ...c, expiryDate: updatedData.authExpiry, documentPhoto: updatedData.authPhoto !== undefined ? updatedData.authPhoto : c.documentPhoto, ...meta };
              }
            }
            return c;
          })
        );
      }

      showToast('success', `Vehicle ${updatedData.registrationNumber || ''} details updated successfully.`, 'Vehicle Updated');
      fetchLiveDashboardStats();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update vehicle', err);
      showToast('error', err.message || 'Failed to update vehicle.', 'Update Failed');
      return { success: false, error: err.message };
    }
  };

  const deleteVehicle = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const vToDelete = vehicles.find(v => v.id === id);
      setVehicles(prev => prev.filter(v => v.id !== id));
      showToast('info', `Vehicle ${vToDelete?.registrationNumber || ''} removed from fleet.`, 'Vehicle Deleted');
      try {
        await api.delete(`/vehicles/${id}`);
      } catch (e) {
        console.warn('Backend delete vehicle failed', e);
      }
      fetchLiveDashboardStats();
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete vehicle', err);
      showToast('error', err.message || 'Failed to delete vehicle.', 'Error');
      return { success: false, error: err.message };
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

  const addFastagTransaction = async (txData: Omit<FastagTransaction, 'id'>) => {
    try {
      const endpoint = txData.type === 'Recharge' ? '/fastag/recharge' : '/fastag/deduct';
      const payload = {
        vehicle: txData.vehicle,
        amount: txData.amount,
        tollPlaza: txData.tollPlaza,
        lane: txData.lane,
        date: txData.date,
        time: txData.time,
        transactionRef: txData.transactionRef,
        linkedDutyOrTrip: txData.linkedDutyOrTrip,
        proofSlip: txData.proofSlip
      };

      const res = await api.post(endpoint, payload);

      if (res.success && res.data) {
        const newTx: FastagTransaction = {
          ...res.data,
          id: res.data.id || res.data._id
        };
        setFastagTransactions(prev => [newTx, ...prev]);

        if (res.vehicle) {
          setVehicles(prev =>
            prev.map(v =>
              v.registrationNumber.toLowerCase() === txData.vehicle.toLowerCase()
                ? { ...v, fastagBalance: res.vehicle.fastagBalance }
                : v
            )
          );
        }

        if (txData.type === 'Toll Deduction') {
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

        showToast(
          'info',
          res.message || `FASTag ${txData.type.toLowerCase()} of ₹${newTx.amount.toLocaleString('en-IN')} recorded for ${newTx.vehicle}.`,
          'FASTag Logged'
        );
      } else {
        throw new Error(res.error || 'Failed to record transaction via API');
      }
    } catch (err) {
      console.warn('Backend FASTag transaction API call failed, using local offline state.', err);
      const newTx: FastagTransaction = {
        ...txData,
        id: 'ft_' + Date.now()
      };
      setFastagTransactions(prev => [newTx, ...prev]);

      // Update vehicle's fastag balance locally
      setVehicles(prev =>
        prev.map(v => {
          if (v.registrationNumber.toLowerCase() === newTx.vehicle.toLowerCase()) {
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
    }
  };

  const rechargeFastag = async (
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

      const res = await api.post('/fastag/recharge', {
        vehicle: vehicleReg,
        amount,
        paymentMode,
        proofSlip: proof || null
      });

      if (res.success && res.data) {
        const tx: FastagTransaction = {
          ...res.data,
          id: res.data.id || res.data._id
        };

        setFastagTransactions(prev => [tx, ...prev]);

        if (res.vehicle) {
          setVehicles(prev =>
            prev.map(item =>
              item.registrationNumber.toLowerCase() === vehicleReg.toLowerCase()
                ? { ...item, fastagBalance: res.vehicle.fastagBalance }
                : item
            )
          );
        } else {
          setVehicles(prev =>
            prev.map(item =>
              item.registrationNumber.toLowerCase() === vehicleReg.toLowerCase()
                ? { ...item, fastagBalance: (item.fastagBalance || 0) + amount }
                : item
            )
          );
        }

        showToast(
          'success',
          res.message || `₹${amount.toLocaleString('en-IN')} added to ${vehicleReg} FASTag wallet.`,
          'Recharge Complete'
        );
      } else {
        throw new Error(res.error || 'Failed to recharge FASTag');
      }
    } catch (err) {
      console.warn('Backend FASTag recharge API failed, updating local state.', err);
      const v = vehicles.find(item => item.registrationNumber.toLowerCase() === vehicleReg.toLowerCase());
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
          item.registrationNumber.toLowerCase() === vehicleReg.toLowerCase()
            ? { ...item, fastagBalance: newBal }
            : item
        )
      );
      showToast(
        'success',
        `₹${amount.toLocaleString('en-IN')} added to ${vehicleReg} FASTag wallet (Local).`,
        'Recharge Complete'
      );
    }
  };

  const updateFastagDetails = async (vehicleReg: string, balance: number, bank?: string, tagId?: string) => {
    try {
      const res = await api.put(`/fastag/vehicle/${encodeURIComponent(vehicleReg)}`, {
        balance,
        bank,
        tagId
      });

      if (res.success && res.data) {
        setVehicles(prev =>
          prev.map(item =>
            item.registrationNumber.toLowerCase() === vehicleReg.toLowerCase()
              ? {
                  ...item,
                  fastagBalance: res.data.fastagBalance !== undefined ? res.data.fastagBalance : balance,
                  fastagBank: res.data.fastagBank !== undefined ? res.data.fastagBank : bank,
                  fastagTagId: res.data.fastagTagId !== undefined ? res.data.fastagTagId : tagId
                }
              : item
          )
        );
        showToast('success', res.message || `FASTag balance updated to ₹${balance.toLocaleString('en-IN')} for ${vehicleReg}.`, 'FASTag Updated');
      } else {
        throw new Error(res.error || 'Failed to update FASTag details');
      }
    } catch (err) {
      console.warn('Backend update FASTag API failed, updating local state.', err);
      setVehicles(prev =>
        prev.map(item => {
          if (item.registrationNumber.toLowerCase() === vehicleReg.toLowerCase()) {
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
          await fetchLiveDrivers();
          await fetchPayrollSummary(selectedPayrollMonth);
          return { success: true, driver: serverDriver, credentials: res.credentials };
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
      const previous = drivers.find(d => d.id === id);
      try {
        const res = await api.put(`/drivers/${id}`, data);
        if (res.success && res.data) {
          const updated: Driver = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          setDrivers(prev => prev.map(d => (d.id === id ? updated : d)));

          if (Object.prototype.hasOwnProperty.call(data, 'assignedVehicle')) {
            const prevPlate = previous?.assignedVehicle;
            const nextPlate =
              updated.assignedVehicle && updated.assignedVehicle !== '—'
                ? updated.assignedVehicle
                : '';

            setVehicles(prev =>
              prev.map(v => {
                const plateKey = (value?: string) =>
                  String(value || '')
                    .replace(/[\s-]/g, '')
                    .toUpperCase();
                const isPrev =
                  prevPlate &&
                  prevPlate !== '—' &&
                  plateKey(v.registrationNumber) === plateKey(prevPlate);
                const isNext =
                  nextPlate && plateKey(v.registrationNumber) === plateKey(nextPlate);

                if (isNext) {
                  return { ...v, assignedDriver: updated.name };
                }
                if (isPrev && !isNext) {
                  return { ...v, assignedDriver: undefined };
                }
                return v;
              })
            );
          }

          showToast('success', `Driver ${updated.name} updated successfully.`, 'Driver Updated');
          await fetchLiveDrivers();
          await fetchPayrollSummary(selectedPayrollMonth);
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
      } catch (apiErr: any) {
        // ...
      }
      await fetchLiveDrivers();
      await fetchPayrollSummary(selectedPayrollMonth);
      return { success: true };
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

  const updateAttendanceStatus = async (id: string, status: AttendanceStatus, meta?: Partial<DriverAttendance>) => {
    try {
      const res = await api.patch(`/attendance/${id}/status`, {
        status,
        ...(meta?.driverId && { driverId: meta.driverId }),
        ...(meta?.driverName && { driverName: meta.driverName }),
        ...(meta?.date && { date: meta.date }),
        ...(meta?.assignedVehicle && { assignedVehicle: meta.assignedVehicle }),
        ...(meta?.dutyType && { dutyType: meta.dutyType }),
        ...(meta?.workingHours !== undefined && { workingHours: meta.workingHours }),
        ...(meta?.checkIn && { checkIn: meta.checkIn }),
        ...(meta?.checkOut && { checkOut: meta.checkOut })
      });
      if (res.success && res.data) {
        const updated: DriverAttendance = res.data;
        setAttendanceRecords(prev =>
          prev.map(item => (item.id === id || (item.driverId === updated.driverId && item.date === updated.date) ? updated : item))
        );
        showToast('info', `Attendance updated to ${status}.`, 'Attendance Updated');
        return { success: true, data: updated };
      }
      // Offline fallback
      setAttendanceRecords(prev =>
        prev.map(item => {
          if (item.id === id || (meta?.driverId && item.driverId === meta.driverId && item.date === meta.date)) {
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
      console.warn('API error updating attendance status, updating locally', err);
      setAttendanceRecords(prev =>
        prev.map(item => {
          if (item.id === id || (meta?.driverId && item.driverId === meta.driverId && item.date === meta.date)) {
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

  // Driver Payroll State & Actions
  const [payrollItems, setPayrollItems] = useState<DriverPayrollItem[]>([]);
  const [isPayrollLoading, setIsPayrollLoading] = useState<boolean>(false);
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchPayrollSummary = async (month?: string) => {
    const targetMonth = month || selectedPayrollMonth;
    setIsPayrollLoading(true);
    try {
      const res = await api.get(`/payroll/summary?month=${encodeURIComponent(targetMonth)}`);
      if (res && res.success && Array.isArray(res.data)) {
        setPayrollItems(res.data);
      }
    } catch (err) {
      console.warn('Backend payroll API failed, using fallback driver computation', err);
      setPayrollItems(
        drivers.map(d => ({
          driverId: d.id,
          name: d.name,
          phone: d.phone,
          photo: d.photo,
          assignedVehicle: d.assignedVehicle,
          driverType: d.driverType,
          joiningDate: d.joiningDate,
          monthlySalary: d.monthlySalary || 0,
          advanceBalance: 0,
          challanBalance: 0,
          netPayable: d.monthlySalary || 0,
          status: 'DUE',
          settlement: null,
          advances: [],
          challans: []
        }))
      );
    } finally {
      setIsPayrollLoading(false);
    }
  };

  const giveDriverAdvance = async (data: { driverId: string; amount: number; date?: string; paymentMode?: string; reason?: string; remarks?: string }) => {
    try {
      const res = await api.post('/payroll/advance', data);
      if (res && res.success) {
        showToast('success', res.message || 'Advance recorded successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to record advance');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error recording advance');
      return { success: false, error: err.message };
    }
  };

  const addDriverPenalty = async (data: { driverId: string; amount: number; date?: string; challanNumber?: string; reason: string; vehicle?: string }) => {
    try {
      const res = await api.post('/payroll/penalty', data);
      if (res && res.success) {
        showToast('success', res.message || 'Challan / Penalty recorded successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to record penalty');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error recording penalty');
      return { success: false, error: err.message };
    }
  };

  const settleDriverSalary = async (data: { driverId: string; month?: string; paymentMode?: string; paymentDate?: string; remarks?: string }) => {
    try {
      const res = await api.post('/payroll/settle', {
        ...data,
        month: data.month || selectedPayrollMonth
      });
      if (res && res.success) {
        showToast('success', res.message || 'Salary marked as PAID');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to settle salary');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error settling salary');
      return { success: false, error: err.message };
    }
  };

  const unsettleDriverSalary = async (data: { driverId: string; month?: string }) => {
    try {
      const res = await api.post('/payroll/unsettle', {
        ...data,
        month: data.month || selectedPayrollMonth
      });
      if (res && res.success) {
        showToast('info', res.message || 'Salary payment reverted to DUE');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to revert salary payment');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error reverting salary');
      return { success: false, error: err.message };
    }
  };

  const updateDriverAdvance = async (id: string, data: Partial<{ amount: number; date: string; paymentMode: string; reason: string; remarks: string }>) => {
    try {
      const res = await api.put(`/payroll/advance/${id}`, data);
      if (res && res.success) {
        showToast('success', res.message || 'Advance updated successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to update advance');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error updating advance');
      return { success: false, error: err.message };
    }
  };

  const deleteDriverAdvance = async (id: string) => {
    try {
      const res = await api.delete(`/payroll/advance/${id}`);
      if (res && res.success) {
        showToast('success', res.message || 'Advance deleted successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to delete advance');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error deleting advance');
      return { success: false, error: err.message };
    }
  };

  const updateDriverPenalty = async (id: string, data: Partial<{ amount: number; date: string; challanNumber: string; reason: string; vehicle: string }>) => {
    try {
      const res = await api.put(`/payroll/penalty/${id}`, data);
      if (res && res.success) {
        showToast('success', res.message || 'Penalty updated successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to update penalty');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error updating penalty');
      return { success: false, error: err.message };
    }
  };

  const deleteDriverPenalty = async (id: string) => {
    try {
      const res = await api.delete(`/payroll/penalty/${id}`);
      if (res && res.success) {
        showToast('success', res.message || 'Penalty deleted successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to delete penalty');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error deleting penalty');
      return { success: false, error: err.message };
    }
  };

  const deletePayrollSettlement = async (id: string) => {
    try {
      const res = await api.delete(`/payroll/settlement/${id}`);
      if (res && res.success) {
        showToast('success', res.message || 'Settlement removed successfully');
        await fetchPayrollSummary(selectedPayrollMonth);
        return { success: true };
      }
      showToast('error', res?.error || 'Failed to remove settlement');
      return { success: false, error: res?.error };
    } catch (err: any) {
      showToast('error', err.message || 'Network error removing settlement');
      return { success: false, error: err.message };
    }
  };

  const fetchDriverPayrollDetail = async (driverId: string, month?: string) => {
    try {
      const queryMonth = month || selectedPayrollMonth;
      const res = await api.get(`/payroll/driver/${driverId}?month=${encodeURIComponent(queryMonth)}`);
      if (res && res.success) {
        return { success: true, data: res.data };
      }
      return { success: false, error: res?.error || 'Failed to fetch driver payroll detail' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error fetching driver detail' };
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

  const addMonthlyBill = async (billData: Omit<MonthlyDepartmentBill, 'id'>) => {
    try {
      const res = await api.post('/bills', billData);
      if (res.success && res.data) {
        const savedBill: MonthlyDepartmentBill = { ...res.data, id: res.data.id || res.data._id };
        setMonthlyBills(prev => [savedBill, ...prev.filter(b => b.id !== savedBill.id && b.billNumber !== savedBill.billNumber)]);
        showToast('success', `Invoice ${savedBill.billNumber} for ₹${savedBill.totalBill.toLocaleString('en-IN')} created in database.`, 'Invoice Generated');
        return { success: true, bill: savedBill };
      }
      const newBill: MonthlyDepartmentBill = {
        ...billData,
        id: 'bill_' + Date.now()
      };
      setMonthlyBills(prev => [newBill, ...prev]);
      showToast('success', `Invoice ${newBill.billNumber} for ₹${newBill.totalBill.toLocaleString('en-IN')} created.`, 'Invoice Generated');
      return { success: true, bill: newBill };
    } catch (err: any) {
      console.error('Failed to generate bill via API', err);
      const newBill: MonthlyDepartmentBill = {
        ...billData,
        id: 'bill_' + Date.now()
      };
      setMonthlyBills(prev => [newBill, ...prev]);
      showToast('info', `Invoice ${newBill.billNumber} saved locally (offline).`, 'Invoice Saved');
      return { success: true, bill: newBill };
    }
  };

  const generateWeekendMemoBill = async (dailyDutyLogId: string) => {
    try {
      const res = await api.post('/bills/weekend-memo', { dailyDutyLogId });
      if (res.success && res.data) {
        const savedBill: MonthlyDepartmentBill = { ...res.data, id: res.data.id || res.data._id };
        setMonthlyBills(prev => [savedBill, ...prev.filter(b => b.id !== savedBill.id && b.billNumber !== savedBill.billNumber)]);
        
        // Update linked duty log locally
        setDailyDutyLogs(prev =>
          prev.map(l =>
            l.id === dailyDutyLogId
              ? { ...l, billingStatus: 'Billed', weekendBillNumber: savedBill.billNumber, weekendBillId: savedBill.id }
              : l
          )
        );

        showToast('success', `Cash Memo #${savedBill.billNumber} generated successfully.`, 'Memo Generated');
        return { success: true, bill: savedBill };
      }
      throw new Error(res.error || 'Failed to generate memo');
    } catch (err: any) {
      console.warn('generateWeekendMemoBill API failed, using local conversion', err);
      // Local fallback
      const targetLog = dailyDutyLogs.find(l => l.id === dailyDutyLogId);
      if (targetLog) {
        const basePrice = Number(targetLog.packageBasePrice) || 2255;
        const freeKm = Number(targetLog.packageFreeKm) || 80;
        const totalKm = Number(targetLog.totalKm) || Math.max(0, (targetLog.endKm || 0) - (targetLog.startKm || 0));
        const extraKm = Math.max(0, totalKm - freeKm);
        const extraKmRate = Number(targetLog.extraKmRate) || 14;
        const extraKmCost = targetLog.extraKmCost ?? (extraKm * extraKmRate);
        const tollParking = Number(targetLog.tollParkingAmount) || 0;
        const extraFuel = Number(targetLog.extraFuelCost || targetLog.fuelAmount) || 0;
        const subtotal = targetLog.subtotal || (basePrice + extraKmCost + tollParking + extraFuel);
        const gstRate = targetLog.gstRate !== undefined ? Number(targetLog.gstRate) : 5;
        const gstAmount = targetLog.gstAmount !== undefined ? Number(targetLog.gstAmount) : Math.round((subtotal * gstRate) / 100);
        const totalBill = targetLog.totalFare && targetLog.totalFare > 0 ? targetLog.totalFare : (subtotal + gstAmount);
        const billNumber = targetLog.dutySlipNumber.match(/^\d+$/) ? targetLog.dutySlipNumber : `MEMO-${targetLog.dutySlipNumber}`;

        const newBill: MonthlyDepartmentBill = {
          id: 'bill_' + Date.now(),
          billNumber,
          billType: 'Weekend / Off-Duty Cash Memo',
          dailyDutyLogId,
          departmentName: targetLog.departmentName,
          vehicle: targetLog.vehicle,
          billingMonth: targetLog.month || '2026-08',
          dutyStartDate: targetLog.date,
          dutyEndDate: targetLog.date,
          baseContractAmount: basePrice,
          packageFreeKm: freeKm,
          extraKmRate,
          totalKmRun: totalKm,
          extraKmCost,
          extraHoursCost: 0,
          fuelCost: extraFuel,
          tollParkingCost: tollParking,
          subtotal,
          gstRate,
          gstType: 'CGST_SGST',
          gstTaxableOn: 'TOTAL',
          gstAmount,
          cgstAmount: Math.round(gstAmount / 2),
          sgstAmount: gstAmount - Math.round(gstAmount / 2),
          igstAmount: 0,
          partyGstin: '05AAAGB1234F1Z5',
          totalBill,
          paidAmount: totalBill,
          balanceDue: 0,
          status: 'Paid',
          dueDate: targetLog.date,
          journeyFrom: targetLog.journeyFrom || 'D.Dun Bangarawali',
          journeyTo: targetLog.journeyTo || targetLog.tripDestination || 'Vikasnagar & Local to D.Dun',
          invoicePdf: `cashmemo_${billNumber}.pdf`
        };

        setMonthlyBills(prev => [newBill, ...prev]);
        setDailyDutyLogs(prev =>
          prev.map(l =>
            l.id === dailyDutyLogId
              ? { ...l, billingStatus: 'Billed', weekendBillNumber: billNumber, weekendBillId: newBill.id }
              : l
          )
        );

        showToast('success', `Cash Memo #${billNumber} saved locally.`, 'Memo Issued');
        return { success: true, bill: newBill };
      }
      return { success: false, error: err.message };
    }
  };

  const updateBillStatus = async (id: string, status: MonthlyDepartmentBill['status']) => {
    try {
      setMonthlyBills(prev =>
        prev.map(item => {
          if (item.id === id) {
            const isPaid = status === 'Paid';
            const paidAmount = isPaid ? item.totalBill : item.paidAmount;
            const balanceDue = isPaid ? 0 : Math.max(0, item.totalBill - paidAmount);
            return { ...item, status, paidAmount, balanceDue };
          }
          return item;
        })
      );
      showToast('info', `Invoice status marked as ${status}.`, 'Invoice Updated');
      await api.put(`/bills/${id}/status`, { status });
    } catch (err) {
      console.error('Failed to update bill status on server', err);
    }
  };

  const applyGstRate = async (gstRate: number, gstType: 'CGST_SGST' | 'IGST' = 'CGST_SGST', departmentName?: string) => {
    try {
      setActiveGstRate(gstRate);
      setActiveGstType(gstType);

      // Optimistic state update
      setMonthlyBills(prev =>
        prev.map(b => {
          if (departmentName && departmentName !== 'All' && b.departmentName !== departmentName) {
            return b;
          }
          const subtotal =
            (b.baseContractAmount || 0) +
            (b.extraKmCost || 0) +
            (b.extraHoursCost || 0) +
            (b.extraDriverAllowance || 0) +
            (b.fuelCost || 0) +
            (b.nightCost || 0) +
            (b.tollParkingCost || 0);

          const gstAmount = Math.round((subtotal * gstRate) / 100);
          const cgstAmount = gstType === 'IGST' ? 0 : Math.round(gstAmount / 2);
          const sgstAmount = gstType === 'IGST' ? 0 : gstAmount - cgstAmount;
          const igstAmount = gstType === 'IGST' ? gstAmount : 0;
          const totalBill = subtotal + gstAmount;
          const paidAmount = b.status === 'Paid' ? totalBill : (b.paidAmount || 0);
          const balanceDue = Math.max(0, totalBill - paidAmount);

          return {
            ...b,
            subtotal,
            gstRate,
            gstType,
            gstAmount,
            cgstAmount,
            sgstAmount,
            igstAmount,
            totalBill,
            paidAmount,
            balanceDue
          };
        })
      );

      const res = await api.post('/bills/apply-gst', {
        gstRate,
        gstType,
        departmentName: departmentName && departmentName !== 'All' ? departmentName : undefined
      });

      if (res.success && Array.isArray(res.data)) {
        setMonthlyBills(
          res.data.map((item: any) => ({
            ...item,
            id: item.id || item._id
          }))
        );
      }

      showToast('success', `${gstRate}% GST applied successfully to monthly bills.`, 'GST Applied');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to apply GST bulk', err);
      showToast('info', `GST applied locally (${gstRate}%).`, 'GST Updated');
      return { success: true };
    }
  };

  const deleteMonthlyBill = async (id: string) => {
    try {
      setMonthlyBills(prev => prev.filter(b => b.id !== id));
      showToast('info', 'Invoice removed.', 'Invoice Deleted');
      await api.delete(`/bills/${id}`);
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete bill', err);
      return { success: false, error: err.message };
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

  const updateDepartmentPaymentStatus = (id: string, status: DepartmentPayment['status']) => {
    try {
      setDepartmentPayments(prev =>
        prev.map(p => (p.id === id ? { ...p, status } : p))
      );
      showToast('info', `Payment status marked as ${status}.`, 'Payment Status Updated');
    } catch (err) {
      console.error('Failed to update payment status', err);
      showToast('error', 'Could not update payment status.', 'Error');
    }
  };

  const updateTripStatus = async (id: string, status: TripFinancial['status']) => {
    try {
      setTrips(prev =>
        prev.map(t => (t.id === id || t._id === id ? { ...t, status } : t))
      );
      await api.patch(`/bookings/${id}/status`, { status });
      showToast('info', `Trip/Booking status changed to ${status}.`, 'Status Updated');
    } catch (err) {
      console.error('Failed to update trip status', err);
      showToast('error', 'Could not update trip status.', 'Error');
    }
  };

  const assignBookingDriver = async (id: string, driver: string, vehicle?: string) => {
    try {
      const res = await api.patch(`/bookings/${id}/assign`, { driver, vehicle });
      if (res && res.data) {
        const updated = res.data;
        setTrips(prev =>
          prev.map(t => (t.id === id || t._id === id ? {
            ...t,
            driver: updated.driver,
            driverName: updated.driverName || updated.driver,
            vehicle: updated.vehicle || t.vehicle,
            vehicleModel: updated.vehicleModel || t.vehicleModel
          } : t))
        );
      } else {
        setTrips(prev =>
          prev.map(t => (t.id === id || t._id === id ? {
            ...t,
            driver,
            driverName: driver,
            ...(vehicle ? { vehicle } : {})
          } : t))
        );
      }
      showToast(
        'success',
        driver && driver !== 'Unassigned' && driver !== 'None' ? `Driver ${driver} assigned.` : 'Driver unassigned from booking.',
        'Assignment Updated'
      );
      return { success: true, data: res?.data };
    } catch (err: any) {
      console.error('Failed to assign driver', err);
      showToast('error', err?.message || 'Could not update driver assignment.', 'Error');
      return { success: false, error: err?.message };
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

  const updateMaintenanceStatus = (id: string, status: MaintenanceRecord['status']) => {
    setMaintenanceRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    );
    showToast('info', `Maintenance status updated to ${status}.`, 'Status Updated');
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

  const updateComplianceDoc = async (id: string, docData: Partial<DocumentCompliance>) => {
    try {
      try {
        const res = await api.put(`/compliance/${id}`, docData);
        if (res.success && res.data) {
          const serverDoc: DocumentCompliance = {
            ...res.data,
            id: res.data.id || res.data._id
          };
          if (serverDoc.entityType === 'Vehicle') {
            setVehicleCompliance(prev => prev.map(d => d.id === id ? serverDoc : d));
          } else {
            setDriverCompliance(prev => prev.map(d => d.id === id ? serverDoc : d));
          }
          showToast('success', `${serverDoc.documentName} for ${serverDoc.entityName} updated.`, 'Compliance Saved');
          return;
        }
      } catch (apiErr) {
        // silent fallback for offline
      }

      let metaUpdates: Partial<DocumentCompliance> = {};
      if (docData.expiryDate) {
        const expDate = new Date(docData.expiryDate);
        if (!isNaN(expDate.getTime())) {
          const now = new Date();
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const statusType = diffDays < 0 ? 'late' : diffDays <= 30 ? 'soon' : 'ok';
          const expiryLabel = diffDays < 0
            ? `Expired ${Math.abs(diffDays)} days ago`
            : diffDays <= 30
              ? `In ${diffDays} days`
              : diffDays >= 365
                ? `Valid · ${Math.round(diffDays / 365)} years`
                : `Valid · ${Math.round(diffDays / 30)} months`;
          metaUpdates = { statusType, expiryLabel, daysLeft: diffDays };
        }
      }

      setVehicleCompliance(prev => prev.map(d => d.id === id ? { ...d, ...docData, ...metaUpdates } : d));
      setDriverCompliance(prev => prev.map(d => d.id === id ? { ...d, ...docData, ...metaUpdates } : d));
      showToast('success', 'Compliance document details updated.', 'Compliance Saved');
    } catch (err) {
      console.error('Failed to update compliance doc', err);
      showToast('error', 'Could not update compliance document.', 'Error');
    }
  };

  const deleteComplianceDoc = async (id: string, entityType: 'Vehicle' | 'Driver') => {
    try {
      try {
        await api.delete(`/compliance/${id}`);
      } catch (apiErr) {
        // silent fallback
      }

      if (entityType === 'Vehicle') {
        setVehicleCompliance(prev => prev.filter(d => d.id !== id));
      } else {
        setDriverCompliance(prev => prev.filter(d => d.id !== id));
      }
      showToast('info', 'Compliance record removed.', 'Deleted');
    } catch (err) {
      console.error('Failed to delete compliance doc', err);
      showToast('error', 'Could not delete compliance doc.', 'Error');
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
        dashboardStats,
        isLoadingDashboard,
        fetchLiveDashboardStats,
        isLoading,
        loadingKey,
        refreshData,
        withLoading,
        isLoadingVehicles,
        isLoadingDrivers,
        isLoadingDepartments,
        isLoadingBookings,
        isLoadingExpenses,
        isLoadingCompliance,
        isLoadingMaintenance,
        isLoadingProfitability,
        toasts,
        showToast,
        dismissToast,
        driverSubTab,
        setDriverSubTab: handleSetDriverSubTab,
        departmentSubTab,
        setDepartmentSubTab: handleSetDepartmentSubTab,
        departmentContracts,
        fetchLiveContracts,
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
        fetchLiveMonthlyBills,
        addMonthlyBill,
        generateWeekendMemoBill,
        updateBillStatus,
        applyGstRate,
        deleteMonthlyBill,
        activeGstRate,
        setActiveGstRate,
        activeGstType,
        setActiveGstType,
        departmentPayments,
        addDepartmentPayment,
        updateDepartmentPaymentStatus,
        vehicleSubTab,
        setVehicleSubTab,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        updateVehicleStatus,
        switchVehicleMode,
        drivers,
        fetchLiveDrivers,
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
        payrollItems,
        isPayrollLoading,
        selectedPayrollMonth,
        setSelectedPayrollMonth,
        fetchPayrollSummary,
        giveDriverAdvance,
        updateDriverAdvance,
        deleteDriverAdvance,
        addDriverPenalty,
        updateDriverPenalty,
        deleteDriverPenalty,
        settleDriverSalary,
        unsettleDriverSalary,
        deletePayrollSettlement,
        fetchDriverPayrollDetail,
        contracts,
        trips,
        bookings: trips,
        fetchLiveBookings,
        addTrip,
        updateTripStatus,
        assignBookingDriver,
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
        fetchLiveFastagTransactions,
        maintenanceRecords,
        addMaintenanceRecord,
        updateMaintenanceStatus,
        vehicleCompliance,
        addVehicleComplianceDoc,
        driverCompliance,
        addDriverComplianceDoc,
        updateComplianceDoc,
        deleteComplianceDoc,
        complianceStats
      }}
    >
      {children}
    </FleetContext.Provider>
  );
};

export { useFleet } from './useFleet';
