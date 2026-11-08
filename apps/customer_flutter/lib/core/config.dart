import 'package:flutter/foundation.dart';
// ─── Google Maps API Key Configuration ───────────────────────────────────────
//
// TO ENABLE MAPS:
// 1. Go to https://console.cloud.google.com/
// 2. Create a project → Enable these APIs:
//    - Maps SDK for Android
//    - Maps SDK for iOS
//    - Maps JavaScript API (for web)
//    - Places API
//    - Directions API
//    - Geocoding API
// 3. Create an API Key → restrict it to your app
// 4. Replace YOUR_GOOGLE_MAPS_API_KEY below
//
// Free tier: $200/month credit (~28,000 map loads FREE per month)
// ─────────────────────────────────────────────────────────────────────────────

class AppConfig {
  // ⚠️  Replace this with your actual Google Maps API key
  static const String googleMapsApiKey = 'AIzaSyAWUVBrpzGRnXgUdUDB7cArYcmYsrZLCsQ';

  // Backend API base URL: localhost on Web/Desktop/iOS, 10.0.2.2 on Android emulator
  // Override at build time: flutter build web --dart-define=API_URL=https://api.example.com
  static const String _apiUrlOverride = String.fromEnvironment('API_URL');

  static String get apiBaseUrl {
    if (_apiUrlOverride.isNotEmpty) return _apiUrlOverride;
    if (kIsWeb) return 'http://localhost:3001';
    return 'http://10.0.2.2:3001';
  }

  // Google Places API (New) endpoints
  static const String placesNewAutocompleteUrl =
      'https://places.googleapis.com/v1/places:autocomplete';
  static const String placesApiUrl =
      'https://maps.googleapis.com/maps/api/place/autocomplete/json';
  static const String placesDetailsUrl =
      'https://maps.googleapis.com/maps/api/place/details/json';
  static const String geocodeUrl =
      'https://maps.googleapis.com/maps/api/geocode/json';
  static const String directionsUrl =
      'https://maps.googleapis.com/maps/api/directions/json';
}
