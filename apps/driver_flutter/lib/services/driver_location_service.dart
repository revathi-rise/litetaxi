import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../core/driver_api_client.dart';

class DriverLocationService extends ChangeNotifier {
  static final DriverLocationService _instance = DriverLocationService._internal();
  factory DriverLocationService() => _instance;
  DriverLocationService._internal();

  StreamSubscription<Position>? _positionSub;
  Timer? _syncTimer;

  Position? _currentPosition;
  double _currentHeading = 0.0;
  bool _isTracking = false;
  String? _errorMessage;

  Position? get currentPosition => _currentPosition;
  double get currentHeading => _currentHeading;
  bool get isTracking => _isTracking;
  String? get errorMessage => _errorMessage;

  double? get latitude => _currentPosition?.latitude;
  double? get longitude => _currentPosition?.longitude;
  double get speedKmph => ((_currentPosition?.speed ?? 0) * 3.6).clamp(0, 160);

  Future<bool> checkAndRequestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      _errorMessage = 'Location services are disabled on this device.';
      notifyListeners();
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        _errorMessage = 'Location permissions are denied.';
        notifyListeners();
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      _errorMessage = 'Location permissions are permanently denied. Please enable in settings.';
      notifyListeners();
      return false;
    }

    _errorMessage = null;
    notifyListeners();
    return true;
  }

  Future<void> startTracking() async {
    if (_isTracking) return;

    final hasPerm = await checkAndRequestPermission();
    if (!hasPerm) return;

    _isTracking = true;
    _errorMessage = null;

    try {
      final initial = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      _onNewPosition(initial);
    } catch (e) {
      debugPrint('Error getting initial GPS position: $e');
    }

    const settings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 3, // Update every 3 meters
    );

    _positionSub = Geolocator.getPositionStream(locationSettings: settings).listen(
      _onNewPosition,
      onError: (err) {
        _errorMessage = err.toString();
        notifyListeners();
      },
    );

    // Sync to backend every 2 seconds when online
    _syncTimer = Timer.periodic(const Duration(seconds: 2), (_) {
      _pushLocationToBackend();
    });

    notifyListeners();
  }

  void _onNewPosition(Position pos) {
    if (_currentPosition != null) {
      // Calculate heading if device heading is unavailable or 0
      if (pos.heading != 0) {
        _currentHeading = pos.heading;
      } else {
        final dist = Geolocator.distanceBetween(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          pos.latitude,
          pos.longitude,
        );
        if (dist > 1.5) {
          _currentHeading = _calculateBearing(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
            pos.latitude,
            pos.longitude,
          );
        }
      }
    } else if (pos.heading != 0) {
      _currentHeading = pos.heading;
    }

    _currentPosition = pos;
    notifyListeners();
  }

  Future<void> _pushLocationToBackend() async {
    if (!_isTracking || _currentPosition == null) return;
    try {
      await DriverApiClient().updateLocation(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
        heading: _currentHeading,
      );
    } catch (e) {
      debugPrint('Failed to sync location to backend: $e');
    }
  }

  void stopTracking() {
    _positionSub?.cancel();
    _positionSub = null;
    _syncTimer?.cancel();
    _syncTimer = null;
    _isTracking = false;
    notifyListeners();
  }

  /// Sets manual coordinates for testing in desktop simulator mode
  void setManualPosition(double lat, double lng, {double heading = 0.0}) {
    _currentPosition = Position(
      latitude: lat,
      longitude: lng,
      timestamp: DateTime.now(),
      accuracy: 5.0,
      altitude: 0.0,
      altitudeAccuracy: 0.0,
      heading: heading,
      headingAccuracy: 0.0,
      speed: 8.5, // ~30 km/h
      speedAccuracy: 0.0,
    );
    _currentHeading = heading;
    notifyListeners();
    _pushLocationToBackend();
  }

  double _calculateBearing(double startLat, double startLng, double endLat, double endLng) {
    final dLng = (endLng - startLng) * (pi / 180.0);
    final y = sin(dLng) * cos(endLat * (pi / 180.0));
    final x = cos(startLat * (pi / 180.0)) * sin(endLat * (pi / 180.0)) -
        sin(startLat * (pi / 180.0)) * cos(endLat * (pi / 180.0)) * cos(dLng);
    return (atan2(y, x) * (180.0 / pi) + 360.0) % 360.0;
  }

  @override
  void dispose() {
    stopTracking();
    super.dispose();
  }
}

