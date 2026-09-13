import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BookingItem } from '../types/booking';

export type MainTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Wallet: undefined;
  Sos: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  BookingDetail: { bookingId: string; booking?: BookingItem };
  StartDuty: undefined;
  EndDuty: undefined;
  AddFuel: undefined;
  AddExpense: undefined;
  AdvanceRequest: undefined;
  DigitalId: undefined;
  Documents: undefined;
  Settings: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
