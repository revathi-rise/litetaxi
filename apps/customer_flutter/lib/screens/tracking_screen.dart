import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';
import '../core/api_client.dart';
import '../core/models.dart';
import '../core/theme.dart';
import '../widgets/route_map.dart';
import '../widgets/status_badge.dart';
import '../widgets/car_icon.dart';

class TrackingScreen extends StatefulWidget {
  final String bookingId;
  const TrackingScreen({super.key, required this.bookingId});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> with SingleTickerProviderStateMixin {
  BookingSnapshot? _booking;
  bool _loading = true;
  String? _error;
  Timer? _timer;
  bool _cancelling = false;

  // ── Live cab animation ──
  late final AnimationController _moveCtrl;
  LatLng? _animFrom;
  LatLng? _animTo;
  LatLng? _shown; // currently displayed (interpolated) cab position
  double _heading = 0;
  int _fitKey = 0;
  String? _lastStatus;

  // ── Real Turn-by-Turn Road Directions ──
  List<List<double>> _approachRoadRoute = [];
  List<NavigationStep> _navSteps = [];
  String? _lastApproachKey;
  bool _fetchingApproach = false;
  bool _fetchingSteps = false;
  bool _showDetailsSheet = false;
  bool _muted = false;
  bool _navigationCentered = true;

  @override
  void initState() {
    super.initState();
    CarIcons.load();
    _moveCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))
      ..addListener(_onFrame);
    _fetchBooking();
    // Poll every second for near real-time cab position
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_booking == null || !_booking!.isTerminal) {
        _fetchBooking();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _moveCtrl.dispose();
    super.dispose();
  }

  void _onFrame() {
    if (_animFrom == null || _animTo == null) return;
    final t = Curves.linear.transform(_moveCtrl.value);
    setState(() {
      _shown = LatLng(
        _animFrom!.latitude + (_animTo!.latitude - _animFrom!.latitude) * t,
        _animFrom!.longitude + (_animTo!.longitude - _animFrom!.longitude) * t,
      );
    });
  }

  static double _bearing(LatLng a, LatLng b) {
    final lat1 = a.latitude * math.pi / 180, lat2 = b.latitude * math.pi / 180;
    final dLng = (b.longitude - a.longitude) * math.pi / 180;
    final y = math.sin(dLng) * math.cos(lat2);
    final x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dLng);
    return (math.atan2(y, x) * 180 / math.pi + 360) % 360;
  }

  static double _distanceKm(LatLng a, LatLng b) {
    const r = 6371.0;
    final dLat = (b.latitude - a.latitude) * math.pi / 180;
    final dLng = (b.longitude - a.longitude) * math.pi / 180;
    final h = math.pow(math.sin(dLat / 2), 2) +
        math.cos(a.latitude * math.pi / 180) * math.cos(b.latitude * math.pi / 180) * math.pow(math.sin(dLng / 2), 2);
    return 2 * r * math.asin(math.sqrt(h));
  }

  /// Called with each new GPS fix; glides the cab from where it is now to the new point.
  void _onDriverFix(LatLng target) {
    if (_shown == null) {
      _shown = target;
      _animFrom = target;
      _animTo = target;
      return;
    }
    if (_animTo != null &&
        (_animTo!.latitude - target.latitude).abs() < 1e-7 &&
        (_animTo!.longitude - target.longitude).abs() < 1e-7) {
      return; // unchanged fix
    }
    final from = _shown!;
    if (_distanceKm(from, target) > 0.002) {
      // only rotate when really moving (>2m) to avoid jitter
      final hdg = _bearing(from, target);
      // shortest-arc smoothing of heading
      double diff = ((hdg - _heading + 540) % 360) - 180;
      _heading = (_heading + diff * 0.85 + 360) % 360;
    }
    _animFrom = from;
    _animTo = target;
    _moveCtrl.forward(from: 0);
  }

  Future<void> _fetchBooking() async {
    try {
      final data = await ApiClient().trackBooking(widget.bookingId);
      if (!mounted) return;
      final snap = BookingSnapshot.fromJson(data['booking'] ?? data);
      final loc = snap.driverLocation;
      if (loc != null && loc.lat != 0) _onDriverFix(LatLng(loc.lat, loc.lng));
      setState(() {
        _booking = snap;
        _loading = false;
        _error = null;
        if (_lastStatus != snap.status) {
          _lastStatus = snap.status;
          _fitKey++; // re-fit camera when ride phase changes
        }
      });
      _updateLiveDirections(snap);
      if (snap.isTerminal) _timer?.cancel();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e is ApiException ? e.message : 'Could not load booking';
      });
    }
  }

  Future<void> _updateLiveDirections(BookingSnapshot snap) async {
    final loc = _shown ??
        (snap.driverLocation != null && snap.driverLocation!.lat != 0
            ? LatLng(snap.driverLocation!.lat, snap.driverLocation!.lng)
            : null);
    if (loc == null) return;

    final pickupLat = (snap.pickup['lat'] as num?)?.toDouble();
    final pickupLng = (snap.pickup['lng'] as num?)?.toDouble();
    final dropLat = (snap.dropoff['lat'] as num?)?.toDouble();
    final dropLng = (snap.dropoff['lng'] as num?)?.toDouble();

    final approaching = snap.status == 'DRIVER_ASSIGNED' || snap.status == 'ARRIVED';
    final inTrip = snap.status == 'IN_PROGRESS';

    if (approaching && pickupLat != null && pickupLng != null) {
      final key = 'app_${snap.status}';
      if (_lastApproachKey != key && !_fetchingApproach) {
        _lastApproachKey = key;
        _fetchApproachRoadRoute(loc.latitude, loc.longitude, pickupLat, pickupLng);
      }
    } else if (inTrip && dropLat != null && dropLng != null) {
      if (_navSteps.isEmpty && !_fetchingSteps) {
        _fetchTripNavigation(pickupLat ?? loc.latitude, pickupLng ?? loc.longitude, dropLat, dropLng);
      }
    }
  }

  Future<void> _fetchApproachRoadRoute(
    double fromLat,
    double fromLng,
    double toLat,
    double toLng,
  ) async {
    _fetchingApproach = true;
    try {
      final nav = await ApiClient().getNavigationRoute(fromLat, fromLng, toLat, toLng);
      final pts = nav['points'] as List<List<double>>? ?? [];
      if (mounted && pts.isNotEmpty) {
        setState(() {
          _approachRoadRoute = pts;
        });
      }
    } catch (_) {} finally {
      _fetchingApproach = false;
    }
  }

  Future<void> _fetchTripNavigation(
    double fromLat,
    double fromLng,
    double toLat,
    double toLng,
  ) async {
    _fetchingSteps = true;
    try {
      final nav = await ApiClient().getNavigationRoute(fromLat, fromLng, toLat, toLng);
      final rawSteps = nav['steps'] as List? ?? [];
      final steps = rawSteps
          .map((s) => NavigationStep.fromJson(s as Map<String, dynamic>))
          .toList();
      if (mounted && steps.isNotEmpty) {
        setState(() {
          _navSteps = steps;
        });
      }
    } catch (_) {} finally {
      _fetchingSteps = false;
    }
  }

  NavigationStep _getCurrentNavStep(LatLng? driverLoc, List<List<double>> remainingRoute) {
    if (_navSteps.isNotEmpty && driverLoc != null) {
      for (final s in _navSteps) {
        if (s.lat != null && s.lng != null) {
          final dist = _distanceKm(driverLoc, LatLng(s.lat!, s.lng!));
          if (dist > 0.04) {
            return NavigationStep(
              instruction: s.instruction,
              maneuver: s.maneuver,
              distanceMeters: (dist * 1000).round().clamp(20, 5000),
            );
          }
        }
      }
      return _navSteps.last;
    }

    // Dynamic fallback along turn geometry
    if (remainingRoute.length >= 3 && driverLoc != null) {
      double cumDist = 0;
      for (int i = 1; i < remainingRoute.length - 1; i++) {
        final p0 = LatLng(remainingRoute[i - 1][0], remainingRoute[i - 1][1]);
        final p1 = LatLng(remainingRoute[i][0], remainingRoute[i][1]);
        final p2 = LatLng(remainingRoute[i + 1][0], remainingRoute[i + 1][1]);
        cumDist += _distanceKm(p0, p1);

        final b1 = _bearing(p0, p1);
        final b2 = _bearing(p1, p2);
        double diff = ((b2 - b1 + 540) % 360) - 180;
        if (diff.abs() > 22) {
          final man = diff < 0 ? 'TURN_LEFT' : 'TURN_RIGHT';
          final inst = diff < 0 ? 'Turn left' : 'Turn right';
          return NavigationStep(
            instruction: inst,
            maneuver: man,
            distanceMeters: (cumDist * 1000).round().clamp(20, 5000),
          );
        }
      }
    }

    return NavigationStep(
      instruction: 'Continue along the route',
      maneuver: 'STRAIGHT',
      distanceMeters: 260,
    );
  }

  IconData _maneuverIcon(String maneuver) {
    final m = maneuver.toUpperCase();
    if (m.contains('SHARP_LEFT')) return Icons.turn_sharp_left;
    if (m.contains('SHARP_RIGHT')) return Icons.turn_sharp_right;
    if (m.contains('SLIGHT_LEFT')) return Icons.turn_slight_left;
    if (m.contains('SLIGHT_RIGHT')) return Icons.turn_slight_right;
    if (m.contains('LEFT')) return Icons.turn_left;
    if (m.contains('RIGHT')) return Icons.turn_right;
    if (m.contains('U_TURN')) return Icons.u_turn_left;
    return Icons.straight;
  }

  NavigationStep _getNextNavStep(NavigationStep current) {
    if (_navSteps.length > 1) {
      final idx = _navSteps.indexWhere((s) => s.instruction == current.instruction);
      if (idx >= 0 && idx + 1 < _navSteps.length) {
        return _navSteps[idx + 1];
      }
    }
    return NavigationStep(
      instruction: 'Continue straight',
      maneuver: 'TURN_RIGHT',
      distanceMeters: 500,
    );
  }

  Future<void> _cancelBooking() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Ride?'),
        content: const Text('Are you sure you want to cancel this booking?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _cancelling = true);
    try {
      await ApiClient().cancelBooking(widget.bookingId, reason: 'Customer cancelled');
      await _fetchBooking();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e is ApiException ? e.message : 'Cancel failed')),
      );
    }
    if (mounted) setState(() => _cancelling = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _booking == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (_error != null && _booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Track Ride')),
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: 12),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 20),
            ElevatedButton(onPressed: _fetchBooking, child: const Text('Retry')),
          ]),
        ),
      );
    }

    final b = _booking!;
    final driverLoc = (_shown != null && !b.isTerminal) ? _shown : null;
    final pickupLat = (b.pickup['lat'] as num?)?.toDouble();
    final pickupLng = (b.pickup['lng'] as num?)?.toDouble();
    final dropLat = (b.dropoff['lat'] as num?)?.toDouble();
    final dropLng = (b.dropoff['lng'] as num?)?.toDouble();
    final pickupLL = pickupLat != null ? LatLng(pickupLat, pickupLng!) : null;
    final dropLL = dropLat != null ? LatLng(dropLat, dropLng!) : null;
    final approaching = b.status == 'DRIVER_ASSIGNED' || b.status == 'ARRIVED';
    final inTrip = b.status == 'IN_PROGRESS';
    final target = inTrip ? dropLL : pickupLL;
    double? distKm;
    if (driverLoc != null && target != null && (approaching || inTrip)) {
      distKm = _distanceKm(driverLoc, target);
    }
    final etaText = b.etaMinutes != null
        ? (b.etaMinutes! <= 1 ? 'Arriving now' : '${b.etaMinutes} min')
        : null;

    final sheetHeight = (MediaQuery.of(context).size.height * 0.46).clamp(210.0, 390.0);
    final navCollapsedHeight = 96.0;
    final activeSheetHeight = inTrip
        ? (_showDetailsSheet ? sheetHeight : navCollapsedHeight)
        : sheetHeight;

    // Sliced route from driver location forward to destination
    List<List<double>> activeRoute = b.route;
    if (inTrip && driverLoc != null && b.route.length >= 2) {
      int closestIdx = 0;
      double minD = double.infinity;
      for (int i = 0; i < b.route.length; i++) {
        final d = _distanceKm(driverLoc, LatLng(b.route[i][0], b.route[i][1]));
        if (d < minD) {
          minD = d;
          closestIdx = i;
        }
      }
      activeRoute = [
        [driverLoc.latitude, driverLoc.longitude],
        ...b.route.sublist(closestIdx),
      ];
    }

    final currentNavStep = _getCurrentNavStep(driverLoc, activeRoute);
    final nextNavStep = _getNextNavStep(currentNavStep);

    // Formatted ETA clock & duration
    final remainingMin = b.etaMinutes ?? ((distKm ?? 5.0) * 2.5).round().clamp(2, 180);
    final etaDurationStr = remainingMin >= 60
        ? '${remainingMin ~/ 60} hr ${remainingMin % 60} min'
        : '$remainingMin min';
    final arrivalTime = DateTime.now().add(Duration(minutes: remainingMin));
    final hour = arrivalTime.hour % 12 == 0 ? 12 : arrivalTime.hour % 12;
    final ampm = arrivalTime.hour >= 12 ? 'pm' : 'am';
    final minuteStr = arrivalTime.minute.toString().padLeft(2, '0');
    final distStr = distKm != null
        ? (distKm < 1 ? '${(distKm * 1000).round()} m' : '${distKm.toStringAsFixed(1)} km')
        : 'Route';
    final subtitleNavStr = '$distStr • $hour:$minuteStr $ampm';

    return Scaffold(
      body: Stack(
        children: [
          // Map
          Positioned.fill(
            child: RouteMap(
              pickup: pickupLL,
              dropoff: dropLL,
              pickupLabel: b.pickup['name']?.toString() ?? b.pickup['address']?.toString(),
              dropoffLabel: b.dropoff['name']?.toString() ?? b.dropoff['address']?.toString(),
              driverLocation: driverLoc,
              driverHeading: _heading,
              approachTo: approaching ? pickupLL : null,
              approachRoute: approaching ? _approachRoadRoute : null,
              polylinePoints: inTrip ? activeRoute : (b.route.length > 2 ? b.route : const []),
              routeColor: inTrip ? const Color(0xFF1A73E8) : const Color(0xFF1E293B),
              focusDriver: inTrip && _navigationCentered,
              fitKey: _fitKey,
              mapPadding: EdgeInsets.only(
                top: inTrip ? 120 : 70,
                bottom: activeSheetHeight,
              ),
            ),
          ),

          // Top bar / HUD
          if (inTrip) ...[
            // Turn-by-Turn Navigation Dark Green Banner (#00594C)
            Positioned(
              top: 12,
              left: 12,
              right: 12,
              child: PointerInterceptor(
                child: SafeArea(
                  bottom: false,
                  child: Material(
                    elevation: 8,
                    borderRadius: BorderRadius.circular(16),
                    color: const Color(0xFF00594C),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Row(
                            children: [
                              Icon(
                                _maneuverIcon(currentNavStep.maneuver),
                                size: 40,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      currentNavStep.distanceMeters < 1000
                                          ? '${currentNavStep.distanceMeters} m'
                                          : '${(currentNavStep.distanceMeters / 1000).toStringAsFixed(1)} km',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: -0.5,
                                      ),
                                    ),
                                    Text(
                                      currentNavStep.instruction,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 17,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Then Strip
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          color: const Color(0xFF004339),
                          child: Row(
                            children: [
                              const Text(
                                'Then  ',
                                style: TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              Icon(
                                _maneuverIcon(nextNavStep.maneuver),
                                color: Colors.white,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  nextNavStep.instruction,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Right Floating Utility Buttons
            Positioned(
              right: 14,
              top: 135,
              child: PointerInterceptor(
                child: Column(
                  children: [
                    _NavCircularButton(
                      icon: Icons.explore,
                      iconColor: const Color(0xFFEA4335),
                      tooltip: 'Compass',
                      onPressed: () => setState(() => _fitKey++),
                    ),
                    const SizedBox(height: 10),
                    _NavCircularButton(
                      icon: Icons.search,
                      tooltip: 'Search along route',
                      onPressed: () {},
                    ),
                    const SizedBox(height: 10),
                    _NavCircularButton(
                      icon: _muted ? Icons.volume_off : Icons.volume_up,
                      tooltip: _muted ? 'Unmute' : 'Mute',
                      onPressed: () => setState(() => _muted = !_muted),
                    ),
                    const SizedBox(height: 10),
                    _NavCircularButton(
                      icon: Icons.layers,
                      tooltip: 'Route overview',
                      onPressed: () => setState(() {
                        _navigationCentered = !_navigationCentered;
                        _fitKey++;
                      }),
                    ),
                    const SizedBox(height: 10),
                    _NavCircularButton(
                      icon: Icons.alt_route,
                      tooltip: 'Alternative routes',
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),

            // Bottom-Left "Re-centre" Pill Button
            Positioned(
              left: 16,
              bottom: activeSheetHeight + 14,
              child: PointerInterceptor(
                child: Material(
                  elevation: 4,
                  borderRadius: BorderRadius.circular(24),
                  color: Colors.white,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () => setState(() {
                      _navigationCentered = true;
                      _fitKey++;
                    }),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Transform.rotate(
                            angle: -math.pi / 4,
                            child: const Icon(
                              Icons.navigation,
                              color: Color(0xFF00594C),
                              size: 18,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            'Re-centre',
                            style: TextStyle(
                              color: Color(0xFF00594C),
                              fontWeight: FontWeight.w700,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ] else ...[
            // Non-inTrip Top Bar
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: PointerInterceptor(
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
                            ),
                            child: const Icon(Icons.arrow_back, size: 20),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8)],
                          ),
                          child: Text('Ride #${b.reference}',
                              style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                        const Spacer(),
                        StatusBadge(status: b.status),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Recenter FAB
            Positioned(
              right: 16,
              bottom: activeSheetHeight + 14,
              child: PointerInterceptor(
                child: FloatingActionButton.small(
                  heroTag: 'tracking_recenter',
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary,
                  tooltip: 'Focus on Ride & Driver',
                  onPressed: () => setState(() => _fitKey++),
                  child: const Icon(Icons.gps_fixed),
                ),
              ),
            ),
          ],

          // ── Bottom Section ──
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: PointerInterceptor(
              child: inTrip && !_showDetailsSheet
                  ? // Collapsed Turn-by-Turn Bottom Bar
                  GestureDetector(
                      onTap: () => setState(() => _showDetailsSheet = true),
                      child: Container(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
                          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 16)],
                        ),
                        child: SafeArea(
                          top: false,
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 36,
                                  height: 4,
                                  margin: const EdgeInsets.only(bottom: 8),
                                  decoration: BoxDecoration(
                                    color: Colors.black26,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                                Row(
                                  children: [
                                    GestureDetector(
                                      onTap: () => Navigator.pop(context),
                                      child: Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.grey.shade100,
                                        ),
                                        child: const Icon(Icons.close, color: Colors.black87, size: 22),
                                      ),
                                    ),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            etaDurationStr,
                                            style: const TextStyle(
                                              fontSize: 22,
                                              fontWeight: FontWeight.w900,
                                              color: Colors.black87,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            subtitleNavStr,
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.black54,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    GestureDetector(
                                      onTap: () => setState(() => _showDetailsSheet = true),
                                      child: Container(
                                        width: 44,
                                        height: 44,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: Colors.grey.shade100,
                                        ),
                                        child: const Icon(
                                          Icons.auto_awesome,
                                          color: Color(0xFF1A73E8),
                                          size: 22,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    )
                  : // Full Ride / Driver Info Sheet
                  Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20)],
                      ),
                      child: SafeArea(
                        top: false,
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Handle / Close toggle
                              GestureDetector(
                                onTap: inTrip ? () => setState(() => _showDetailsSheet = false) : null,
                                child: Container(
                                  width: 40,
                                  height: 4,
                                  margin: const EdgeInsets.only(bottom: 16),
                                  decoration: BoxDecoration(
                                    color: AppColors.border,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ),
                              ),

                              // Status
                              Row(
                                children: [
                                  StatusBadge(status: b.status, large: true),
                                  if (inTrip) ...[
                                    const Spacer(),
                                    IconButton(
                                      icon: const Icon(Icons.keyboard_arrow_down, size: 28),
                                      tooltip: 'Collapse to Navigation',
                                      onPressed: () => setState(() => _showDetailsSheet = false),
                                    ),
                                  ],
                                ],
                              ),

                              if (approaching || inTrip) ...[
                                const SizedBox(height: 12),
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: AppColors.bg,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(inTrip ? Icons.navigation : Icons.directions_car,
                                          color: AppColors.primary, size: 22),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          inTrip ? 'Heading to your destination' : 'Driver is on the way to pickup',
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                        ),
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          if (etaText != null)
                                            Text(etaText,
                                                style: const TextStyle(
                                                    fontWeight: FontWeight.w900,
                                                    fontSize: 16,
                                                    color: AppColors.primary)),
                                          if (distKm != null)
                                            Text(
                                              distKm < 1 ? '${(distKm * 1000).round()} m away' : '${distKm.toStringAsFixed(1)} km away',
                                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 16),

                              // OTP
                              if (b.startOtp != null && (b.status == 'DRIVER_ARRIVED' || b.status == 'DRIVER_ASSIGNED')) ...[
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [AppColors.primary, AppColors.primaryDark],
                                    ),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Column(children: [
                                    const Text('Share with driver to start ride',
                                        style: TextStyle(color: Colors.white70, fontSize: 12)),
                                    const SizedBox(height: 6),
                                    Text(b.startOtp!,
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 36,
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 8)),
                                  ]),
                                ),
                                const SizedBox(height: 16),
                              ],

                              // Driver info
                              if (b.driver != null && b.driver!.name.isNotEmpty) ...[
                                Row(
                                  children: [
                                    const CircleAvatar(
                                      backgroundColor: AppColors.primaryLight,
                                      radius: 26,
                                      child: Icon(Icons.person, color: AppColors.primary, size: 28),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(b.driver!.name,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.w700, fontSize: 16)),
                                          Text(
                                              '${b.driver!.vehicleModel} • ${b.driver!.vehiclePlate}',
                                              style: const TextStyle(
                                                  fontSize: 13, color: AppColors.textSecondary)),
                                          if (b.driver!.rating.isNotEmpty)
                                            Row(children: [
                                              const Icon(Icons.star, size: 12, color: AppColors.warning),
                                              const SizedBox(width: 3),
                                              Text(b.driver!.rating,
                                                  style: const TextStyle(fontSize: 12)),
                                            ]),
                                        ],
                                      ),
                                    ),
                                    // Call button
                                    Container(
                                      width: 44,
                                      height: 44,
                                      decoration: BoxDecoration(
                                        color: AppColors.success.withOpacity(0.12),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Icon(Icons.call, color: AppColors.success, size: 20),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 16),
                              ],

                              // Fare info
                              Row(
                                children: [
                                  Expanded(
                                    child: _InfoTile(
                                      label: 'Category',
                                      value: b.categoryName ?? '-',
                                      icon: Icons.local_taxi,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _InfoTile(
                                      label: b.finalTotal != null ? 'Final Fare' : 'Est. Fare',
                                      value: '₹${b.finalTotal ?? b.estimatedTotal ?? '-'}',
                                      icon: Icons.receipt,
                                      highlight: b.finalTotal != null,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Actions
                              if (!b.isTerminal &&
                                  ['SEARCHING', 'SEARCHING_DRIVER', 'DRIVER_ASSIGNED'].contains(b.status))
                                OutlinedButton(
                                  onPressed: _cancelling ? null : _cancelBooking,
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                    side: const BorderSide(color: AppColors.error),
                                    minimumSize: const Size(double.infinity, 48),
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: _cancelling
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2, color: AppColors.error))
                                      : const Text('Cancel Ride'),
                                ),

                              if (b.isTerminal)
                                ElevatedButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Done'),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavCircularButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final Color iconColor;
  final String tooltip;

  const _NavCircularButton({
    required this.icon,
    required this.onPressed,
    this.iconColor = const Color(0xFF3C4043),
    this.tooltip = '',
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2)),
        ],
      ),
      child: IconButton(
        icon: Icon(icon, color: iconColor, size: 22),
        tooltip: tooltip,
        onPressed: onPressed,
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool highlight;

  const _InfoTile({
    required this.label,
    required this.value,
    required this.icon,
    this.highlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: highlight ? AppColors.primaryLight : AppColors.bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: highlight ? AppColors.primary.withOpacity(0.3) : AppColors.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: highlight ? AppColors.primary : AppColors.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                Text(value,
                    style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: highlight ? AppColors.primary : AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
