import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../core/theme.dart';
import 'car_icon.dart';

class RouteMap extends StatefulWidget {
  final LatLng? pickup;
  final LatLng? dropoff;
  final List<List<double>> polylinePoints; // [[lat,lng],...]
  final LatLng? driverLocation;
  final double driverHeading;
  final bool showMyLocation;
  final void Function(LatLng)? onTap;

  /// Dotted/road line drawn from the driver to this point (e.g. pickup while driver is approaching).
  final LatLng? approachTo;
  final List<List<double>>? approachRoute;

  /// Change this value to make the camera re-fit all points (pickup, dropoff, driver).
  final int fitKey;
  final EdgeInsets mapPadding;

  /// Optional floating labels shown above the pickup / drop-off pins.
  final String? pickupLabel;
  final String? dropoffLabel;

  /// Route line colour (defaults to brand red).
  final Color? routeColor;

  /// Show Google's built-in zoom +/- controls.
  final bool zoomControls;

  /// Show Google's built-in my-location button (requires [showMyLocation]).
  final bool myLocationButton;

  /// In navigation mode, centers and tilts camera following the driver.
  final bool focusDriver;

  const RouteMap({
    super.key,
    this.pickup,
    this.dropoff,
    this.polylinePoints = const [],
    this.driverLocation,
    this.driverHeading = 0,
    this.showMyLocation = false,
    this.onTap,
    this.approachTo,
    this.approachRoute,
    this.fitKey = 0,
    this.mapPadding = EdgeInsets.zero,
    this.pickupLabel,
    this.dropoffLabel,
    this.routeColor,
    this.zoomControls = true,
    this.myLocationButton = true,
    this.focusDriver = false,
  });

  @override
  State<RouteMap> createState() => _RouteMapState();
}

class _RouteMapState extends State<RouteMap> {
  GoogleMapController? _controller;
  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  Offset? _pickupPx;
  Offset? _dropPx;

  Future<Offset?> _toLogical(LatLng? p) async {
    if (p == null || _controller == null || !mounted) return null;
    final dpr = defaultTargetPlatform == TargetPlatform.android
        ? MediaQuery.of(context).devicePixelRatio
        : 1.0;
    try {
      final sc = await _controller!.getScreenCoordinate(p);
      return Offset(sc.x / dpr, sc.y / dpr);
    } catch (_) {
      return null;
    }
  }

  Future<void> _updateLabelPositions() async {
    if (widget.pickupLabel == null && widget.dropoffLabel == null) return;
    final a = await _toLogical(widget.pickup);
    final b = await _toLogical(widget.dropoff);
    if (!mounted) return;
    setState(() {
      _pickupPx = a;
      _dropPx = b;
    });
  }

  @override
  void didUpdateWidget(RouteMap old) {
    super.didUpdateWidget(old);
    _rebuild();
    if (old.pickup != widget.pickup || old.dropoff != widget.dropoff || old.fitKey != widget.fitKey) {
      _fitBounds();
    }
  }

  @override
  void initState() {
    super.initState();
    CarIcons.load().then((_) {
      if (mounted) _rebuild();
    });
    _rebuild();
  }

  void _rebuild() {
    final markers = <Marker>{};
    final polylines = <Polyline>{};

    if (widget.pickup != null) {
      markers.add(Marker(
        markerId: const MarkerId('pickup'),
        position: widget.pickup!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: const InfoWindow(title: 'Pickup'),
      ));
    }
    if (widget.dropoff != null) {
      markers.add(Marker(
        markerId: const MarkerId('dropoff'),
        position: widget.dropoff!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: const InfoWindow(title: 'Drop-off'),
      ));
    }
    if (widget.driverLocation != null) {
      markers.add(Marker(
        markerId: const MarkerId('driver'),
        position: widget.driverLocation!,
        icon: CarIcons.forHeading(widget.driverHeading) ??
            BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueYellow),
        anchor: const Offset(0.5, 0.5),
        flat: true,
        zIndex: 10,
        infoWindow: const InfoWindow(title: 'Driver'),
      ));
    }

    // Approach route: when driver is coming for pickup along real roads
    if (widget.approachRoute != null && widget.approachRoute!.isNotEmpty) {
      final pts = widget.approachRoute!
          .where((p) => p.length >= 2)
          .map((p) {
            final a = p[0];
            final b = p[1];
            final lat = (a > 50 && b < 40) ? b : a;
            final lng = (a > 50 && b < 40) ? a : b;
            return LatLng(lat, lng);
          })
          .where((ll) => ll.latitude >= 8 && ll.latitude <= 38 && ll.longitude >= 68 && ll.longitude <= 98)
          .toList();
      if (pts.length >= 2) {
        polylines.add(Polyline(
          polylineId: const PolylineId('approach_route'),
          points: pts,
          color: const Color(0xFF2563EB),
          width: 4,
          zIndex: 3,
        ));
      }
    }

