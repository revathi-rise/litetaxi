# SwiftCab — Flutter Customer App

> **Google Maps API key is already configured.** Key: `AIzaSyC7MVIBs4CuoIrPQ9kQ3dNObotEPC5DjDI`

## Quick Start

### Prerequisites
- Flutter 3.x installed (`flutter --version`)
- Android Studio / connected Android device or emulator
- NestJS backend running on port 3001

### Run on Android Device/Emulator

```bash
cd d:\booktaxi\apps\customer_flutter

# List connected devices
flutter devices

# Run on default device
flutter run

# Run on specific device
flutter run -d <device-id>
```

### Backend URL Configuration

| Target | URL to set in app |
|--------|------------------|
| Android Emulator | `http://10.0.2.2:3001` (default) |
| Physical device (USB) | `http://192.168.x.x:3001` (your PC's LAN IP) |

To change: Open app → Profile tab → Developer → Backend Server URL

---

## Google Maps APIs to Enable

Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services** → **Library** and enable:

- [x] **Maps SDK for Android**
- [x] **Maps SDK for iOS**
- [x] **Places API** (for location search autocomplete)
- [x] **Directions API** (for route polylines)
- [x] **Geocoding API** (for coordinate resolution)

---

## App Features

| Screen | Description |
|--------|-------------|
| **Splash** | Animated branding screen |
| **Login** | Phone + 6-digit OTP (demo OTP shown in-app) |
| **Home / Book** | Google Maps + searchable pickup/drop across all India |
| **Fare Estimate** | Horizontal vehicle cards (Auto/Sedan/SUV/Bike) with real fares |
| **Fare Breakdown** | Itemized receipt sheet before booking |
| **Live Tracking** | Real-time driver location on Google Maps, OTP display |
| **My Rides** | Full booking history with status and route |
| **Profile** | User info, stats, settings, logout |

---

## Project Structure

```
lib/
├── core/
│   ├── config.dart          ← Google Maps API key
│   ├── api_client.dart      ← All HTTP calls + Google Places search
│   ├── models.dart          ← Data models + Pan-India preset places
│   └── theme.dart           ← SwiftCab red design system
├── screens/
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── home_screen.dart     ← Main booking flow
│   ├── tracking_screen.dart ← Live ride tracking
│   ├── rides_screen.dart    ← History
│   └── profile_screen.dart
├── widgets/
│   ├── route_map.dart       ← Google Maps widget
│   ├── vehicle_card.dart    ← Ride category selector
│   ├── fare_breakdown_sheet.dart
│   └── status_badge.dart
└── main.dart
```

---

## Build APK

```bash
# Debug APK (for testing)
flutter build apk --debug

# Release APK
flutter build apk --release
```

APK output: `build/app/outputs/flutter-apk/app-debug.apk`
