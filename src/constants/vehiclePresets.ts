/**
 * Preset Fleet Vehicle Library for Image Picker
 * Curated fleet vehicles with high-resolution photos and specs.
 */

export interface VehiclePreset {
  id: string;
  name: string;
  category: 'Sedan' | 'MUV / SUV' | 'Hatchback' | 'Van / Commercial' | 'EV' | 'Bus';
  seatingCapacity: number;
  fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  image: string;
  popular?: boolean;
}

export const VEHICLE_PRESETS: VehiclePreset[] = [
  {
    id: 'innova-crysta',
    name: 'Toyota Innova Crysta',
    category: 'MUV / SUV',
    seatingCapacity: 7,
    fuelType: 'Diesel',
    image: '/innova-cab.png',
    popular: true,
  },
  {
    id: 'maruti-dzire',
    name: 'Maruti Suzuki Dzire / Sedan',
    category: 'Sedan',
    seatingCapacity: 5,
    fuelType: 'CNG',
    image: '/vehicles/sedan-cab.jpg',
    popular: true,
  },
  {
    id: 'mahindra-muv',
    name: 'Mahindra Marazzo / Ertiga MUV',
    category: 'MUV / SUV',
    seatingCapacity: 7,
    fuelType: 'Diesel',
    image: '/vehicles/muv-cab.jpg',
    popular: true,
  },
  {
    id: 'tempo-traveller',
    name: 'Force Tempo Traveller (12/17 Seater)',
    category: 'Van / Commercial',
    seatingCapacity: 12,
    fuelType: 'Diesel',
    image: '/vehicles/tempo-traveller.jpg',
    popular: true,
  },
  {
    id: 'hatchback-taxi',
    name: 'Maruti WagonR / Swift Hatchback',
    category: 'Hatchback',
    seatingCapacity: 5,
    fuelType: 'CNG',
    image: '/vehicles/sedan-cab.jpg',
    popular: false,
  },
  {
    id: 'nexon-ev',
    name: 'Tata Nexon EV / Tigor EV Cab',
    category: 'EV',
    seatingCapacity: 5,
    fuelType: 'Electric',
    image: '/innova-cab.png',
    popular: false,
  },
];

export const VEHICLE_CATEGORIES = [
  'All',
  'MUV / SUV',
  'Sedan',
  'Van / Commercial',
  'Hatchback',
  'EV',
] as const;
