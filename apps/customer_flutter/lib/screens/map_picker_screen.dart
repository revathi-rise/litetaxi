import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';
import '../core/api_client.dart';
import '../core/theme.dart';

class MapPickerScreen extends StatefulWidget {
  final LatLng? initialPosition;
  final bool isPickup;
  final String? initialTitle;

  const MapPickerScreen({
    super.key,
    this.initialPosition,
    this.isPickup = true,
    this.initialTitle,
  });

  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
  late LatLng _currentCenter;
  bool _isPickup = true;

  // Resolved address
  String _placeName = 'Locating...';
  String _placeAddress = 'Move pin or tap anywhere on the map';
  String? _placeType;
  bool _isLoading = false;
  Timer? _debounceTimer;

  // Search in map
  final TextEditingController _searchCtrl = TextEditingController();
  List<PlacePrediction> _searchResults = [];
  bool _isSearching = false;
  bool _showSearchResults = false;

  late AnimationController _pinAnimCtrl;
  late Animation<double> _pinAnim;

  @override
  void initState() {
    super.initState();
    _isPickup = widget.isPickup;
    _currentCenter = widget.initialPosition ?? const LatLng(11.0168, 76.9558); // Coimbatore default

    _pinAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _pinAnim = Tween<double>(begin: 0, end: -12).animate(
      CurvedAnimation(parent: _pinAnimCtrl, curve: Curves.easeOut),
    );

    if (widget.initialTitle != null && widget.initialTitle!.isNotEmpty) {
      _placeName = widget.initialTitle!;
    }

    _reverseGeocodeCenter();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _pinAnimCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onCameraMove(CameraPosition position) {
    _currentCenter = position.target;
    if (!_pinAnimCtrl.isAnimating && _pinAnimCtrl.value == 0) {
      _pinAnimCtrl.forward();
    }
  }

  void _onCameraIdle() {
    _pinAnimCtrl.reverse();
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 350), () {
      _reverseGeocodeCenter();
    });
  }

  Future<void> _reverseGeocodeCenter() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final res = await ApiClient().reverseGeocode(_currentCenter.latitude, _currentCenter.longitude);
      if (mounted && res != null) {
        setState(() {
          _placeName = res['name']?.toString() ?? 'Selected Village / Place';
          _placeAddress = res['address']?.toString() ??
              '${_currentCenter.latitude.toStringAsFixed(4)}, ${_currentCenter.longitude.toStringAsFixed(4)}';
          _placeType = res['type']?.toString();
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _placeName = 'Pinned Location';
          _placeAddress = '${_currentCenter.latitude.toStringAsFixed(5)}, ${_currentCenter.longitude.toStringAsFixed(5)}';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _goToMyLocation() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission denied')),
          );
        }
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      final target = LatLng(pos.latitude, pos.longitude);
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 16));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not get GPS location: $e')),
        );
      }
    }
  }

  void _onSearchChanged(String text) async {
    final q = text.trim();
    if (q.length < 2) {
      setState(() {
        _searchResults = [];
        _showSearchResults = false;
      });
      return;
    }

    setState(() => _isSearching = true);
    final results = await ApiClient().searchPlaces(
      q,
      lat: _currentCenter.latitude,
      lng: _currentCenter.longitude,
    );
    if (mounted) {
      setState(() {
        _searchResults = results;
        _isSearching = false;
        _showSearchResults = true;
      });
    }
  }

  void _selectSearchResult(PlacePrediction p) async {
    _searchCtrl.clear();
    FocusScope.of(context).unfocus();
    setState(() {
      _showSearchResults = false;
      _placeName = p.mainText;
      _placeAddress = p.secondaryText;
      _placeType = p.type;
    });

    if (p.lat != null && p.lng != null) {
      final target = LatLng(p.lat!, p.lng!);
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 16));
    } else {
      // Resolve coordinates from placeId
      final detail = await ApiClient().getPlaceDetail(p.placeId);
      if (detail != null && mounted) {
        final target = LatLng(detail.lat, detail.lng);
        _mapController?.animateCamera(CameraUpdate.newLatLngZoom(target, 16));
        setState(() {
          if (detail.name.isNotEmpty) _placeName = detail.name;
          if (detail.address.isNotEmpty) _placeAddress = detail.address;
        });
      }
    }
  }

  void _confirmSelection() {
    final prediction = PlacePrediction(
      placeId: 'picked_${DateTime.now().millisecondsSinceEpoch}',
      mainText: _placeName,
      secondaryText: _placeAddress,
      lat: _currentCenter.latitude,
      lng: _currentCenter.longitude,
      type: _placeType,
    );

    Navigator.of(context).pop({
      'place': prediction,
      'isPickup': _isPickup,
    });
  }

  @override
  Widget build(BuildContext context) {
    final pinColor = _isPickup ? AppColors.success : AppColors.primary;

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          // ── Google Map ───────────────────────────────────────────────────
          GoogleMap(
            initialCameraPosition: CameraPosition(target: _currentCenter, zoom: 15),
            myLocationEnabled: true,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            onMapCreated: (c) => _mapController = c,
            onCameraMove: _onCameraMove,
            onCameraIdle: _onCameraIdle,
            onTap: (point) {
              _mapController?.animateCamera(CameraUpdate.newLatLng(point));
            },
          ),

          // ── Center Pin with Animation ─────────────────────────────────────
          Center(
            child: AnimatedBuilder(
              animation: _pinAnim,
              builder: (context, child) {
                return Transform.translate(
                  offset: Offset(0, _pinAnim.value - 22),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black87,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 6)],
                        ),
                        child: Text(
                          _isPickup ? 'Pick here' : 'Drop here',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 3),
                      Icon(
                        Icons.location_on,
                        size: 44,
                        color: pinColor,
                      ),
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: Colors.black38,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.3),
                              blurRadius: 4,
                              spreadRadius: 1,
                            )
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          // ── Top Bar & Search Box ──────────────────────────────────────────
          SafeArea(
            child: PointerInterceptor(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 12,
                          offset: const Offset(0, 3),
                        )
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.arrow_back),
                              onPressed: () => Navigator.of(context).pop(),
                            ),
                            Expanded(
                              child: TextField(
                                controller: _searchCtrl,
                                onChanged: _onSearchChanged,
                                decoration: InputDecoration(
                                  hintText: 'Search village, town, or road...',
                                  hintStyle: const TextStyle(fontSize: 14, color: AppColors.textMuted),
                                  border: InputBorder.none,
                                  isDense: true,
                                  suffixIcon: _searchCtrl.text.isNotEmpty
                                      ? IconButton(
                                          icon: const Icon(Icons.clear, size: 18),
                                          onPressed: () {
                                            _searchCtrl.clear();
                                            setState(() => _showSearchResults = false);
                                          },
                                        )
                                      : (_isSearching
                                          ? const Padding(
                                              padding: EdgeInsets.all(12),
                                              child: SizedBox(
                                                width: 16,
                                                height: 16,
                                                child: CircularProgressIndicator(strokeWidth: 2),
                                              ),
                                            )
                                          : const Icon(Icons.search, color: AppColors.textMuted)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        // Pickup / Drop-off Mode Switcher
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
                          child: Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _isPickup = true),
                                  borderRadius: BorderRadius.circular(8),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 6),
                                    decoration: BoxDecoration(
                                      color: _isPickup ? AppColors.success.withOpacity(0.12) : AppColors.bg,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: _isPickup ? AppColors.success : AppColors.border,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.radio_button_checked,
                                            size: 14,
                                            color: _isPickup ? AppColors.success : AppColors.textMuted),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Set Pickup',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: _isPickup ? AppColors.success : AppColors.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() => _isPickup = false),
                                  borderRadius: BorderRadius.circular(8),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 6),
                                    decoration: BoxDecoration(
                                      color: !_isPickup ? AppColors.primary.withOpacity(0.12) : AppColors.bg,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: !_isPickup ? AppColors.primary : AppColors.border,
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.location_on,
                                            size: 14,
                                            color: !_isPickup ? AppColors.primary : AppColors.textMuted),
                                        const SizedBox(width: 6),
                                        Text(
                                          'Set Drop-off',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: !_isPickup ? AppColors.primary : AppColors.textSecondary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Search Results Dropdown List
                  if (_showSearchResults && _searchResults.isNotEmpty)
                    PointerInterceptor(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                        constraints: const BoxConstraints(maxHeight: 260),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 12, offset: Offset(0, 4))],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shrinkWrap: true,
                            itemCount: _searchResults.length,
                            separatorBuilder: (_, __) => const Divider(height: 1),
                            itemBuilder: (context, i) {
                              final p = _searchResults[i];
                              final isVillage = p.type == 'village' || p.type == 'hamlet';
                              return ListTile(
                                dense: true,
                                leading: Icon(
                                  isVillage ? Icons.holiday_village : Icons.location_on,
                                  color: isVillage ? AppColors.accent : AppColors.primary,
                                  size: 20,
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(p.mainText, style: const TextStyle(fontWeight: FontWeight.w600)),
                                    ),
                                    if (isVillage)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.accent.withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: const Text('Village',
                                            style: TextStyle(fontSize: 10, color: AppColors.accent, fontWeight: FontWeight.bold)),
                                      ),
                                  ],
                                ),
                                subtitle: Text(p.secondaryText, maxLines: 1, overflow: TextOverflow.ellipsis),
                                onTap: () => _selectSearchResult(p),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // ── GPS Current Location FAB ─────────────────────────────────────
          Positioned(
            right: 16,
            bottom: 230,
            child: PointerInterceptor(
              child: FloatingActionButton.small(
                heroTag: 'map_picker_gps',
                backgroundColor: Colors.white,
                foregroundColor: AppColors.primary,
                tooltip: 'Move to My Current Location',
                onPressed: _goToMyLocation,
                child: const Icon(Icons.my_location),
              ),
            ),
          ),

          // ── Bottom Confirmation Sheet ────────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: PointerInterceptor(
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 20,
                      offset: const Offset(0, -4),
                    )
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: pinColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _isPickup ? Icons.radio_button_checked : Icons.location_on,
                                  size: 12,
                                  color: pinColor,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _isPickup ? 'PICKUP LOCATION' : 'DROP-OFF LOCATION',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: pinColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (_placeType != null) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.bg,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Text(
                                _placeType!.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                          const Spacer(),
                          if (_isLoading)
                            const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        _placeName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _placeAddress,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '📍 ${_currentCenter.latitude.toStringAsFixed(5)}° N, ${_currentCenter.longitude.toStringAsFixed(5)}° E',
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textMuted,
                          fontFamily: 'monospace',
                        ),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _confirmSelection,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: pinColor,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            _isPickup ? 'Confirm Pickup Location' : 'Confirm Drop-off Location',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
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
}
