import type { Driver, Vehicle } from '../types/fleet';

const EMPTY_PLATES = new Set(['', '—', '-', 'Unassigned', 'None', 'N/A']);

export function plateKey(value?: string | null) {
  return String(value || '')
    .replace(/[\s-]/g, '')
    .toUpperCase();
}

export function isAssignedPlate(value?: string | null) {
  if (!value) return false;
  return !EMPTY_PLATES.has(String(value).trim());
}

/**
 * Resolve the plate shown on driver views.
 * Prefer Driver.assignedVehicle; fall back to Vehicle.assignedDriver match
 * for older records that only synced one side.
 */
export function resolveAssignedVehicle(
  driver: Pick<Driver, 'name' | 'assignedVehicle'>,
  vehicles: Vehicle[] = []
): string | null {
  if (isAssignedPlate(driver.assignedVehicle)) {
    return String(driver.assignedVehicle).trim();
  }

  const match = vehicles.find(
    (vehicle) =>
      vehicle.assignedDriver &&
      vehicle.assignedDriver.trim().toLowerCase() === driver.name.trim().toLowerCase()
  );

  return match?.registrationNumber || null;
}
