import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../core/api_client.dart';
import '../core/models.dart';
import '../core/theme.dart';
import 'map_picker_screen.dart';

class PlanRideResult {
  final PlacePrediction pickup;
  final PlacePrediction dropoff;

  PlanRideResult({required this.pickup, required this.dropoff});
}

class PlanRideScreen extends StatefulWidget {
  final PlacePrediction? initialPickup;
  final PlacePrediction? initialDropoff;
  final LatLng? initialPosition;
  final bool focusDropoff;

  const PlanRideScreen({
    super.key,
    this.initialPickup,
    this.initialDropoff,
    this.initialPosition,
    this.focusDropoff = true,
  });

  @override
  State<PlanRideScreen> createState() => _PlanRideScreenState();
}

class _PlanRideScreenState extends State<PlanRideScreen> {
  late TextEditingController _pickupCtrl;
  late TextEditingController _dropoffCtrl;
  late FocusNode _pickupFocus;
  late FocusNode _dropoffFocus;

  PlacePrediction? _currentPickup;
  PlacePrediction? _currentDropoff;

  bool _isSearchingPickup = false;
  List<PlacePrediction> _predictions = [];
  bool _isLoading = false;
  Timer? _debounce;
  final Set<String> _favorites = {};

  @override
  void initState() {
    super.initState();
    _currentPickup = widget.initialPickup ??
        PlacePrediction(
          placeId: 'cbe_odayakulam',
          mainText: 'Odayakulam (Pollachi)',
          secondaryText: 'Odayakulam Town Panchayat, Pollachi, Coimbatore, Tamil Nadu',
          lat: widget.initialPosition?.latitude ?? 10.5931,
          lng: widget.initialPosition?.longitude ?? 76.9058,
        );

    _currentDropoff = widget.initialDropoff;

    _pickupCtrl = TextEditingController(text: _currentPickup?.mainText ?? '');
    _dropoffCtrl = TextEditingController(text: _currentDropoff?.mainText ?? '');

    _pickupFocus = FocusNode();
    _dropoffFocus = FocusNode();

    _isSearchingPickup = !widget.focusDropoff;

    _pickupFocus.addListener(() {
      if (_pickupFocus.hasFocus) {
        setState(() => _isSearchingPickup = true);
        _onSearchQueryChanged(_pickupCtrl.text);
      }
    });

    _dropoffFocus.addListener(() {
      if (_dropoffFocus.hasFocus) {
        setState(() => _isSearchingPickup = false);
        _onSearchQueryChanged(_dropoffCtrl.text);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.focusDropoff) {
        _dropoffFocus.requestFocus();
      } else {
        _pickupFocus.requestFocus();
      }
      _onSearchQueryChanged(widget.focusDropoff ? _dropoffCtrl.text : _pickupCtrl.text);
    });
  }

