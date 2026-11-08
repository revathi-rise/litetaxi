import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';
import 'package:uuid/uuid.dart';
import '../core/api_client.dart';
import '../core/models.dart';
import '../core/theme.dart';
import '../core/brand_assets.dart';
import '../widgets/route_map.dart';
import '../widgets/fare_breakdown_sheet.dart';
import 'tracking_screen.dart';
import 'map_picker_screen.dart';
import 'plan_ride_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

enum _HomeState { idle, estimating, selecting, booking }

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  // Picked locations
  PlacePrediction? _pickup;
  PlacePrediction? _dropoff;
  double? _pickupLat, _pickupLng, _dropLat, _dropLng;
  String _pickupAddress = '', _dropAddress = '';

  // Fare estimate
  FareEstimate? _estimate;
  VehicleOption? _selectedVehicle;
  _HomeState _state = _HomeState.idle;
  String? _error;
  bool _isSheetOpen = false;

  // Booking & Location
  bool _bookingLoading = false;
  bool _locating = false;

  // Reference-style booking sheet state
  bool _editingRoute = false; // true => show search panel instead of sheet
  int _fitKey = 0;
  DateTime _rideTime = DateTime.now();
  String _selectedPaymentMethod = 'cash';

  late AnimationController _sheetAnim;

  @override
  void initState() {
    super.initState();
    _sheetAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );

    // Initial default: Odayakulam (Pollachi, Coimbatore District)
    _pickupLat = 10.5931;
    _pickupLng = 76.9058;
    _pickupAddress = 'Odayakulam Town Panchayat, Pollachi, Tamil Nadu 642129';
    _pickup = PlacePrediction(
      placeId: 'cbe_odayakulam',
      mainText: 'Odayakulam (Pollachi)',
      secondaryText: 'Pollachi, Coimbatore, Tamil Nadu',
      lat: 10.5931,
      lng: 76.9058,
    );

    _dropLat = 10.6600;
    _dropLng = 77.0070;
    _dropAddress = 'Central Bus Stand, Pollachi, Tamil Nadu 642001';
    _dropoff = PlacePrediction(
      placeId: 'cbe_pollachi',
      mainText: 'Pollachi Bus Stand',
      secondaryText: 'Pollachi, Coimbatore, Tamil Nadu',
      lat: 10.6600,
      lng: 77.0070,
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _detectCurrentLocation();
      _fetchEstimate();
    });
  }

  void _swapLocations() {
    if (_pickup == null && _dropoff == null) return;
    setState(() {
      final tempP = _pickup;
      final tempLat = _pickupLat;
      final tempLng = _pickupLng;
      final tempAddr = _pickupAddress;

      _pickup = _dropoff;
      _pickupLat = _dropLat;
      _pickupLng = _dropLng;
      _pickupAddress = _dropAddress;

      _dropoff = tempP;
      _dropLat = tempLat;
      _dropLng = tempLng;
      _dropAddress = tempAddr;
    });

    if (_pickupLat != null && _dropLat != null) {
      _fetchEstimate();
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('🔄 Swapped Pickup and Destination'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _detectCurrentLocation({bool showFeedback = false}) async {
    setState(() => _locating = true);
    try {
      double? lat;
      double? lng;

      // 1. Try real hardware/browser GPS
      try {
        LocationPermission permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
          final pos = await Geolocator.getCurrentPosition(
            locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.medium,
              timeLimit: Duration(seconds: 4),
            ),
          );
          lat = pos.latitude;
          lng = pos.longitude;
        }
      } catch (e) {
        debugPrint('Geolocator GPS attempt: $e');
      }

      // 2. Check for ISP gateway misrouting (desktop browsers in TN often route via Chennai)
      final isChennaiIspGateway = lat != null && lng != null && lat > 12.8 && lat < 13.5 && lng > 79.8 && lng < 80.5;
      final double targetLat = (lat == null || isChennaiIspGateway) ? 10.5931 : lat;
      final double targetLng = (lng == null || isChennaiIspGateway) ? 76.9058 : lng;

      // Reverse geocode via API to get real address
      final place = (targetLat == 10.5931 && targetLng == 76.9058)
          ? {
              'name': 'Odayakulam (Pollachi)',
              'address': 'Odayakulam Town Panchayat, Pollachi, Tamil Nadu 642129',
              'lat': 10.5931,
              'lng': 76.9058,
            }
          : await ApiClient().reverseGeocode(targetLat, targetLng);
      final name = place?['name'] ?? (targetLat == 10.5931 ? 'Odayakulam (Pollachi)' : 'My Current Location');
      final address = place?['address'] ?? '${targetLat.toStringAsFixed(4)}, ${targetLng.toStringAsFixed(4)}';

      if (mounted) {
        setState(() {
          _pickupLat = targetLat;
          _pickupLng = targetLng;
          _pickupAddress = address;
          _pickup = PlacePrediction(
            placeId: 'current_location',
            mainText: name,
            secondaryText: address,
            lat: targetLat,
            lng: targetLng,
          );
        });

        if (_dropLat != null) {
          _fetchEstimate();
        }

        if (showFeedback && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('📍 Pickup set to: $name'),
              duration: const Duration(seconds: 3),
              backgroundColor: AppColors.primary,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Detect location error: $e');
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _openMapPicker({bool isPickup = true, LatLng? initialPoint, String? initialTitle}) async {
    final pos = initialPoint ??
        (isPickup
            ? (_pickupLat != null ? LatLng(_pickupLat!, _pickupLng!) : null)
            : (_dropLat != null ? LatLng(_dropLat!, _dropLng!) : null));

    final res = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => MapPickerScreen(
          isPickup: isPickup,
          initialPosition: pos,
          initialTitle: initialTitle ?? (isPickup ? _pickup?.mainText : _dropoff?.mainText),
        ),
      ),
    );

    if (res != null && res['place'] is PlacePrediction) {
      final p = res['place'] as PlacePrediction;
      final bool targetPickup = res['isPickup'] == true;
      setState(() {
        if (targetPickup) {
          _pickup = p;
          _pickupLat = p.lat;
          _pickupLng = p.lng;
          _pickupAddress = p.fullText;
        } else {
          _dropoff = p;
          _dropLat = p.lat;
          _dropLng = p.lng;
          _dropAddress = p.fullText;
        }
      });
      if (_pickupLat != null && _dropLat != null) {
        _fetchEstimate();
      }
    }
  }

  void _onMapTap(LatLng point) {
    if (_isSheetOpen || _state == _HomeState.selecting || _state == _HomeState.booking || _state == _HomeState.estimating) {
      return;
    }
    _isSheetOpen = true;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => PointerInterceptor(
        child: _MapTapSheet(
          point: point,
          onSetPickup: (p) {
            Navigator.of(context).pop();
            setState(() {
              _pickup = p;
              _pickupLat = p.lat;
              _pickupLng = p.lng;
              _pickupAddress = p.fullText;
            });
            if (_pickupLat != null && _dropLat != null) _fetchEstimate();
          },
          onSetDropoff: (p) {
            Navigator.of(context).pop();
            setState(() {
              _dropoff = p;
              _dropLat = p.lat;
              _dropLng = p.lng;
              _dropAddress = p.fullText;
            });
            if (_pickupLat != null && _dropLat != null) _fetchEstimate();
          },
          onOpenPicker: () {
            Navigator.of(context).pop();
            _openMapPicker(initialPoint: point, isPickup: _pickup == null);
          },
        ),
      ),
    ).whenComplete(() {
      if (mounted) setState(() => _isSheetOpen = false);
    });
  }

  void _selectPreset(String name, String address, double lat, double lng, bool isPickup) {
    setState(() {
      final p = PlacePrediction(
        placeId: 'preset_${name.toLowerCase()}',
        mainText: name,
        secondaryText: address,
        lat: lat,
        lng: lng,
      );
      if (isPickup) {
        _pickup = p;
        _pickupLat = lat;
        _pickupLng = lng;
        _pickupAddress = address;
      } else {
        _dropoff = p;
        _dropLat = lat;
        _dropLng = lng;
        _dropAddress = address;
      }
    });
    _fetchEstimate();
  }

  @override
  void dispose() {
    _sheetAnim.dispose();
    super.dispose();
  }

  Future<void> _pickPlace(bool isPickup) async {
    final initialPos = _pickupLat != null && _pickupLng != null
        ? LatLng(_pickupLat!, _pickupLng!)
        : (_dropLat != null && _dropLng != null ? LatLng(_dropLat!, _dropLng!) : null);

    final res = await Navigator.of(context).push<PlanRideResult?>(
      MaterialPageRoute(
        builder: (_) => PlanRideScreen(
          initialPickup: _pickup,
          initialDropoff: _dropoff,
          initialPosition: initialPos,
          focusDropoff: !isPickup,
        ),
      ),
    );

    if (res == null || !mounted) return;

    setState(() {
      _error = null;
      _pickup = res.pickup;
      _pickupLat = res.pickup.lat;
      _pickupLng = res.pickup.lng;
      _pickupAddress = res.pickup.fullText;

      _dropoff = res.dropoff;
      _dropLat = res.dropoff.lat;
      _dropLng = res.dropoff.lng;
      _dropAddress = res.dropoff.fullText;
    });

    if (_pickupLat != null && _dropLat != null) {
      _fetchEstimate();
    }
  }

  Future<void> _fetchEstimate() async {
    if (_pickupLat == null || _dropLat == null) return;
    setState(() { _state = _HomeState.estimating; _error = null; });
    try {
      final data = await ApiClient().estimateFares(
        pickupLat: _pickupLat!,
        pickupLng: _pickupLng!,
        pickupAddress: _pickupAddress,
        dropLat: _dropLat!,
        dropLng: _dropLng!,
        dropAddress: _dropAddress,
      );
      final estimate = FareEstimate.fromJson(data);
      final available = estimate.options.where((o) => o.available).toList();
      setState(() {
        _estimate = estimate;
        _selectedVehicle = available.isNotEmpty ? available.first : (estimate.options.isNotEmpty ? estimate.options.first : null);
        _state = _HomeState.selecting;
        _editingRoute = false;
        _rideTime = DateTime.now();
        _fitKey++;
      });
      _sheetAnim.forward(from: 0);
    } catch (e) {
      setState(() {
        _state = _HomeState.idle;
        _error = e is ApiException ? e.message : 'Could not load fare estimates';
      });
    }
  }

  Future<void> _bookRide() async {
    if (_selectedVehicle == null) return;
    setState(() => _bookingLoading = true);

    // If not authenticated (e.g. demo skip), auto-authenticate with demo user
    if (!ApiClient().isLoggedIn) {
      try {
        final res = await ApiClient().sendOtp('+919000000010');
        final otp = res['devOtp']?.toString() ?? res['otp']?.toString() ?? '123456';
        await ApiClient().verifyOtp('+919000000010', otp);
      } catch (_) {}
    }

    try {
      final key = const Uuid().v4();
      final booking = await ApiClient().createBooking(
        estimateId: _selectedVehicle!.estimateId,
        paymentMethod: _selectedPaymentMethod,
        idempotencyKey: key,
      );
      final bookingObj = booking['booking'] ?? booking;
      final bookingId = (bookingObj['id'] ?? '').toString();
      if (!mounted) return;
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => TrackingScreen(bookingId: bookingId),
        ),
      ).then((_) {
        // reset on return
        setState(() {
          _pickup = null;
          _dropoff = null;
          _pickupLat = _pickupLng = _dropLat = _dropLng = null;
          _pickupAddress = _dropAddress = '';
          _estimate = null;
          _selectedVehicle = null;
          _state = _HomeState.idle;
          _error = null;
          _bookingLoading = false;
          _editingRoute = false;
        });
        _sheetAnim.reverse();
      });
    } catch (e) {
      setState(() {
        _bookingLoading = false;
        _error = e is ApiException ? e.message : 'Booking failed. Please try again.';
      });
    }
  }

  void _showPaymentMethodPicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Select Payment Method', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.payments_outlined, color: Colors.green),
                title: const Text('Cash', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Pay the driver directly after completing the trip'),
                trailing: _selectedPaymentMethod == 'cash' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  setState(() => _selectedPaymentMethod = 'cash');
                  Navigator.pop(ctx);
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.credit_card, color: AppColors.primary),
                title: const Text('Razorpay (UPI / Cards)', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Google Pay, PhonePe, Cards, Netbanking via Razorpay'),
                trailing: _selectedPaymentMethod == 'razorpay' ? const Icon(Icons.check, color: AppColors.primary) : null,
                onTap: () {
                  setState(() => _selectedPaymentMethod = 'razorpay');
                  Navigator.pop(ctx);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFareBreakdown() {
    if (_selectedVehicle == null || _estimate == null) return;
    _isSheetOpen = true;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PointerInterceptor(
        child: FareBreakdownSheet(
          vehicle: _selectedVehicle!,
          distanceKm: _estimate!.distanceKm,
          durationMin: _estimate!.durationMin,
          onBook: _bookRide,
          loading: _bookingLoading,
        ),
      ),
    ).whenComplete(() {
      if (mounted) setState(() => _isSheetOpen = false);
    });
  }

  // ── Formatting helpers (reference-style sheet) ────────────────────────────
  static const _months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  String _time(DateTime d) {
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m ${d.hour >= 12 ? 'PM' : 'AM'}';
  }

  String _shortWhen(DateTime d) => '${d.day} ${_months[d.month - 1]}, ${_time(d)}';
  String _longWhen(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}, ${_time(d)}';

  String _money(String raw) {
    final v = double.tryParse(raw) ?? 0;
    final parts = v.toStringAsFixed(2).split('.');
    final withCommas = parts[0].replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
    return '₹$withCommas.${parts[1]}';
  }

  Widget _chevronBadge() => Container(
        width: 24,
        height: 24,
        decoration: const BoxDecoration(color: AppColors.borderLight, shape: BoxShape.circle),
        child: const Icon(Icons.chevron_right, size: 18, color: Colors.black87),
      );

  Widget _vehicleRow(VehicleOption v) {
    final selected = _selectedVehicle?.categoryId == v.categoryId;
    final fallbackIcon = Icon(
      v.categoryCode.toUpperCase() == 'SUV' ? Icons.airport_shuttle : Icons.local_taxi,
      size: 38,
      color: AppColors.primary,
    );
    return Opacity(
      opacity: v.available ? 1 : 0.5,
      child: GestureDetector(
        onTap: v.available ? () => setState(() => _selectedVehicle = v) : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.only(bottom: 4),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryLight : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: selected ? AppColors.primary : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              SizedBox(
                width: 76,
                height: 44,
                child: v.imageUrl != null && v.imageUrl!.isNotEmpty
                    ? Image.network(
                        v.imageUrl!,
                        fit: BoxFit.contain,
                        errorBuilder: (_, __, ___) => fallbackIcon,
                      )
                    : fallbackIcon,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            v.categoryName,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.person, size: 14, color: Colors.black87),
                        const SizedBox(width: 2),
                        Text('${v.capacity}',
                            style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87)),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      v.available ? 'Pickup at ${_shortWhen(_rideTime)}' : 'Unavailable',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              Text(
                _money(v.fareTotal),
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Colors.black87),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBookingSheet(double height) {
    return Container(
      height: height,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 16)],
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 10, bottom: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
          ),
          // One Way / Round Trip tabs
          Stack(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.call_made, size: 16, color: AppColors.primary),
                          SizedBox(width: 6),
                          Text('One Way',
                              style: TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.w600, color: Colors.black87)),
                        ],
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Round trip booking is coming soon')),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.sync, size: 18, color: AppColors.textMuted),
                            SizedBox(width: 6),
                            Text('Round Trip', style: TextStyle(fontSize: 15, color: AppColors.textMuted)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Row(
                  children: [
                    Expanded(child: Container(height: 2, color: AppColors.primary)),
                    Expanded(child: Container(height: 1, color: AppColors.border)),
                  ],
                ),
              ),
            ],
          ),
          // Booking time card + vehicle list
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              children: [
                // Interactive Route Summary Card (Pickup, Dropoff, Swap & Edit)
                Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      // Green dot -> dashed line -> Red dot
                      Column(
                        children: [
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                          ),
                          Container(width: 2, height: 26, color: Colors.grey.shade300),
                          Container(
                            width: 10,
                            height: 10,
                            decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                          ),
                        ],
                      ),
                      const SizedBox(width: 12),
                      // Pickup & Dropoff Labels with Edit indicators
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            InkWell(
                              onTap: () => _pickPlace(true),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('PICKUP',
                                            style: TextStyle(
                                                fontSize: 9, fontWeight: FontWeight.bold, color: Colors.green)),
                                        Text(
                                          _pickup?.mainText ?? 'Set Pickup Location',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.edit_outlined, size: 14, color: AppColors.primary),
                                ],
                              ),
                            ),
                            const Divider(height: 10),
                            InkWell(
                              onTap: () => _pickPlace(false),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('DESTINATION',
                                            style: TextStyle(
                                                fontSize: 9, fontWeight: FontWeight.bold, color: Colors.red)),
                                        Text(
                                          _dropoff?.mainText ?? 'Set Destination',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const Icon(Icons.edit_outlined, size: 14, color: AppColors.accent),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Swap Pickup & Dropoff button
                      IconButton(
                        icon: const Icon(Icons.swap_vert, color: AppColors.primary, size: 24),
                        tooltip: 'Swap Pickup & Destination',
                        onPressed: _swapLocations,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Booking one-way ride for',
                                style: TextStyle(
                                    fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.primary)),
                            const SizedBox(height: 2),
                            Text(_longWhen(_rideTime),
                                style: const TextStyle(
                                    fontSize: 13, fontWeight: FontWeight.w700, color: Colors.black87)),
                          ],
                        ),
                      ),
                      _chevronBadge(),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                for (final v in _estimate!.options) _vehicleRow(v),
              ],
            ),
          ),
          const Divider(height: 1),
          // Payment row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
            child: InkWell(
              onTap: _showPaymentMethodPicker,
              borderRadius: BorderRadius.circular(12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Payment Method',
                            style: TextStyle(
                                fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black54)),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            Icon(
                              _selectedPaymentMethod == 'razorpay' ? Icons.credit_card : Icons.payments_outlined,
                              size: 15,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              _selectedPaymentMethod == 'razorpay' ? 'Razorpay (UPI / Card)' : 'Cash',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black87),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  _chevronBadge(),
                ],
              ),
            ),
          ),
          // Review Booking
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _bookingLoading || _selectedVehicle == null ? null : _showFareBreakdown,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                  shadowColor: AppColors.primary.withOpacity(0.35),
                ),
                child: _bookingLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Review Booking',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ),
          SafeArea(top: false, child: const SizedBox(height: 10)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mapPickup = _pickupLat != null ? LatLng(_pickupLat!, _pickupLng!) : null;
    final mapDrop = _dropLat != null ? LatLng(_dropLat!, _dropLng!) : null;

    // Reference layout: only once a fare estimate is ready and not editing the route.
    final sheetMode = _state == _HomeState.selecting && _estimate != null && !_editingRoute;
    final sheetHeight = MediaQuery.of(context).size.height * 0.56;

    return Scaffold(
      body: Stack(
        children: [
          // ── Map ────────────────────────────────────────────────────────────
          Positioned.fill(
            child: RouteMap(
              pickup: mapPickup,
              dropoff: mapDrop,
              polylinePoints: _estimate?.geometry ?? [],
              showMyLocation: true,
              myLocationButton: !sheetMode,
              zoomControls: !sheetMode,
              routeColor: sheetMode ? Colors.black : null,
              pickupLabel: sheetMode ? (_pickup?.mainText ?? 'Pickup') : null,
              dropoffLabel: sheetMode ? (_dropoff?.mainText ?? 'Drop-off') : null,
              fitKey: _fitKey,
              mapPadding: sheetMode
                  ? EdgeInsets.only(top: 90, bottom: sheetHeight)
                  : EdgeInsets.zero,
              onTap: (_isSheetOpen || _state == _HomeState.selecting || _state == _HomeState.booking || _state == _HomeState.estimating) ? null : _onMapTap,
            ),
          ),

          // ── Back button (reference layout) ─────────────────────────────────
          if (sheetMode)
            Positioned(
              top: 0,
              left: 0,
              child: PointerInterceptor(
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 0, 0),
                    child: Material(
                      color: Colors.white,
                      shape: const CircleBorder(),
                      elevation: 4,
                      child: InkWell(
                        customBorder: const CircleBorder(),
                        onTap: () => setState(() => _editingRoute = true),
                        child: const SizedBox(
                          width: 44,
                          height: 44,
                          child: Icon(Icons.chevron_left, color: AppColors.primary, size: 28),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // ── Top panel ──────────────────────────────────────────────────────
          if (!sheetMode)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: PointerInterceptor(
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                        child: Row(
                          children: [
                            BrandAssets.logo(size: 32, radius: 8),
                            const SizedBox(width: 10),
                            const Text(
                              'LiteSpark Taxi',
                              style: TextStyle(
                                color: Color(0xFF581C87),
                                fontWeight: FontWeight.w900,
                                fontSize: 18,
                                letterSpacing: -0.3,
                              ),
                            ),
                          const Spacer(),
                          if (_editingRoute && _estimate != null)
                            InkWell(
                              onTap: () => setState(() => _editingRoute = false),
                              borderRadius: BorderRadius.circular(16),
                              child: const Padding(
                                padding: EdgeInsets.all(4),
                                child: Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                              ),
                            ),
                          if (_state == _HomeState.estimating)
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: AppColors.primary),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Route inputs
                    _LocationField(
                      icon: Icons.radio_button_checked,
                      iconColor: AppColors.success,
                      placeholder: 'Pickup location',
                      value: _pickup?.mainText,
                      trailing: InkWell(
                        onTap: _locating ? null : () => _detectCurrentLocation(showFeedback: true),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (_locating)
                                const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.primary),
                                )
                              else
                                const Icon(Icons.my_location, size: 14, color: AppColors.primary),
                              const SizedBox(width: 4),
                              const Text('My Location',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary)),
                            ],
                          ),
                        ),
                      ),
                      onTap: () => _pickPlace(true),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Divider(height: 1, color: AppColors.borderLight),
                    ),
                    _LocationField(
                      icon: Icons.location_on,
                      iconColor: AppColors.primary,
                      placeholder: 'Where to (Village or City)?',
                      value: _dropoff?.mainText,
                      trailing: InkWell(
                        onTap: () => _openMapPicker(isPickup: false),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.accent.withOpacity(0.2)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.pin_drop, size: 14, color: AppColors.accent),
                              SizedBox(width: 4),
                              Text('Pick on Map',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.accent)),
                            ],
                          ),
                        ),
                      ),
                      onTap: () => _pickPlace(false),
                    ),
                    const SizedBox(height: 6),
                    // Quick location chips
                    Padding(
                      padding: const EdgeInsets.fromLTRB(12, 2, 12, 10),
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _QuickChip(
                              label: '📍 Odayakulam (Pickup)',
                              icon: Icons.my_location,
                              onTap: () {
                                setState(() {
                                  _pickupLat = 10.5931;
                                  _pickupLng = 76.9058;
                                  _pickupAddress = 'Odayakulam Town Panchayat, Pollachi, Tamil Nadu 642129';
                                  _pickup = PlacePrediction(
                                    placeId: 'cbe_odayakulam',
                                    mainText: 'Odayakulam (Pollachi)',
                                    secondaryText: 'Pollachi, Coimbatore, Tamil Nadu',
                                    lat: 10.5931,
                                    lng: 76.9058,
                                  );
                                });
                                if (_dropLat != null) _fetchEstimate();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('📍 Pickup set to: Odayakulam (Pollachi)'),
                                    duration: Duration(seconds: 2),
                                    backgroundColor: AppColors.primary,
                                  ),
                                );
                              },
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: '🚌 Pollachi Bus Stand',
                              icon: Icons.directions_bus,
                              onTap: () => _selectPreset('Pollachi Bus Stand', 'Central Bus Stand, Pollachi, Tamil Nadu 642001', 10.6600, 77.0070, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: '🌴 Anaimalai',
                              icon: Icons.nature,
                              onTap: () => _selectPreset('Anaimalai', 'Anaimalai Town, Pollachi, Tamil Nadu 642104', 10.5833, 76.9333, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: '🗺️ Choose on Map',
                              icon: Icons.pin_drop,
                              onTap: () => _openMapPicker(isPickup: false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: '📍 My Location',
                              icon: Icons.my_location,
                              onTap: () => _detectCurrentLocation(showFeedback: true),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: 'Eachanari',
                              icon: Icons.place,
                              onTap: () => _selectPreset('Eachanari Vinayagar Temple', 'Pollachi Main Rd, Eachanari, Coimbatore', 10.9252, 76.9820, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: 'Gandhipuram',
                              icon: Icons.directions_bus,
                              onTap: () => _selectPreset('Gandhipuram', 'Gandhipuram Central Bus Stand, Coimbatore', 11.0168, 76.9558, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: 'RS Puram',
                              icon: Icons.storefront,
                              onTap: () => _selectPreset('RS Puram', 'DB Road, RS Puram, Coimbatore', 11.0080, 76.9420, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: 'Sundarapuram',
                              icon: Icons.location_city,
                              onTap: () => _selectPreset('Sundarapuram', 'Sundarapuram, Pollachi Main Rd, Coimbatore', 10.9535, 76.9748, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: 'Airport (CJB)',
                              icon: Icons.flight,
                              onTap: () => _selectPreset('Airport (CJB)', 'Coimbatore International Airport', 11.0300, 77.0434, false),
                            ),
                            const SizedBox(width: 6),
                            _QuickChip(
                              label: 'Railway Station',
                              icon: Icons.train,
                              onTap: () => _selectPreset('Coimbatore Junction', 'Railway Station, Coimbatore', 10.9995, 76.9634, false),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),

          // ── GPS Current Location FAB on Map ──────────────────────────────
          Positioned(
            right: 16,
            bottom: sheetMode ? sheetHeight + 14 : 120,
            child: PointerInterceptor(
              child: FloatingActionButton.small(
                heroTag: 'gps_my_location_btn',
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primary,
                tooltip: 'Set Pickup to My Current Location',
                onPressed: () => _detectCurrentLocation(showFeedback: true),
                child: _locating
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                      )
                    : const Icon(Icons.my_location),
              ),
            ),
          ),

          // ── Error banner ───────────────────────────────────────────────────
          if (_error != null)
            Positioned(
              top: 160,
              left: 16,
              right: 16,
              child: PointerInterceptor(
                child: Material(
                  borderRadius: BorderRadius.circular(12),
                  color: AppColors.error,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.white, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                            child: Text(_error!,
                                style: const TextStyle(color: Colors.white, fontSize: 13))),
                        GestureDetector(
                          onTap: () => setState(() => _error = null),
                          child: const Icon(Icons.close, color: Colors.white, size: 16),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

          // ── Booking sheet (reference layout) ───────────────────────────────
          if (sheetMode)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: PointerInterceptor(
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 1),
                    end: Offset.zero,
                  ).animate(CurvedAnimation(parent: _sheetAnim, curve: Curves.easeOutCubic)),
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {},
                    child: _buildBookingSheet(sheetHeight),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Location Field ───────────────────────────────────────────────────────────

class _LocationField extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String placeholder;
  final String? value;
  final Widget? trailing;
  final VoidCallback onTap;

  const _LocationField({
    required this.icon,
    required this.iconColor,
    required this.placeholder,
    this.value,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Icon(icon, color: iconColor, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  value ?? placeholder,
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: value != null ? FontWeight.w600 : FontWeight.w400,
                    color: value != null ? AppColors.textPrimary : AppColors.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (trailing != null)
                trailing!
              else if (value != null)
                const Icon(Icons.edit_location_alt_outlined,
                    size: 16, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapTapSheet extends StatefulWidget {
  final LatLng point;
  final ValueChanged<PlacePrediction> onSetPickup;
  final ValueChanged<PlacePrediction> onSetDropoff;
  final VoidCallback onOpenPicker;

  const _MapTapSheet({
    required this.point,
    required this.onSetPickup,
    required this.onSetDropoff,
    required this.onOpenPicker,
  });

  @override
  State<_MapTapSheet> createState() => _MapTapSheetState();
}

class _MapTapSheetState extends State<_MapTapSheet> {
  String _name = 'Locating village/address...';
  String _address = '';
  String? _type;
  bool _loading = true;
  PlacePrediction? _prediction;

  @override
  void initState() {
    super.initState();
    _resolve();
  }

  void _resolve() async {
    final res = await ApiClient().reverseGeocode(widget.point.latitude, widget.point.longitude);
    if (mounted) {
      final name = res?['name']?.toString() ?? 'Selected Location';
      final address = res?['address']?.toString() ??
          '${widget.point.latitude.toStringAsFixed(4)}, ${widget.point.longitude.toStringAsFixed(4)}';
      final type = res?['type']?.toString();
      final p = PlacePrediction(
        placeId: 'tap_${DateTime.now().millisecondsSinceEpoch}',
        mainText: name,
        secondaryText: address,
        lat: widget.point.latitude,
        lng: widget.point.longitude,
        type: type,
      );
      setState(() {
        _name = name;
        _address = address;
        _type = type;
        _loading = false;
        _prediction = p;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isVillage = _type == 'village' || _type == 'hamlet';
    return PointerInterceptor(
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20)],
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    isVillage ? Icons.holiday_village : Icons.location_on,
                    color: isVillage ? AppColors.accent : AppColors.primary,
                    size: 22,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _name,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (_loading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                    )
                  else
                    IconButton(
                      icon: const Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _address.isNotEmpty
                    ? _address
                    : '${widget.point.latitude.toStringAsFixed(5)}, ${widget.point.longitude.toStringAsFixed(5)}',
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.radio_button_checked, size: 16),
                      label: const Text('Set Pickup'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: _prediction == null ? null : () => widget.onSetPickup(_prediction!),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.location_on, size: 16),
                      label: const Text('Set Drop-off'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      onPressed: _prediction == null ? null : () => widget.onSetDropoff(_prediction!),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Center(
                child: TextButton.icon(
                  icon: const Icon(Icons.pin_drop, size: 16, color: AppColors.accent),
                  label: const Text('Adjust / Move Pin on Map', style: TextStyle(color: AppColors.accent)),
                  onPressed: widget.onOpenPicker,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  const _QuickChip({
    required this.label,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: AppColors.bg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 13, color: AppColors.primary),
              const SizedBox(width: 4),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
