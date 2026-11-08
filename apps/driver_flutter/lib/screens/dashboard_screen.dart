import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../core/brand_assets.dart';
import '../core/driver_api_client.dart';
import '../core/theme.dart';
import '../services/driver_location_service.dart';
import 'login_screen.dart';

class DriverDashboardScreen extends StatefulWidget {
  const DriverDashboardScreen({super.key});

  @override
  State<DriverDashboardScreen> createState() => _DriverDashboardScreenState();
}

class _DriverDashboardScreenState extends State<DriverDashboardScreen> {
  final _api = DriverApiClient();
  final _loc = DriverLocationService();

  GoogleMapController? _mapController;
  bool _isOnline = false;
  bool _toggleLoading = false;
  bool _isModalOpen = false;

  Timer? _requestPollTimer;
  Map<String, dynamic>? _incomingRequest;
  int _requestCountdown = 15;
  Timer? _countdownTimer;

  Map<String, dynamic>? _activeTrip;
  Timer? _tripPollTimer;
  final _otpController = TextEditingController();
  bool _tripActionLoading = false;
  String? _tripActionError;

  // Cached wallet stats for quick header badge
  double _todayEarnings = 0.0;
  double _walletBalance = 0.0;

  // Default Coimbatore center if GPS not ready
  static const LatLng _defaultCenter = LatLng(10.9619, 76.9806);

  @override
  void initState() {
    super.initState();
    _loc.addListener(_onLocationChanged);
    _checkInitialState();
    _loadQuickWallet();
  }

  Future<void> _checkInitialState() async {
    try {
      final trip = await _api.getActiveTrip();
      if (trip != null && mounted) {
        setState(() {
          _activeTrip = trip;
          _isOnline = true;
        });
        _loc.startTracking();
        _startTripPolling();
      }
    } catch (_) {}
  }

  Future<void> _loadQuickWallet() async {
    try {
      final w = await _api.getWallet();
      if (mounted) {
        setState(() {
          _todayEarnings = (w['todayEarnings'] as num?)?.toDouble() ?? 0.0;
          _walletBalance = (w['walletBalance'] as num?)?.toDouble() ?? 0.0;
        });
      }
    } catch (_) {}
  }

