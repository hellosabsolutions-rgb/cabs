# KABPRO Driver App

Expo + React Native mobile app for KABPRO fleet drivers.

## Stack

- Expo SDK 57
- React Native
- React Navigation (Native Stack)
- TypeScript

## Project structure

```
driver-app/
├── App.tsx
├── src/
│   ├── components/     # Screen, PrimaryButton
│   ├── constants/      # API config
│   ├── navigation/     # Root stack navigator + types
│   ├── screens/        # Login, Home, Duty, Fuel, Expense, Wallet, Docs, SOS, Profile
│   └── theme/          # Shared color tokens
├── app.json
└── package.json
```

## Screens (Stack)

| Screen | Purpose |
|---|---|
| Login | Phone + 4-digit PIN |
| Home | Dashboard, quick actions, bottom nav |
| StartDuty / EndDuty | Odometer duty flow |
| AddFuel | Fuel entry |
| AddExpense | Expense with categories |
| AdvanceRequest | Advance / petty cash request |
| Wallet | Balance + ledger |
| Documents | Trip documents |
| Profile | Driver profile |
| DigitalId | Digital ID card |
| Sos | Emergency alert |

## Run

```bash
cd driver-app
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- scan QR with Expo Go on a physical device

## Notes

- Config comes from `driver-app/.env` (`EXPO_PUBLIC_*`). See `.env.example`.
- API defaults: iOS simulator `http://localhost:5001/api`, Android emulator `http://10.0.2.2:5001/api`
- On a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your Mac LAN IP
- Colors match the KABPRO web theme (`#1687F5`)
- Screens are scaffolding for Phase 1–3 of the driver requirements PDF
- Google Sign-In requires a native build (`npx expo run:ios` / `run:android`), not Expo Go