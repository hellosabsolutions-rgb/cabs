import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { nowStamp } from '../data/format';
import type { Attachment } from '../media/types';
import { driverAuthApi, dutyApi, fuelApi, restoreDriverSession, type DriverAuthPayload } from '../services/api';
import { clearTokens, saveLastIdentifier, saveTokens } from '../services/authStorage';
import { signOutGoogleNative } from '../services/googleAuth';
import { driverSocket } from '../services/socket';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'settled';

export type DutyLog = {
  id: string;
  startedAt: string;
  endedAt?: string;
  startOdo: number;
  endOdo?: number;
  km?: number;
  remarks?: string;
  photo: boolean;
};

export type FuelEntry = {
  id: string;
  at: string;
  odometer: number;
  litres: number;
  cost: number;
  station: string;
  fuelType: string;
  photo: boolean;
  location?: string;
  receiptUri?: string;
  latitude?: number | null;
  longitude?: number | null;
};

export type ExpenseEntry = {
  id: string;
  at: string;
  category: string;
  amount: number;
  note: string;
  status: ApprovalStatus;
  photo: boolean;
};

export type AdvanceEntry = {
  id: string;
  at: string;
  amount: number;
  reason: string;
  status: ApprovalStatus;
};

export type DocEntry = {
  id: string;
  type: string;
  at: string;
  tripId: string;
  status: 'uploaded' | 'pending';
  fileName?: string;
  kind?: 'image' | 'pdf';
  uri?: string;
  size?: string;
};

export type Txn = {
  id: string;
  label: string;
  amount: number;
  at: string;
  ref: string;
  running: number;
};

