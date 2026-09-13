import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { nowStamp } from '../data/format';
import type { Attachment } from '../media/types';
import {
  driverAuthApi,
  dutyApi,
  fuelApi,
  onDriverSessionExpired,
  restoreDriverSession,
  SessionExpiredError,
  type DriverAuthPayload,
} from '../services/api';
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
  startDuty: (startOdo: number, photoUri?: string) => Promise<void>;
  endDuty: (endOdo: number, remarks?: string, photoUri?: string) => Promise<void>;
  addFuel: (entry: Omit<FuelEntry, 'id' | 'at'>) => void | Promise<void>;
  addExpense: (entry: Omit<ExpenseEntry, 'id' | 'at' | 'status'>) => void;
  addAdvance: (amount: number, reason: string) => void;
  uploadDoc: (type: string, file?: Attachment) => void;
};

const SessionContext = createContext<SessionValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const defaultDriver = {
  name: 'Driver',
  id: '—',
  mobile: '—',
  licence: '—',
  licenceValid: '—',
  initials: 'DR',
  agency: 'KABPRO',
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
  reg: '—',
  type: '—',
  model: '—',
  id: '—',
  odometer: 0,
};

const defaultTrip = { id: '—', status: 'No active trip' };

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [driver, setDriver] = useState(defaultDriver);
  const [vehicle, setVehicle] = useState(defaultVehicle);
  const [trip, setTrip] = useState(defaultTrip);
  const [onDuty, setOnDuty] = useState(false);
  const [odometer, setOdometer] = useState(0);
  const [todayKm, setTodayKm] = useState(0);
  const [walletOpening, setWalletOpening] = useState(0);
  const [walletRemaining, setWalletRemaining] = useState(0);
  const [duties, setDuties] = useState<DutyLog[]>([]);
  const [fuels, setFuels] = useState<FuelEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [advances, setAdvances] = useState<AdvanceEntry[]>([]);
  const [documents, setDocuments] = useState<DocEntry[]>([]);
  const [txns, setTxns] = useState<Txn[]>([]);

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
    setTrip(payload.trip || defaultTrip);
    setOnDuty(payload.driver.onDuty);
    setOdometer(payload.vehicle?.odometer ?? payload.driver.odometer ?? 0);
    setTodayKm(payload.driver.todayKm ?? 0);
    if (payload.wallet) {
      setWalletOpening(payload.wallet.opening ?? 0);
      setWalletRemaining(payload.wallet.remaining ?? 0);
    } else {
      setWalletOpening(0);
      setWalletRemaining(0);
    }
    setSignedIn(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const me = await driverAuthApi.me();
      if (me) applyProfile(me);
      return me;
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        setSignedIn(false);
        setDriver(defaultDriver);
        setVehicle(defaultVehicle);
        setTrip(defaultTrip);
        driverSocket.disconnect();
      }
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
    setOnDuty(false);
    setOdometer(0);
    setTodayKm(0);
    setWalletOpening(0);
    setWalletRemaining(0);
  }, []);

  useEffect(() => {
    return onDriverSessionExpired(() => {
      void signOut();
    });
  }, [signOut]);

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

    const refreshFromDashboard = async (eventData?: any) => {
      console.log('🔄 [Session] Dashboard action detected via socket, refreshing driver profile...', eventData);
      try {
        await refreshProfile();
      } catch (err) {
        console.warn('Could not refresh profile after socket event:', err);
      }
    };

    const unsubAny = driverSocket.on('driver:any_change', refreshFromDashboard);
    const unsubExpense = driverSocket.on('driver-expense:updated', refreshFromDashboard);
    const unsubExpenseCreated = driverSocket.on('driver-expense:created', refreshFromDashboard);

    return () => {
      unsubAny();
      unsubExpense();
      unsubExpenseCreated();
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
      walletOpening,
      walletRemaining,
      duties,
      fuels,
      expenses,
      advances,
      documents,
      txns,
      startDuty: async (startOdo, photoUri) => {
        const res = await dutyApi.startDuty({ startOdometer: startOdo, photoUrl: photoUri });
        setOnDuty(true);
        setOdometer(startOdo);
        setDuties((prev) => [
          { id: uid('d'), startedAt: res?.startedAt || nowStamp(), startOdo, photo: !!photoUri },
          ...prev,
        ]);
        try {
          await refreshProfile();
        } catch (err) {
          console.warn('Could not refresh profile after startDuty:', err);
        }
      },
      endDuty: async (endOdo, remarks, photoUri) => {
        const res = await dutyApi.endDuty({ endOdometer: endOdo, remarks, photoUrl: photoUri });
        const kmRun = res?.kmRun ?? Math.max(0, endOdo - odometer);
        setOnDuty(false);
        setOdometer(endOdo);
        setTodayKm((prev) => prev + kmRun);
        setDuties((prev) => {
          const open = prev.find((d) => !d.endedAt);
          if (!open) {
            return [
              {
                id: uid('d'),
                startedAt: nowStamp(),
                endedAt: res?.endedAt || nowStamp(),
                startOdo: odometer,
                endOdo,
                km: kmRun,
                remarks,
                photo: !!photoUri,
              },
              ...prev,
            ];
          }
          return prev.map((d) =>
            d.id === open.id
              ? {
                  ...d,
                  endedAt: res?.endedAt || nowStamp(),
                  endOdo,
                  km: kmRun,
                  remarks: remarks || d.remarks,
                  photo: !!photoUri || d.photo,
                }
              : d
          );
        });
        try {
          await refreshProfile();
        } catch (err) {
          console.warn('Could not refresh profile after endDuty:', err);
        }
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