  @override
  void dispose() {
    _pickupCtrl.dispose();
    _dropoffCtrl.dispose();
    _pickupFocus.dispose();
    _dropoffFocus.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onSearchQueryChanged(String query) {
    _debounce?.cancel();
    final q = query.trim();
    if (q.isEmpty) {
      setState(() {
        _predictions = _getRecentOrPresets();
        _isLoading = false;
      });
      return;
    }

    setState(() => _isLoading = true);
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      final results = await ApiClient().searchPlaces(
        q,
        lat: widget.initialPosition?.latitude ?? 10.5931,
        lng: widget.initialPosition?.longitude ?? 76.9058,
      );

      if (mounted) {
        setState(() {
          _predictions = results;
          _isLoading = false;
        });
      }
    });
  }

  List<PlacePrediction> _getRecentOrPresets() {
    final list = <PlacePrediction>[];
    // Always provide 1-tap Odayakulam (Pollachi) at the top of presets
    list.add(
      PlacePrediction(
        placeId: 'cbe_odayakulam',
        mainText: '📍 Odayakulam (Pollachi)',
        secondaryText: 'Odayakulam Town Panchayat, Pollachi, Coimbatore, Tamil Nadu',
        lat: 10.5931,
        lng: 76.9058,
      ),
    );
    list.addAll(kPresetPlaces.where((p) => p['name'] != 'Odayakulam (Pollachi)').map((p) {
      return PlacePrediction(
        placeId: 'preset_${p['name']}',
        mainText: p['name'] as String,
        secondaryText: p['address'] as String,
        lat: (p['lat'] as num?)?.toDouble(),
        lng: (p['lng'] as num?)?.toDouble(),
      );
    }));
    return list;
  }

  void _swapLocations() {
    setState(() {
      final tempPlace = _currentPickup;
      _currentPickup = _currentDropoff;
      _currentDropoff = tempPlace;

      _pickupCtrl.text = _currentPickup?.mainText ?? '';
      _dropoffCtrl.text = _currentDropoff?.mainText ?? '';
    });
  }

  Future<void> _selectPlace(PlacePrediction place) async {
    PlacePrediction resolved = place;
    if (resolved.lat == null || resolved.lng == null) {
      final detail = await ApiClient().getPlaceDetail(resolved.placeId);
      if (detail != null) {
        resolved = PlacePrediction(
          placeId: resolved.placeId,
          mainText: detail.name.isNotEmpty ? detail.name : resolved.mainText,
          secondaryText: detail.address.isNotEmpty ? detail.address : resolved.secondaryText,
          lat: detail.lat,
          lng: detail.lng,
        );
      }
    }

    if (_isSearchingPickup) {
      setState(() {
        _currentPickup = resolved;
        _pickupCtrl.text = resolved.mainText;
      });
      // Move to dropoff
      if (_currentDropoff == null) {
        _dropoffFocus.requestFocus();
      } else {
        _finishAndReturn();
      }
    } else {
      setState(() {
        _currentDropoff = resolved;
        _dropoffCtrl.text = resolved.mainText;
      });

      if (_currentPickup == null) {
        _pickupFocus.requestFocus();
      } else {
        _finishAndReturn();
      }
    }
  }

  void _finishAndReturn() {
    if (_currentPickup != null && _currentDropoff != null) {
      Navigator.of(context).pop(PlanRideResult(
        pickup: _currentPickup!,
        dropoff: _currentDropoff!,
      ));
    }
  }

  Future<void> _openMapPicker() async {
    final isPickup = _isSearchingPickup;
    final initialPos = isPickup
        ? (_currentPickup?.lat != null
            ? LatLng(_currentPickup!.lat!, _currentPickup!.lng!)
            : widget.initialPosition)
        : (_currentDropoff?.lat != null
            ? LatLng(_currentDropoff!.lat!, _currentDropoff!.lng!)
            : widget.initialPosition);

    final res = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => MapPickerScreen(
          isPickup: isPickup,
          initialPosition: initialPos,
          initialTitle: isPickup ? _currentPickup?.mainText : _currentDropoff?.mainText,
        ),
      ),
    );

    if (res != null && res['place'] is PlacePrediction) {
      _selectPlace(res['place'] as PlacePrediction);
    }
  }

  void _toggleFavorite(String placeId) {
    setState(() {
      if (_favorites.contains(placeId)) {
        _favorites.remove(placeId);
      } else {
        _favorites.add(placeId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.black87, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Plan your ride',
          style: TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // ─── Dual Input Box (RedTaxi styled) ───────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9), // Subtle light blue-gray
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Vertical connector: Green circle -> Line -> Red circle
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            decoration: const BoxDecoration(
                              color: Color(0xFF10B981),
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: CircleAvatar(radius: 2.5, backgroundColor: Colors.white),
                            ),
                          ),
                          Container(
                            width: 1.5,
                            height: 36,
                            color: const Color(0xFF94A3B8),
                          ),
                          Container(
                            width: 14,
                            height: 14,
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Center(
                              child: CircleAvatar(radius: 2.5, backgroundColor: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 12),

                      // Text input fields
                      Expanded(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Pickup Field
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _pickupCtrl,
                                    focusNode: _pickupFocus,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                    decoration: const InputDecoration(
                                      hintText: 'Pickup location',
                                      hintStyle: TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontWeight: FontWeight.w400,
                                        fontSize: 15,
                                      ),
                                      border: InputBorder.none,
                                      isDense: true,
                                      contentPadding: EdgeInsets.symmetric(vertical: 4),
                                    ),
                                    onChanged: (val) {
                                      if (_isSearchingPickup) _onSearchQueryChanged(val);
                                    },
                                  ),
                                ),
                                if (_pickupCtrl.text.isNotEmpty)
                                  GestureDetector(
                                    onTap: () {
                                      _pickupCtrl.clear();
                                      _currentPickup = null;
                                      _onSearchQueryChanged('');
                                    },
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 4),
                                      child: Icon(Icons.cancel, color: Color(0xFF94A3B8), size: 18),
                                    ),
                                  ),
                              ],
                            ),
                            const Divider(height: 16, thickness: 1, color: Color(0xFFE2E8F0)),

                            // Dropoff Field
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _dropoffCtrl,
                                    focusNode: _dropoffFocus,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                    decoration: const InputDecoration(
                                      hintText: 'Where do you want to go?',
                                      hintStyle: TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontWeight: FontWeight.w400,
                                        fontSize: 15,
                                      ),
                                      border: InputBorder.none,
                                      isDense: true,
                                      contentPadding: EdgeInsets.symmetric(vertical: 4),
                                    ),
                                    onChanged: (val) {
                                      if (!_isSearchingPickup) _onSearchQueryChanged(val);
                                    },
                                  ),
                                ),
                                if (_dropoffCtrl.text.isNotEmpty)
                                  GestureDetector(
                                    onTap: () {
                                      _dropoffCtrl.clear();
                                      _currentDropoff = null;
                                      _onSearchQueryChanged('');
                                    },
                                    child: const Padding(
                                      padding: EdgeInsets.symmetric(horizontal: 4),
                                      child: Icon(Icons.cancel, color: Color(0xFF94A3B8), size: 18),
                                    ),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 8),

                      // Side Actions: Add stop (+) & Swap locations (⇅)
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline, color: Color(0xFF64748B), size: 22),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            tooltip: 'Add Stop',
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Multi-stop feature coming soon')),
                              );
                            },
                          ),
                          const SizedBox(height: 16),
                          IconButton(
                            icon: const Icon(Icons.swap_vert, color: Color(0xFF64748B), size: 22),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            tooltip: 'Swap locations',
                            onPressed: _swapLocations,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              if (_isLoading)
                const LinearProgressIndicator(
                  backgroundColor: Colors.transparent,
                  color: AppColors.primary,
                  minHeight: 2,
                ),

              // ─── Search Results List ───────────────────────────────────────
              Expanded(
                child: _predictions.isEmpty && !_isLoading
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.location_off_outlined, size: 48, color: Color(0xFF94A3B8)),
                              const SizedBox(height: 12),
                              const Text(
                                'No location found',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Try another search term or pick directly on the map.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 80),
                        itemCount: _predictions.length,
                        separatorBuilder: (_, __) => const Divider(
                          height: 1,
                          thickness: 0.8,
                          color: Color(0xFFF1F5F9),
                          indent: 36,
                        ),
                        itemBuilder: (ctx, i) {
                          final p = _predictions[i];
                          final isFav = _favorites.contains(p.placeId);
                          return InkWell(
                            onTap: () => _selectPlace(p),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  const Icon(
                                    Icons.location_on_outlined,
                                    color: Colors.black87,
                                    size: 22,
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          p.mainText,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 15,
                                            color: Colors.black87,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        if (p.secondaryText.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            p.secondaryText,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFF64748B),
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: Icon(
                                      isFav ? Icons.favorite : Icons.favorite_border,
                                      color: isFav ? AppColors.primary : const Color(0xFF94A3B8),
                                      size: 20,
                                    ),
                                    onPressed: () => _toggleFavorite(p.placeId),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),

          // ─── Floating "Select on Map" Button at Bottom Center ─────────────
          Positioned(
            bottom: 24,
            left: 0,
            right: 0,
            child: Center(
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                elevation: 4,
                shadowColor: Colors.black.withOpacity(0.18),
                child: InkWell(
                  onTap: _openMapPicker,
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: const [
                        Icon(
                          Icons.map_outlined,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Select on Map',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
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

