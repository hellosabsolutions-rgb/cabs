export type BookingStatus = 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
export type TripType = 'One-way (Single)' | 'Round Trip';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export type BookingItem = {
  id: string;
  bookingNumber: string;
  status: BookingStatus;
  tripType: TripType;
  startDate: string; // YYYY-MM-DD
  startTime: string; // e.g. "09:30 AM"
  endDate?: string;
  endTime?: string;
  customerName: string;
  customerPhone: string;
  passengersCount: number;
  luggageCount?: number;
  pickupLocation: string;
  pickupLandmark?: string;
  pickupCoords?: { latitude: number; longitude: number };
  dropLocation: string;
  dropLandmark?: string;
  dropCoords?: { latitude: number; longitude: number };
  route: string;
  routeDistanceKm: number;
  estimatedDurationMins: number;
  vehicle: string;
  vehicleModel?: string;
  driverName?: string;
  totalAmount: number;
  advanceAmount: number;
  pendingAmount: number;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  notes?: string;
  startOdometer?: number;
  endOdometer?: number;
  totalKmRun?: number;
};

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns dynamic mock bookings anchored to today's date so Today & Tomorrow,
 * This Week, and This Month always have realistic trips.
 */
export function generateMockBookings(todayDate: Date = new Date()): BookingItem[] {
  const today = new Date(todayDate);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const in5Days = new Date(today);
  in5Days.setDate(today.getDate() + 5);

  const in10Days = new Date(today);
  in10Days.setDate(today.getDate() + 10);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return [
    {
      id: 'bk-101',
      bookingNumber: 'BK-9481',
      status: 'Ongoing',
      tripType: 'One-way (Single)',
      startDate: formatIsoDate(today),
      startTime: '10:30 AM',
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98101 23456',
      passengersCount: 2,
      luggageCount: 2,
      pickupLocation: 'Terminal 3, Departure Gate 4, IGI Airport',
      pickupLandmark: 'Opposite Pillar 12',
      pickupCoords: { latitude: 28.5562, longitude: 77.1000 },
      dropLocation: 'Cyber City, Building 10, DLF Phase 2, Gurugram',
      dropLandmark: 'Next to Cyber Hub entrance',
      dropCoords: { latitude: 28.4952, longitude: 77.0895 },
      route: 'IGI Airport T3 → Cyber City Gurugram',
      routeDistanceKm: 18.5,
      estimatedDurationMins: 32,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 1850,
      advanceAmount: 1850,
      pendingAmount: 0,
      paymentStatus: 'Paid',
      specialRequests: 'Passenger arriving on flight 6E-204. Need AC turned on prior to pickup. Has 2 medium check-in trolley bags.',
      notes: 'Corporate billing client · Fastag toll reimbursed',
    },
    {
      id: 'bk-102',
      bookingNumber: 'BK-9482',
      status: 'Scheduled',
      tripType: 'Round Trip',
      startDate: formatIsoDate(today),
      startTime: '04:15 PM',
      endDate: formatIsoDate(today),
      endTime: '09:00 PM',
      customerName: 'Priya Narang',
      customerPhone: '+91 98712 34567',
      passengersCount: 4,
      luggageCount: 3,
      pickupLocation: 'B-4/12, Safdarjung Enclave, New Delhi',
      pickupLandmark: 'Near Deer Park Gate 2',
      pickupCoords: { latitude: 28.5684, longitude: 77.1952 },
      dropLocation: 'Sector 62, Electronic City, Noida',
      dropLandmark: 'Tower B, Stellar IT Park',
      dropCoords: { latitude: 28.6280, longitude: 77.3649 },
      route: 'Safdarjung Enclave → Noida Sec 62 (Round Trip)',
      routeDistanceKm: 34.0,
      estimatedDurationMins: 55,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 3200,
      advanceAmount: 1000,
      pendingAmount: 2200,
      paymentStatus: 'Partial',
      specialRequests: 'Family with elderly passenger. Please assist with boarding. Waiting period up to 2 hours included.',
      notes: 'Collect ₹2,200 balance upon trip completion via UPI or Cash.',
    },
    {
      id: 'bk-103',
      bookingNumber: 'BK-9483',
      status: 'Scheduled',
      tripType: 'One-way (Single)',
      startDate: formatIsoDate(tomorrow),
      startTime: '07:00 AM',
      customerName: 'Vikramaditya Oberoi',
      customerPhone: '+91 99580 98765',
      passengersCount: 1,
      luggageCount: 1,
      pickupLocation: 'The Leela Palace, Chanakyapuri, New Delhi',
      pickupLandmark: 'Main Hotel Lobby Portico',
      pickupCoords: { latitude: 28.5794, longitude: 77.1878 },
      dropLocation: 'Noida Film City, Sector 16A, Noida',
      dropLandmark: 'Studio 4, Express Towers',
      dropCoords: { latitude: 28.5670, longitude: 77.3200 },
      route: 'Chanakyapuri → Noida Film City',
      routeDistanceKm: 22.8,
      estimatedDurationMins: 38,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 2100,
      advanceAmount: 0,
      pendingAmount: 2100,
      paymentStatus: 'Unpaid',
      specialRequests: 'Executive VIP guest. Quiet ride requested. Please keep vehicle sanitized and water bottle ready.',
      notes: 'Direct client payment upon arrival.',
    },
    {
      id: 'bk-104',
      bookingNumber: 'BK-9484',
      status: 'Scheduled',
      tripType: 'Round Trip',
      startDate: formatIsoDate(in3Days),
      startTime: '06:00 AM',
      endDate: formatIsoDate(in3Days),
      endTime: '08:30 PM',
      customerName: 'Dr. Anita Desai',
      customerPhone: '+91 97110 54321',
      passengersCount: 3,
      luggageCount: 2,
      pickupLocation: 'Vasant Vihar, Block C, New Delhi',
      pickupLandmark: 'Near Priya Cinema Complex',
      pickupCoords: { latitude: 28.5583, longitude: 77.1594 },
      dropLocation: 'Neemrana Fort Palace, Delhi-Jaipur Highway',
      dropLandmark: 'Main Fort Gate',
      dropCoords: { latitude: 27.9945, longitude: 76.3867 },
      route: 'Delhi (Vasant Vihar) ⇄ Neemrana Day Tour',
      routeDistanceKm: 128.0,
      estimatedDurationMins: 140,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 6500,
      advanceAmount: 2000,
      pendingAmount: 4500,
      paymentStatus: 'Partial',
      specialRequests: 'Outstation day trip. Includes toll & state tax. Highway driver allowance ₹400.',
      notes: 'Breakfast halt at Haldiram Dharuhera requested.',
    },
    {
      id: 'bk-105',
      bookingNumber: 'BK-9485',
      status: 'Scheduled',
      tripType: 'One-way (Single)',
      startDate: formatIsoDate(in5Days),
      startTime: '11:00 AM',
      customerName: 'Karan Mehra',
      customerPhone: '+91 98114 67890',
      passengersCount: 2,
      luggageCount: 3,
      pickupLocation: 'Greater Kailash 1, M-Block Market, New Delhi',
      pickupLandmark: 'Near Starbucks Coffee',
      pickupCoords: { latitude: 28.5539, longitude: 77.2405 },
      dropLocation: 'Aerocity Hospitality District, New Delhi',
      dropLandmark: 'Pullman & Novotel Hotel Entry',
      dropCoords: { latitude: 28.5501, longitude: 77.1215 },
      route: 'GK-1 → Aerocity Hotels',
      routeDistanceKm: 16.2,
      estimatedDurationMins: 30,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 1450,
      advanceAmount: 1450,
      pendingAmount: 0,
      paymentStatus: 'Paid',
      specialRequests: 'Passenger carrying fragile conference equipment. Handle boot with extra care.',
    },
    {
      id: 'bk-106',
      bookingNumber: 'BK-9486',
      status: 'Scheduled',
      tripType: 'One-way (Single)',
      startDate: formatIsoDate(in10Days),
      startTime: '02:30 PM',
      customerName: 'Sunita Rao',
      customerPhone: '+91 99102 33445',
      passengersCount: 3,
      luggageCount: 2,
      pickupLocation: 'DLF Crest, Park Place, Golf Course Road, Gurugram',
      pickupLandmark: 'Clubhouse Porch',
      pickupCoords: { latitude: 28.4595, longitude: 77.0988 },
      dropLocation: 'New Delhi Railway Station, Paharganj Side',
      dropLandmark: 'Platform 1 VIP Entry',
      dropCoords: { latitude: 28.6430, longitude: 77.2195 },
      route: 'Golf Course Road Gurugram → NDLS Station',
      routeDistanceKm: 32.4,
      estimatedDurationMins: 50,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 2400,
      advanceAmount: 1000,
      pendingAmount: 1400,
      paymentStatus: 'Partial',
      specialRequests: 'Train departs at 04:45 PM (Vande Bharat Express). On-time pickup essential.',
    },
    {
      id: 'bk-100',
      bookingNumber: 'BK-9479',
      status: 'Completed',
      tripType: 'One-way (Single)',
      startDate: formatIsoDate(yesterday),
      startTime: '03:00 PM',
      customerName: 'Mohit Chawla',
      customerPhone: '+91 98100 11223',
      passengersCount: 2,
      luggageCount: 2,
      pickupLocation: 'Saket City Hospital, Press Enclave Road',
      pickupLandmark: 'Main Reception',
      pickupCoords: { latitude: 28.5284, longitude: 77.2140 },
      dropLocation: 'Golf Links, Khan Market, New Delhi',
      dropLandmark: 'Gate 3',
      dropCoords: { latitude: 28.5980, longitude: 77.2340 },
      route: 'Saket → Golf Links',
      routeDistanceKm: 12.0,
      estimatedDurationMins: 25,
      vehicle: 'TRP-8841',
      vehicleModel: 'Toyota Innova Crysta',
      driverName: 'Maddy',
      totalAmount: 1200,
      advanceAmount: 1200,
      pendingAmount: 0,
      paymentStatus: 'Paid',
      specialRequests: 'Discharged patient. Smooth driving appreciated.',
    },
  ];
}