  void _onLocationChanged() {
    if (!mounted) return;
    setState(() {});
    if (_mapController != null && _loc.latitude != null && _loc.longitude != null && !_isModalOpen) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLng(LatLng(_loc.latitude!, _loc.longitude!)),
      );
    }
  }

  Future<void> _toggleOnline(bool online) async {
    setState(() => _toggleLoading = true);
    try {
      if (online) {
        await _loc.startTracking();
        if (_loc.latitude == null || _loc.longitude == null) {
          _loc.setManualPosition(_defaultCenter.latitude, _defaultCenter.longitude);
        }
        await _api.updateLocation(_loc.latitude!, _loc.longitude!, heading: _loc.currentHeading);
        await _api.setAvailability(true);
        setState(() {
          _isOnline = true;
          _toggleLoading = false;
        });
        _startRequestPolling();
      } else {
        await _api.setAvailability(false);
        _loc.stopTracking();
        _stopRequestPolling();
        setState(() {
          _isOnline = false;
          _toggleLoading = false;
          _incomingRequest = null;
        });
      }
    } catch (e) {
      setState(() => _toggleLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _startRequestPolling() {
    _requestPollTimer?.cancel();
    _requestPollTimer = Timer.periodic(const Duration(seconds: 2), (_) async {
      if (!_isOnline || _activeTrip != null || _incomingRequest != null) return;
      try {
        final reqs = await _api.getRideRequests();
        if (reqs.isNotEmpty && mounted) {
          _showIncomingRequest(reqs.first as Map<String, dynamic>);
        }
      } catch (_) {}
    });
  }

  void _stopRequestPolling() {
    _requestPollTimer?.cancel();
    _requestPollTimer = null;
  }

  void _showIncomingRequest(Map<String, dynamic> req) {
    setState(() {
      _incomingRequest = req;
      _requestCountdown = 15;
    });

    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() {
        if (_requestCountdown > 1) {
          _requestCountdown--;
        } else {
          t.cancel();
          _declineRequest();
        }
      });
    });
  }

  Future<void> _acceptRequest() async {
    if (_incomingRequest == null) return;
    _countdownTimer?.cancel();
    final bookingId = _incomingRequest!['bookingId'] ?? _incomingRequest!['id'];

    setState(() => _tripActionLoading = true);
    try {
      final trip = await _api.acceptRequest(bookingId);
      setState(() {
        _incomingRequest = null;
        _activeTrip = trip['booking'] ?? trip;
        _tripActionLoading = false;
      });
      _startTripPolling();
    } catch (e) {
      setState(() {
        _incomingRequest = null;
        _tripActionLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not accept: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _declineRequest() async {
    _countdownTimer?.cancel();
    if (_incomingRequest != null) {
      final bookingId = _incomingRequest!['bookingId'] ?? _incomingRequest!['id'];
      try {
        await _api.rejectRequest(bookingId);
      } catch (_) {}
    }
    setState(() => _incomingRequest = null);
  }

  void _startTripPolling() {
    _tripPollTimer?.cancel();
    _tripPollTimer = Timer.periodic(const Duration(seconds: 2), (_) async {
      if (_activeTrip == null) return;
      try {
        final trip = await _api.getActiveTrip();
        if (trip != null && mounted) {
          setState(() => _activeTrip = trip);
        }
      } catch (_) {}
    });
  }

  Future<void> _arriveAtPickup() async {
    if (_activeTrip == null) return;
    setState(() {
      _tripActionLoading = true;
      _tripActionError = null;
    });
    try {
      final updated = await _api.arriveAtPickup(_activeTrip!['id']);
      setState(() {
        _activeTrip = updated['booking'] ?? updated;
        _tripActionLoading = false;
      });
    } catch (e) {
      setState(() {
        _tripActionLoading = false;
        _tripActionError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _startTrip() async {
    if (_activeTrip == null) return;
    final otp = _otpController.text.trim();
    if (otp.length != 4 && otp.length != 6) {
      setState(() => _tripActionError = 'Enter the 4 or 6-digit OTP provided by rider');
      return;
    }
    setState(() {
      _tripActionLoading = true;
      _tripActionError = null;
    });
    try {
      final updated = await _api.startTrip(_activeTrip!['id'], otp);
      setState(() {
        _activeTrip = updated['booking'] ?? updated;
        _tripActionLoading = false;
        _otpController.clear();
      });
    } catch (e) {
      setState(() {
        _tripActionLoading = false;
        _tripActionError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _completeTrip() async {
    if (_activeTrip == null) return;
    setState(() {
      _tripActionLoading = true;
      _tripActionError = null;
    });
    try {
      final updated = await _api.completeTrip(_activeTrip!['id']);
      setState(() {
        _activeTrip = updated['booking'] ?? updated;
        _tripActionLoading = false;
      });
      _loadQuickWallet();
    } catch (e) {
      setState(() {
        _tripActionLoading = false;
        _tripActionError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _confirmCash() async {
    if (_activeTrip == null) return;
    setState(() {
      _tripActionLoading = true;
      _tripActionError = null;
    });
    try {
      await _api.confirmCash(_activeTrip!['id']);
      setState(() {
        _activeTrip = null;
        _tripActionLoading = false;
      });
      _loadQuickWallet();
      _startRequestPolling();
    } catch (e) {
      setState(() {
        _tripActionLoading = false;
        _tripActionError = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  // ─────────────────── MODAL DIALOGS WITH GESTURE ISOLATION ───────────────────

  Future<void> _openModal(Widget Function(BuildContext) contentBuilder) async {
    setState(() => _isModalOpen = true);
    await showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.55),
      builder: (ctx) => Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: 580,
            maxHeight: MediaQuery.of(ctx).size.height * 0.85,
          ),
          child: GestureDetector(
            // Fully absorb all gestures so background map NEVER moves while scrolling/dragging modal
            behavior: HitTestBehavior.opaque,
            onTap: () {},
            onVerticalDragStart: (_) {},
            onVerticalDragUpdate: (_) {},
            onVerticalDragEnd: (_) {},
            onHorizontalDragStart: (_) {},
            onHorizontalDragUpdate: (_) {},
            onHorizontalDragEnd: (_) {},
            child: contentBuilder(ctx),
          ),
        ),
      ),
    );
    if (mounted) {
      setState(() => _isModalOpen = false);
    }
  }

  void _openRidesModal() {
    _openModal((ctx) => _RidesModalCard(api: _api));
  }

  void _openWalletModal() {
    _openModal((ctx) => _WalletModalCard(api: _api, onUpdate: _loadQuickWallet));
  }

  void _openProfileModal() {
    _openModal((ctx) => _ProfileModalCard(
      api: _api,
      onLogout: () {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const DriverLoginScreen()),
          (route) => false,
        );
      },
    ));
  }

  @override
  void dispose() {
    _loc.removeListener(_onLocationChanged);
    _requestPollTimer?.cancel();
    _countdownTimer?.cancel();
    _tripPollTimer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final curLat = _loc.latitude ?? _defaultCenter.latitude;
    final curLng = _loc.longitude ?? _defaultCenter.longitude;

    return Scaffold(
      body: Stack(
        children: [
          // ── Background Google Map (Ignored and gestures disabled when any modal is open) ──
          IgnorePointer(
            ignoring: _isModalOpen || _incomingRequest != null,
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: LatLng(curLat, curLng),
                zoom: 15.5,
              ),
              onMapCreated: (ctrl) => _mapController = ctrl,
              myLocationEnabled: true,
              myLocationButtonEnabled: false,
              zoomControlsEnabled: false,
              scrollGesturesEnabled: !_isModalOpen,
              zoomGesturesEnabled: !_isModalOpen,
              rotateGesturesEnabled: !_isModalOpen,
              tiltGesturesEnabled: !_isModalOpen,
              markers: {
                Marker(
                  markerId: const MarkerId('driver_vehicle'),
                  position: LatLng(curLat, curLng),
                  rotation: _loc.currentHeading,
                  anchor: const Offset(0.5, 0.5),
                  flat: true,
                  infoWindow: const InfoWindow(title: 'Your Cab (LiteSpark)'),
                  icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet),
                ),
              },
            ),
          ),

          // ── Top Header Navigation Bar ──
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Card(
                elevation: 6,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Row(
                    children: [
                      BrandAssets.logo(size: 34, radius: 8),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'LiteSpark Driver',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              _isOnline
                                  ? '● Online (${_loc.speedKmph.toStringAsFixed(0)} km/h)'
                                  : 'Offline (Tap toggle to start)',
                              style: TextStyle(
                                fontSize: 11,
                                color: _isOnline ? DriverColors.online : Colors.black45,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Quick Wallet Pill Button
                      InkWell(
                        onTap: _openWalletModal,
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF5FF),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: DriverColors.primary.withOpacity(0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.account_balance_wallet, size: 15, color: DriverColors.primary),
                              const SizedBox(width: 4),
                              Text(
                                '₹${_todayEarnings.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: DriverColors.primaryDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Profile Button
                      IconButton(
                        icon: const Icon(Icons.account_circle, color: DriverColors.primary, size: 28),
                        tooltip: 'Profile & Vehicle',
                        onPressed: _openProfileModal,
                      ),

                      // Online Switch Toggle
                      _toggleLoading
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(strokeWidth: 2.5),
                            )
                          : Switch(
                              value: _isOnline,
                              activeColor: DriverColors.online,
                              onChanged: _activeTrip != null ? null : _toggleOnline,
                            ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // ── Incoming Ride Request Modal (Overlaid) ──
          if (_incomingRequest != null)
            _buildIncomingRequestOverlay(),

          // ── Active Trip Control Sheet ──
          if (_activeTrip != null && _incomingRequest == null)
            Positioned(
              left: 12,
              right: 12,
              bottom: 24,
              child: _buildActiveTripCard(),
            ),

          // ── Desktop Manual Teleport & Simulation Helper ──
          if (_isOnline && _activeTrip == null && _incomingRequest == null)
            Positioned(
              left: 14,
              bottom: 90,
              child: _buildDesktopTestingPill(),
            ),

          // ── Floating Bottom Navigation Dock (Rides / Wallet / Profile) ──
          if (_activeTrip == null && _incomingRequest == null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 16,
              child: Center(
                child: Card(
                  elevation: 10,
                  shadowColor: Colors.black38,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildNavPill(
                          icon: Icons.map,
                          label: 'Map',
                          isSelected: true,
                          onTap: () {},
                        ),
                        const SizedBox(width: 6),
                        _buildNavPill(
                          icon: Icons.history,
                          label: 'My Rides',
                          isSelected: false,
                          onTap: _openRidesModal,
                        ),
                        const SizedBox(width: 6),
                        _buildNavPill(
                          icon: Icons.account_balance_wallet,
                          label: 'Wallet',
                          isSelected: false,
                          onTap: _openWalletModal,
                        ),
                        const SizedBox(width: 6),
                        _buildNavPill(
                          icon: Icons.person,
                          label: 'Profile',
                          isSelected: false,
                          onTap: _openProfileModal,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildNavPill({
    required IconData icon,
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? DriverColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17, color: isSelected ? Colors.white : Colors.black87),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                color: isSelected ? Colors.white : Colors.black87,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIncomingRequestOverlay() {
    final req = _incomingRequest!;
    final pickup = req['pickup']?['address'] ?? 'Pickup Location';
    final dropoff = req['dropoff']?['address'] ?? 'Dropoff Location';
    final fare = req['estimatedFare'] ?? req['fare'] ?? '₹ 220';

    return Container(
      color: Colors.black54,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(20),
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        elevation: 12,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'NEW RIDE OFFER',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: DriverColors.primary),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_requestCountdown}s',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.brown),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.circle, color: Colors.green, size: 14),
                title: Text(pickup, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: const Text('Pickup', style: TextStyle(fontSize: 11)),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.location_on, color: Colors.red, size: 16),
                title: Text(dropoff, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: const Text('Drop-off', style: TextStyle(fontSize: 11)),
              ),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Estimated Earnings:', style: TextStyle(color: Colors.black54)),
                  Text(
                    fare.toString().startsWith('₹') ? fare.toString() : '₹$fare',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: DriverColors.primaryDark),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _tripActionLoading ? null : _declineRequest,
                      child: const Text('DECLINE'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: DriverColors.online,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _tripActionLoading ? null : _acceptRequest,
                      child: _tripActionLoading
                          ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white))
                          : const Text('ACCEPT RIDE', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveTripCard() {
    final trip = _activeTrip!;
    final status = (trip['status'] ?? '').toString().toLowerCase();
    final pickup = trip['pickupAddress'] ?? trip['pickup']?['address'] ?? 'Pickup';
    final dropoff = trip['dropoffAddress'] ?? trip['dropoff']?['address'] ?? 'Dropoff';

    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 8,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: DriverColors.primaryLight.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status.toUpperCase().replaceAll('_', ' '),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: DriverColors.primaryDark,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  'Fare: ₹ ${trip['finalFare'] ?? trip['estimatedFare'] ?? '220'}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.circle, color: Colors.green, size: 12),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(pickup, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.red, size: 14),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(dropoff, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1),
                ),
              ],
            ),
            if (_tripActionError != null) ...[
              const SizedBox(height: 8),
              Text(_tripActionError!, style: const TextStyle(color: Colors.red, fontSize: 12)),
            ],
            const SizedBox(height: 14),

            if (status == 'assigned')
              ElevatedButton.icon(
                icon: const Icon(Icons.navigation),
                label: _tripActionLoading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white))
                    : const Text('ARRIVED AT PICKUP', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: DriverColors.primary),
                onPressed: _tripActionLoading ? null : _arriveAtPickup,
              ),

            if (status == 'arrived') ...[
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                decoration: const InputDecoration(
                  labelText: 'Enter Rider Start OTP',
                  hintText: 'e.g. 1234',
                  counterText: '',
                  prefixIcon: Icon(Icons.lock_clock),
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
              ),
              const SizedBox(height: 8),
              ElevatedButton.icon(
                icon: const Icon(Icons.play_arrow),
                label: _tripActionLoading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white))
                    : const Text('START TRIP', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: DriverColors.online),
                onPressed: _tripActionLoading ? null : _startTrip,
              ),
            ],

            if (status == 'in_progress')
              ElevatedButton.icon(
                icon: const Icon(Icons.flag),
                label: _tripActionLoading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white))
                    : const Text('COMPLETE TRIP', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.blue.shade700),
                onPressed: _tripActionLoading ? null : _completeTrip,
              ),

            if (status == 'completed') ...[
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total Cash Fare to Collect:', style: TextStyle(fontWeight: FontWeight.w600)),
                  Text(
                    '₹ ${trip['finalFare'] ?? trip['estimatedFare'] ?? '220'}',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.green),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                icon: const Icon(Icons.payments),
                label: _tripActionLoading
                    ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white))
                    : const Text('CONFIRM CASH COLLECTED', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: DriverColors.online),
                onPressed: _tripActionLoading ? null : _confirmCash,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDesktopTestingPill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.gps_fixed, size: 16, color: DriverColors.primary),
          const SizedBox(width: 6),
          Text(
            'GPS: ${(_loc.latitude ?? 0).toStringAsFixed(4)}, ${(_loc.longitude ?? 0).toStringAsFixed(4)}',
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: () {
              final lat = (_loc.latitude ?? _defaultCenter.latitude) + 0.0005;
              final lng = (_loc.longitude ?? _defaultCenter.longitude) + 0.0005;
              _loc.setManualPosition(lat, lng, heading: 45);
            },
            child: const Text('Move +50m', style: TextStyle(fontSize: 11, color: Colors.blue, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: () => _loc.setManualPosition(10.5931, 76.9058, heading: 0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(4), border: Border.all(color: Colors.green)),
              child: const Text('📍 Odayakulam', style: TextStyle(fontSize: 10, color: Colors.green, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 6),
          InkWell(
            onTap: () => _loc.setManualPosition(10.6600, 77.0070, heading: 0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: Colors.purple.shade50, borderRadius: BorderRadius.circular(4), border: Border.all(color: Colors.purple)),
              child: const Text('🚌 Pollachi', style: TextStyle(fontSize: 10, color: Colors.purple, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────── MODAL CARD: MY RIDES (NO GESTURE CONFLICT) ───────────────────

class _RidesModalCard extends StatelessWidget {
  final DriverApiClient api;
  const _RidesModalCard({required this.api});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 8)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.directions_car, color: DriverColors.primary),
                    SizedBox(width: 10),
                    Text('My Rides History', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Content List
          Flexible(
            child: FutureBuilder<Map<String, dynamic>>(
              future: api.getTrips(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final trips = (snapshot.data?['trips'] as List<dynamic>?) ?? [];
                if (trips.isEmpty) {
                  return Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.drive_eta_outlined, size: 56, color: Colors.grey.shade400),
                        const SizedBox(height: 12),
                        const Text('No Rides Yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Text(
                          'Go online to receive and complete passenger rides. Your trip history and earnings will appear here.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  );
                }

                return Scrollbar(
                  thumbVisibility: true,
                  child: ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(16),
                    itemCount: trips.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, i) {
                      final trip = trips[i] as Map<String, dynamic>;
                      final pickup = trip['pickupAddress'] ?? trip['pickup']?['address'] ?? 'Pickup point';
                      final dropoff = trip['dropoffAddress'] ?? trip['dropoff']?['address'] ?? 'Dropoff point';
                      final fare = trip['finalFare'] ?? trip['estimatedFare'] ?? 0;
                      final status = (trip['status'] ?? '').toString().toLowerCase();

                      return Card(
                        elevation: 1.5,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '#${(trip['id'] ?? '').toString().substring(0, 8).toUpperCase()}',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: DriverColors.primary),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: status == 'completed'
                                          ? Colors.green.shade50
                                          : status == 'cancelled'
                                              ? Colors.red.shade50
                                              : Colors.purple.shade50,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      status.toUpperCase().replaceAll('_', ' '),
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: status == 'completed'
                                            ? Colors.green.shade700
                                            : status == 'cancelled'
                                                ? Colors.red.shade700
                                                : DriverColors.primaryDark,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Icon(Icons.circle, color: Colors.green, size: 10),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(pickup, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), maxLines: 1),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, color: Colors.red, size: 12),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(dropoff, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500), maxLines: 1),
                                  ),
                                ],
                              ),
                              const Divider(height: 18),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    trip['createdAt'] != null ? DateTime.parse(trip['createdAt']).toLocal().toString().substring(0, 16) : '',
                                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                                  ),
                                  Text(
                                    '₹$fare',
                                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.green),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────── MODAL CARD: WALLET & EARNINGS (NO GESTURE CONFLICT) ───────────────────

class _WalletModalCard extends StatefulWidget {
  final DriverApiClient api;
  final VoidCallback onUpdate;
  const _WalletModalCard({required this.api, required this.onUpdate});

  @override
  State<_WalletModalCard> createState() => _WalletModalCardState();
}

class _WalletModalCardState extends State<_WalletModalCard> {
  bool _payoutRequested = false;
  bool _actionLoading = false;

  Future<void> _showChangePlanDialog(String currentPlan) async {
    final selected = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.monetization_on, color: DriverColors.primary),
            SizedBox(width: 8),
            Text('Choose Earnings Plan', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Select which plan works best for your driving hours. You can switch plans anytime.',
                style: TextStyle(fontSize: 13, color: Colors.black54),
              ),
              const SizedBox(height: 16),
              _buildPlanOption(
                ctx,
                id: 'daily_sub_29',
                title: 'Daily Unlimited Pass',
                fee: '₹29 / day',
                description: '0% commission on every ride! Keep 100% of customer fare.',
                badge: 'RECOMMENDED (0% COMM)',
                badgeColor: Colors.green,
                isSelected: currentPlan == 'daily_sub_29',
              ),
              const SizedBox(height: 10),
              _buildPlanOption(
                ctx,
                id: 'flat_fee_15',
                title: 'Flat Booking Fee',
                fee: '₹15 / ride',
                description: 'Flat ₹15 platform fee per ride. Keep 100% of base fare.',
                badge: 'POPULAR FOR HIGH FARES',
                badgeColor: Colors.blue,
                isSelected: currentPlan == 'flat_fee_15',
              ),
              const SizedBox(height: 10),
              _buildPlanOption(
                ctx,
                id: 'commission_15',
                title: 'Standard Commission',
                fee: '15% per trip',
                description: 'Pay-as-you-go 15% platform commission. No upfront cost.',
                badge: 'PART-TIME DRIVERS',
                badgeColor: Colors.orange,
                isSelected: currentPlan == 'commission_15',
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );

    if (selected != null && selected != currentPlan) {
      setState(() => _actionLoading = true);
      try {
        await widget.api.updatePlan(selected);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Switched to ${selected.replaceAll('_', ' ').toUpperCase()}!'),
            backgroundColor: Colors.green,
          ),
        );
        widget.onUpdate();
        setState(() {});
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      } finally {
        if (mounted) setState(() => _actionLoading = false);
      }
    }
  }

  Widget _buildPlanOption(
    BuildContext ctx, {
    required String id,
    required String title,
    required String fee,
    required String description,
    required String badge,
    required Color badgeColor,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () => Navigator.pop(ctx, id),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? DriverColors.primary.withOpacity(0.06) : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? DriverColors.primary : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: badgeColor.withOpacity(0.12), borderRadius: BorderRadius.circular(4)),
                  child: Text(badge, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: badgeColor)),
                ),
                const Spacer(),
                Text(fee, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: DriverColors.primaryDark)),
                const SizedBox(width: 6),
                Icon(isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                    size: 18, color: isSelected ? DriverColors.primary : Colors.grey),
              ],
            ),
            const SizedBox(height: 4),
            Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 2),
            Text(description, style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
          ],
        ),
      ),
    );
  }

  Future<void> _topUpWithRazorpay(int amount) async {
    setState(() => _actionLoading = true);
    try {
      final orderRes = await widget.api.createRazorpayOrder(amount.toDouble(), purpose: 'wallet_topup');
      final orderId = orderRes['order']?['id'] ?? 'order_${DateTime.now().millisecondsSinceEpoch}';
      final paymentId = 'pay_sim_${DateTime.now().millisecondsSinceEpoch}';

      await widget.api.verifyRazorpayPayment(
        orderId: orderId,
        paymentId: paymentId,
        signature: 'sim_sig_${DateTime.now().millisecondsSinceEpoch}',
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('₹$amount added to wallet via Razorpay!'),
          backgroundColor: Colors.green,
        ),
      );
      widget.onUpdate();
      setState(() {});
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Top-up failed: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  Future<void> _activateDailyPass() async {
    setState(() => _actionLoading = true);
    try {
      final res = await widget.api.activateSubscription(tier: 'daily_29');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Daily Pass activated! 0% commission active.'),
          backgroundColor: Colors.green,
        ),
      );
      widget.onUpdate();
      setState(() {});
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _actionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 8)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.account_balance_wallet, color: DriverColors.primary),
                    SizedBox(width: 10),
                    Text('Earnings & Wallet', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Scrollable Body
          Flexible(
            child: FutureBuilder<Map<String, dynamic>>(
              future: widget.api.getWallet(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final w = snapshot.data ?? {};
                final balance = (w['walletBalance'] as num?)?.toDouble() ?? 0.0;
                final today = (w['todayEarnings'] as num?)?.toDouble() ?? 0.0;
                final total = (w['totalEarnings'] as num?)?.toDouble() ?? 0.0;
                final cash = (w['cashCollected'] as num?)?.toDouble() ?? 0.0;
                final trips = w['completedTrips'] ?? 0;
                final txs = (w['recentTransactions'] as List<dynamic>?) ?? [];
                final plan = (w['pricingPlan'] ?? 'commission_15').toString();
                final isSubActive = w['isSubscriptionActive'] == true;

                String planTitle = 'Standard 15% Commission';
                String planBadge = 'PAY AS YOU GO';
                Color planColor = Colors.orange.shade800;
                if (plan == 'daily_sub_29') {
                  planTitle = 'Daily Unlimited Pass (₹29/day)';
                  planBadge = '0% COMMISSION';
                  planColor = Colors.green.shade700;
                } else if (plan == 'flat_fee_15') {
                  planTitle = 'Flat Booking Fee (₹15/ride)';
                  planBadge = 'FIXED FEE';
                  planColor = Colors.blue.shade700;
                }

                return Scrollbar(
                  thumbVisibility: true,
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(18),
                    children: [
                      // Gradient Balance Card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6D28D9), Color(0xFF4C1D95)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Available Payout Balance', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            const SizedBox(height: 6),
                            Text(
                              '₹${balance.toStringAsFixed(2)}',
                              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              icon: Icon(_payoutRequested ? Icons.check : Icons.arrow_outward, size: 16),
                              label: Text(
                                _payoutRequested ? 'Payout Requested' : 'Withdraw to Bank',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: _payoutRequested ? Colors.green : Colors.amber.shade400,
                                foregroundColor: Colors.black,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                minimumSize: const Size.fromHeight(42),
                              ),
                              onPressed: () {
                                setState(() => _payoutRequested = true);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Payout request of your wallet balance has been sent to Admin!'),
                                    backgroundColor: Colors.green,
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 14),
                            // Quick Razorpay Recharge row inside card
                            Row(
                              children: [
                                const Text(
                                  'Top-Up (Razorpay):',
                                  style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(width: 8),
                                ...[100, 200, 500].map((amt) => Padding(
                                      padding: const EdgeInsets.only(right: 6),
                                      child: InkWell(
                                        onTap: _actionLoading ? null : () => _topUpWithRazorpay(amt),
                                        borderRadius: BorderRadius.circular(8),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.18),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(color: Colors.white30),
                                          ),
                                          child: Text(
                                            '+₹$amt',
                                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                    )),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Driver Earnings Plan Card
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 2)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: planColor.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    planBadge,
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: planColor, letterSpacing: 0.5),
                                  ),
                                ),
                                const Spacer(),
                                TextButton.icon(
                                  icon: const Icon(Icons.swap_horiz, size: 16),
                                  label: const Text('Change Plan', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  style: TextButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  ),
                                  onPressed: _actionLoading ? null : () => _showChangePlanDialog(plan),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              planTitle,
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: DriverColors.primaryDark),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              plan == 'daily_sub_29'
                                  ? (isSubActive
                                      ? '✅ Pass is active today! Enjoy 0% commission on all rides.'
                                      : '⚠️ Pass inactive. Activate for ₹29 to enjoy 0% commission today.')
                                  : (plan == 'flat_fee_15'
                                      ? '⚡ Flat ₹15 platform fee per ride. Keep 100% of customer fare.'
                                      : '💼 15% platform commission deducted automatically per trip.'),
                              style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                            ),
                            if (plan == 'daily_sub_29' && !isSubActive) ...[
                              const SizedBox(height: 10),
                              ElevatedButton.icon(
                                icon: const Icon(Icons.bolt, size: 16, color: Colors.amber),
                                label: const Text('Activate Today\'s Pass (₹29)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: DriverColors.primaryDark,
                                  foregroundColor: Colors.white,
                                  minimumSize: const Size.fromHeight(38),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _actionLoading ? null : _activateDailyPass,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Metrics Grid
                      Row(
                        children: [
                          Expanded(
                            child: _buildMetricTile(
                              icon: Icons.trending_up,
                              title: "Today's Earnings",
                              value: '₹${today.toStringAsFixed(0)}',
                              color: Colors.green,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildMetricTile(
                              icon: Icons.local_taxi,
                              title: 'Completed Trips',
                              value: '$trips',
                              color: DriverColors.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _buildMetricTile(
                              icon: Icons.payments_outlined,
                              title: 'Cash in Hand',
                              value: '₹${cash.toStringAsFixed(0)}',
                              color: Colors.amber.shade800,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _buildMetricTile(
                              icon: Icons.savings_outlined,
                              title: 'Total Lifetime Net',
                              value: '₹${total.toStringAsFixed(0)}',
                              color: Colors.purple.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Recent Transactions
                      const Text('Recent Trip Transactions', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 10),
                      if (txs.isEmpty)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Center(
                            child: Text(
                              'No completed trip transactions yet.',
                              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                            ),
                          ),
                        )
                      else
                        ...txs.map((tx) {
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(10)),
                              child: const Icon(Icons.arrow_downward, color: Colors.green, size: 18),
                            ),
                            title: Text(
                              'Trip #${tx['bookingReference'] ?? tx['id']?.toString().substring(0, 8)}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            subtitle: Text(
                              '${tx['pickup']} → ${tx['dropoff']}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11),
                            ),
                            trailing: Text(
                              '+₹${tx['driverShare'] ?? tx['fare']}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.green),
                            ),
                          );
                        }),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricTile({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(height: 6),
          Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }
}

// ─────────────────── MODAL CARD: PROFILE & VEHICLE (NO GESTURE CONFLICT) ───────────────────

class _ProfileModalCard extends StatelessWidget {
  final DriverApiClient api;
  final VoidCallback onLogout;
  const _ProfileModalCard({required this.api, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 20, offset: Offset(0, 8)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.person, color: DriverColors.primary),
                    SizedBox(width: 10),
                    Text('Driver Partner Profile', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Scrollable Body
          Flexible(
            child: FutureBuilder<Map<String, dynamic>>(
              future: api.getDriverProfile(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.all(40),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final profile = snapshot.data?['profile'] as Map<String, dynamic>? ?? {};
                final vehicle = snapshot.data?['vehicle'] as Map<String, dynamic>? ?? {};
                final name = profile['name'] ?? 'Driver Partner';
                final phone = profile['phone'] ?? api.driverUser?['phone'] ?? 'N/A';
                final approval = (profile['approval'] ?? 'approved').toString();
                final plan = (profile['pricingPlan'] ?? 'commission_15').toString();

                return Scrollbar(
                  thumbVisibility: true,
                  child: ListView(
                    shrinkWrap: true,
                    padding: const EdgeInsets.all(20),
                    children: [
                      // Avatar & Header Card
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: DriverColors.primary.withOpacity(0.15),
                            child: Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'D',
                              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: DriverColors.primary),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(name, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 3),
                                Text(phone, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                      decoration: BoxDecoration(
                                        color: Colors.green.shade50,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: Colors.green.shade300),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          const Icon(Icons.check_circle, size: 12, color: Colors.green),
                                          const SizedBox(width: 4),
                                          Text(
                                            approval.toUpperCase(),
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    const Row(
                                      children: [
                                        Icon(Icons.star, size: 14, color: Colors.amber),
                                        SizedBox(width: 2),
                                        Text('5.0', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),

                      // Vehicle Details Section
                      const Text('Registered Vehicle', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: [
                            _buildInfoRow(
                              icon: Icons.directions_car,
                              label: 'Vehicle Model',
                              value: vehicle['model'] ?? 'Standard Cab',
                            ),
                            const Divider(height: 14),
                            _buildInfoRow(
                              icon: Icons.badge,
                              label: 'License Plate Number',
                              value: vehicle['registrationNumber'] ?? 'N/A',
                              isHighlight: true,
                            ),
                            const Divider(height: 14),
                            _buildInfoRow(
                              icon: Icons.palette,
                              label: 'Color',
                              value: vehicle['color'] ?? 'White',
                            ),
                            const Divider(height: 14),
                            _buildInfoRow(
                              icon: Icons.monetization_on,
                              label: 'Earnings Plan',
                              value: plan == 'daily_sub_29'
                                  ? 'Daily Unlimited Pass (0% Comm)'
                                  : (plan == 'flat_fee_15' ? 'Flat ₹15 / Ride' : 'Standard 15% Comm'),
                              isHighlight: true,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Document Verification Status
                      const Text('KYC Document Status', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: [
                            _buildDocRow(
                              title: 'Driving Licence',
                              number: profile['licenseNumber'] ?? 'Verified',
                            ),
                            const Divider(height: 14),
                            _buildDocRow(
                              title: 'Aadhaar Card',
                              number: profile['aadhaarNumber'] ?? 'Verified',
                            ),
                            const Divider(height: 14),
                            _buildDocRow(
                              title: '4-Sided Vehicle Photos',
                              number: 'Front, Back, Left, Right',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Logout Button
                      OutlinedButton.icon(
                        icon: const Icon(Icons.logout, color: Colors.red, size: 18),
                        label: const Text('Log Out Driver Partner', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.red),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          await api.logout();
                          if (context.mounted) {
                            Navigator.of(context).pop();
                            onLogout();
                          }
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow({
    required IconData icon,
    required String label,
    required String value,
    bool isHighlight = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: Colors.grey.shade600),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
          ],
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isHighlight ? DriverColors.primary : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildDocRow({
    required String title,
    required String number,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            Text(number, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
          ],
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
          child: const Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check, size: 12, color: Colors.green),
              SizedBox(width: 4),
              Text('VERIFIED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green)),
            ],
          ),
        ),
      ],
    );
  }
}