type SessionValue = {
  driver: {
    name: string;
    id: string;
    mobile: string;
    licence: string;
    licenceValid: string;
    initials: string;
    agency: string;
    photo?: string | null;
    email?: string | null;
  };
  vehicle: {
    reg: string;
    type: string;
    model: string;
    id: string;
    odometer?: number;
    fuelType?: string;
    departmentName?: string;
  };
  trip: { id: string; status: string };
  authReady: boolean;
  signedIn: boolean;
  applyAuth: (payload: DriverAuthPayload, options?: { rememberMe?: boolean; identifier?: string }) => Promise<void>;
  refreshProfile: () => Promise<DriverAuthPayload | null>;
  signOut: () => Promise<void>;
  onDuty: boolean;
  odometer: number;
  todayKm: number;
  lastValidOdo: number;
  walletOpening: number;
  walletRemaining: number;
  duties: DutyLog[];
  fuels: FuelEntry[];
  expenses: ExpenseEntry[];
  advances: AdvanceEntry[];
  documents: DocEntry[];
  txns: Txn[];
  startDuty: (startOdo: number, photoUri?: string) => void | Promise<void>;
  endDuty: (endOdo: number, remarks: string) => void;
  addFuel: (entry: Omit<FuelEntry, 'id' | 'at'>) => void | Promise<void>;
  addExpense: (entry: Omit<ExpenseEntry, 'id' | 'at' | 'status'>) => void;
  addAdvance: (amount: number, reason: string) => void;
  uploadDoc: (type: string, file?: Attachment) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const seedTxns: Txn[] = [
  { id: 't1', label: 'Advance received', amount: 5000, at: '08 Sep, 09:20', ref: 'ADV-104', running: 5000 },
  { id: 't2', label: 'Fuel expense', amount: -2100, at: '08 Sep, 14:05', ref: 'FUL-221', running: 2900 },
  { id: 't3', label: 'Toll expense', amount: -420, at: '08 Sep, 16:40', ref: 'EXP-118', running: 2480 },
  { id: 't4', label: 'Food expense', amount: -180, at: '08 Sep, 19:10', ref: 'EXP-119', running: 2300 },
];

const defaultDriver = {
  name: 'Rahul Sharma',
  id: 'DRV-1024',
  mobile: '+91 98765 43210',
  licence: 'DL-0420180092341',
  licenceValid: '12 Jan 2028',
  initials: 'RS',
  agency: 'Sharma Logistics',
  photo: null as string | null,
  email: null as string | null,
};

const defaultVehicle: {
  reg: string;
  type: string;
  model: string;
  id: string;
  odometer?: number;
  fuelType?: string;
  departmentName?: string;
} = {
  reg: 'DL 01 AB 1234',
  type: 'MUV',
  model: 'Toyota Innova Crysta',
  id: 'VEH-331',
  odometer: 0,
};

const defaultTrip = { id: 'TRP-8841', status: 'In progress' };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [driver, setDriver] = useState(defaultDriver);
  const [vehicle, setVehicle] = useState(defaultVehicle);
  const [trip, setTrip] = useState(defaultTrip);
  const [onDuty, setOnDuty] = useState(true);
  const [odometer, setOdometer] = useState(45470);
  const [todayKm, setTodayKm] = useState(86);
  const [walletRemaining, setWalletRemaining] = useState(2300);
  const [duties, setDuties] = useState<DutyLog[]>([
    {
      id: 'd-open',
      startedAt: '11 Sep, 08:12',
      startOdo: 45384,
      photo: true,
    },
    {
      id: 'd-1',
      startedAt: '10 Sep, 07:40',
      endedAt: '10 Sep, 19:05',
      startOdo: 45110,
      endOdo: 45384,
      km: 274,
      photo: true,
    },
  ]);
  const [fuels, setFuels] = useState<FuelEntry[]>([
    {
      id: 'f1',
      at: '08 Sep, 14:05',
      odometer: 45220,
      litres: 22,
      cost: 2100,
      station: 'IOCL Mayapuri',
      fuelType: 'Diesel',
      photo: true,
    },
  ]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([
    {
      id: 'e1',
      at: '08 Sep, 16:40',
      category: 'Toll',
      amount: 420,
      note: 'DND flyway',
      status: 'approved',
      photo: true,
    },
    {
      id: 'e2',
      at: '08 Sep, 19:10',
      category: 'Food',
      amount: 180,
      note: 'Driver meal',
      status: 'pending',
      photo: true,
    },
  ]);
  const [advances, setAdvances] = useState<AdvanceEntry[]>([
    {
      id: 'a1',
      at: '08 Sep, 09:20',
      amount: 5000,
      reason: 'Trip petty cash',
      status: 'paid',
    },
  ]);
  const [documents, setDocuments] = useState<DocEntry[]>([
    {
      id: 'doc1',
      type: 'Delivery Challan',
      at: '11 Sep, 08:30',
      tripId: 'TRP-8841',
      status: 'uploaded',
      fileName: 'challan_signed_8841.pdf',
      kind: 'pdf',
      size: '1.4 MB',
      uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'doc2',
      type: 'POD',
      at: '11 Sep, 09:10',
      tripId: 'TRP-8841',
      status: 'pending',
      fileName: 'pod_receipt_8841.jpg',
      kind: 'image',
      size: '850 KB',
      uri: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'doc3',
      type: 'Invoice',
      at: '10 Sep, 18:40',
      tripId: 'TRP-8830',
      status: 'uploaded',
      fileName: 'tax_invoice_8830.pdf',
      kind: 'pdf',
      size: '2.1 MB',
      uri: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'doc4',
      type: 'Vehicle Documents',
      at: '01 Sep, 10:00',
      tripId: 'TRP-8841',
      status: 'uploaded',
      fileName: 'rc_fitness_insurance.pdf',
      kind: 'pdf',
      size: '3.6 MB',
      uri: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=800&q=80',
    },
  ]);
  const [txns, setTxns] = useState<Txn[]>(seedTxns);

  const applyProfile = useCallback((payload: DriverAuthPayload) => {
    setDriver({
      name: payload.driver.name,
      id: payload.driver.code || payload.driver.id,
      mobile: payload.driver.mobile,
      licence: payload.driver.licence,
      licenceValid: payload.driver.licenceValid,
      initials: payload.driver.initials,
      agency: payload.driver.agency,
      photo: payload.driver.photo,
      email: payload.driver.email,
    });
    if (payload.vehicle) {
      setVehicle({
        id: payload.vehicle.id,
        reg: payload.vehicle.reg,
        type: payload.vehicle.type,
        model: payload.vehicle.model,
        odometer: payload.vehicle.odometer,
        fuelType: payload.vehicle.fuelType,
        departmentName: payload.vehicle.departmentName,
      });
      if (payload.vehicle.odometer && payload.vehicle.odometer > 0) {
        setOdometer(payload.vehicle.odometer);
      }
    } else {
      setVehicle({ id: '—', reg: '—', type: '—', model: '—' });
    }
    if (payload.trip) setTrip(payload.trip);
    setOnDuty(payload.driver.onDuty);
    if (payload.driver.odometer) setOdometer(payload.driver.odometer);
    setSignedIn(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await driverAuthApi.me();
      if (me) applyProfile(me);
      return me;
    } catch {
      return null;
    }
  }, [applyProfile]);

  const applyAuth = useCallback(
    async (
      payload: DriverAuthPayload,
      options?: { rememberMe?: boolean; identifier?: string }
    ) => {
      const rememberMe = options?.rememberMe ?? payload.session?.rememberMe ?? true;
      const accessToken = payload.accessToken || payload.token;
      if (accessToken) {
        await saveTokens(accessToken, payload.refreshToken, rememberMe);
        void driverSocket.connect(accessToken);
      }
      if (options?.identifier) {
        await saveLastIdentifier(options.identifier);
      }
      applyProfile(payload);
    },
    [applyProfile]
  );

  const signOut = useCallback(async () => {
    driverSocket.disconnect();
    await driverAuthApi.logout();
    await signOutGoogleNative();
    await clearTokens();
    setSignedIn(false);
    setDriver(defaultDriver);
    setVehicle(defaultVehicle);
    setTrip(defaultTrip);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await restoreDriverSession();
        if (!cancelled && me) applyProfile(me);
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyProfile]);

  // ─── Real-time Dashboard Sync via WebSocket ───
  useEffect(() => {
    if (!signedIn) {
      driverSocket.disconnect();
      return;
    }

    void driverSocket.connect();

    const unsubscribe = driverSocket.on('driver:any_change', async (eventData: any) => {
      console.log('🔄 [Session] Dashboard action detected via socket, refreshing driver profile...', eventData);
      try {
        await refreshProfile();
      } catch (err) {
        console.warn('Could not refresh profile after socket event:', err);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [signedIn, refreshProfile]);

  const value = useMemo<SessionValue>(
    () => ({
      driver,
      vehicle,
      trip,
      authReady,
      signedIn,
      applyAuth,
      refreshProfile,
      signOut,
      onDuty,
      odometer,
      todayKm,
      lastValidOdo: odometer,
      walletOpening: 0,
      walletRemaining,
      duties,
      fuels,
      expenses,
      advances,
      documents,
      txns,
      startDuty: async (startOdo, photoUri) => {
        try {
          await dutyApi.startDuty({ startOdometer: startOdo, photoUrl: photoUri });
        } catch (e) {
          console.warn('duty/start server sync fallback:', e);
        }
        setOnDuty(true);
        setOdometer(startOdo);
        setDuties((prev) => [
          { id: uid('d'), startedAt: nowStamp(), startOdo, photo: true },
          ...prev,
        ]);
      },
      endDuty: (endOdo, remarks) => {
        const kmRun = Math.max(0, endOdo - odometer);
        setOnDuty(false);
        setOdometer(endOdo);
        setTodayKm((prev) => prev + kmRun);
        setDuties((prev) => {
          const open = prev.find((d) => !d.endedAt);
          if (!open) return prev;
          return prev.map((d) =>
            d.id === open.id
              ? { ...d, endedAt: nowStamp(), endOdo, km: endOdo - d.startOdo, remarks }
              : d
          );
        });
      },
      addFuel: async (entry) => {
        const nextWallet = walletRemaining - entry.cost;
        setFuels((prev) => [{ id: uid('f'), at: nowStamp(), ...entry }, ...prev]);
        setOdometer(Math.max(odometer, entry.odometer));
        setWalletRemaining(nextWallet);
        setTxns((prev) => [
          {
            id: uid('t'),
            label: 'Fuel expense',
            amount: -entry.cost,
            at: nowStamp(),
            ref: uid('FUL').toUpperCase(),
            running: nextWallet,
          },
          ...prev,
        ]);
        try {
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
          await fuelApi.create({
            vehicle: vehicle.reg && vehicle.reg !== '—' ? vehicle.reg : 'Default Vehicle',
            driverName: driver.name || 'Driver',
            date: dateStr,
            time: timeStr,
            odometer: entry.odometer,
            fuelType: entry.fuelType,
            litres: entry.litres,
            ratePerLitre: entry.litres ? Math.round((entry.cost / entry.litres) * 100) / 100 : 0,
            totalCost: entry.cost,
            stationName: entry.station,
            location: entry.location,
            receiptPhoto: entry.receiptUri,
            coordinates: {
              latitude: entry.latitude ?? null,
              longitude: entry.longitude ?? null,
            },
          });
        } catch (e) {
          console.warn('Backend fuel sync failed or offline:', e);
        }
      },
      addExpense: (entry) => {
        const nextWallet = walletRemaining - entry.amount;
        setExpenses((prev) => [
          { id: uid('e'), at: nowStamp(), status: 'pending', ...entry },
          ...prev,
        ]);
        setWalletRemaining(nextWallet);
        setTxns((prev) => [
          {
            id: uid('t'),
            label: `${entry.category} expense`,
            amount: -entry.amount,
            at: nowStamp(),
            ref: uid('EXP').toUpperCase(),
            running: nextWallet,
          },
          ...prev,
        ]);
      },
      addAdvance: (amount, reason) => {
        setAdvances((prev) => [
          { id: uid('a'), at: nowStamp(), amount, reason, status: 'pending' },
          ...prev,
        ]);
      },
      uploadDoc: (type, file) => {
        setDocuments((prev) => [
          {
            id: uid('doc'),
            type,
            at: nowStamp(),
            tripId: 'TRP-8841',
            status: 'uploaded',
            fileName: file?.name || `${type.toLowerCase().replace(/\s+/g, '_')}.pdf`,
            kind: file?.kind || 'pdf',
            uri: file?.uri,
            size: '1.2 MB',
          },
          ...prev,
        ]);
      },
    }),
    [authReady, signedIn, applyAuth, signOut, driver, vehicle, trip, onDuty, odometer, todayKm, walletRemaining, duties, fuels, expenses, advances, documents, txns]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