    // Main ride route: RedTaxi clean turn-by-turn road polyline
    if (widget.polylinePoints.isNotEmpty) {
      final pts = widget.polylinePoints
          .where((p) => p.length >= 2)
          .map((p) {
            final a = p[0];
            final b = p[1];
            final lat = (a > 50 && b < 40) ? b : a;
            final lng = (a > 50 && b < 40) ? a : b;
            return LatLng(lat, lng);
          })
          .where((ll) => ll.latitude >= 8 && ll.latitude <= 38 && ll.longitude >= 68 && ll.longitude <= 98)
          .toList();
      if (pts.length >= 2) {
        final coreColor = widget.routeColor ?? const Color(0xFF1E293B);
        polylines.add(Polyline(
          polylineId: const PolylineId('route_core'),
          points: pts,
          color: coreColor,
          width: 5,
          zIndex: 5,
        ));
      }
    }

    setState(() {
      _markers
        ..clear()
        ..addAll(markers);
      _polylines
        ..clear()
        ..addAll(polylines);
    });
  }

  void _fitBounds() async {
    if (_controller == null) return;
    if (widget.focusDriver && widget.driverLocation != null) {
      await _controller!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(
            target: widget.driverLocation!,
            zoom: 16.5,
            tilt: 35.0,
            bearing: widget.driverHeading,
          ),
        ),
      );
      _updateLabelPositions();
      return;
    }
    final points = <LatLng>[
      if (widget.pickup != null) widget.pickup!,
      if (widget.dropoff != null) widget.dropoff!,
      if (widget.driverLocation != null) widget.driverLocation!,
    ];
    if (points.length < 2) {
      if (points.length == 1) {
        _controller!.animateCamera(
          CameraUpdate.newLatLngZoom(points.first, 14),
        );
      }
      return;
    }
    double minLat = points.map((p) => p.latitude).reduce((a, b) => a < b ? a : b);
    double maxLat = points.map((p) => p.latitude).reduce((a, b) => a > b ? a : b);
    double minLng = points.map((p) => p.longitude).reduce((a, b) => a < b ? a : b);
    double maxLng = points.map((p) => p.longitude).reduce((a, b) => a > b ? a : b);
    await _controller!.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(minLat - 0.01, minLng - 0.01),
          northeast: LatLng(maxLat + 0.01, maxLng + 0.01),
        ),
        80,
      ),
    );
    _updateLabelPositions();
  }

  @override
  Widget build(BuildContext context) {
    final initialTarget = widget.pickup ??
        widget.dropoff ??
        widget.driverLocation ??
        const LatLng(11.0168, 76.9558); // Coimbatore default

    final map = GoogleMap(
      initialCameraPosition: CameraPosition(target: initialTarget, zoom: 13),
      markers: _markers,
      polylines: _polylines,
      myLocationEnabled: widget.showMyLocation,
      myLocationButtonEnabled: widget.showMyLocation && widget.myLocationButton,
      mapToolbarEnabled: false,
      zoomControlsEnabled: widget.zoomControls,
      onTap: widget.onTap,
      padding: widget.mapPadding,
      onCameraMove: (_) => _updateLabelPositions(),
      onCameraIdle: _updateLabelPositions,
      onMapCreated: (c) {
        _controller = c;
        _fitBounds();
      },
    );

    if (widget.pickupLabel == null && widget.dropoffLabel == null) return map;

    return Stack(
      children: [
        Positioned.fill(child: map),
        if (_pickupPx != null && widget.pickupLabel != null)
          _pinLabel(_pickupPx!, widget.pickupLabel!),
        if (_dropPx != null && widget.dropoffLabel != null)
          _pinLabel(_dropPx!, widget.dropoffLabel!),
      ],
    );
  }

  /// White rounded label with a black chevron badge, floating above a pin.
  Widget _pinLabel(Offset at, String text) {
    return Positioned(
      left: at.dx,
      top: at.dy - 44,
      child: FractionalTranslation(
        translation: const Offset(-0.5, -1),
        child: IgnorePointer(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 190),
            padding: const EdgeInsets.fromLTRB(10, 6, 6, 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.25),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Flexible(
                  child: Text(
                    text,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  width: 16,
                  height: 16,
                  decoration: const BoxDecoration(
                      color: Colors.black, shape: BoxShape.circle),
                  child: const Icon(Icons.chevron_right,
                      size: 13, color: Colors.white),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
