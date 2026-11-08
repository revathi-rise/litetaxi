import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';
import 'models.dart';

class ApiClient {
  static const _kBaseUrl = 'BASE_URL';
  static const _kAccessToken = 'ACCESS_TOKEN';
  static const _kRefreshToken = 'REFRESH_TOKEN';

  String _baseUrl = AppConfig.apiBaseUrl;
  String? _accessToken;
  String? _refreshToken;

  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;
  ApiClient._();

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString(_kBaseUrl) ?? _baseUrl;
    _accessToken = prefs.getString(_kAccessToken);
    _refreshToken = prefs.getString(_kRefreshToken);
  }

  String get baseUrl => _baseUrl;
  bool get isLoggedIn => _accessToken != null;

  Future<void> setBaseUrl(String url) async {
    _baseUrl = url.replaceAll(RegExp(r'/+$'), '');
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kBaseUrl, _baseUrl);
  }

  Future<void> setTokens(String access, String refresh) async {
    _accessToken = access;
    _refreshToken = refresh;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kAccessToken, access);
    await prefs.setString(_kRefreshToken, refresh);
  }

  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kAccessToken);
    await prefs.remove(_kRefreshToken);
  }

  Map<String, String> _headers({bool auth = true}) {
    final h = <String, String>{'Content-Type': 'application/json'};
    if (auth && _accessToken != null) h['Authorization'] = 'Bearer $_accessToken';
    return h;
  }

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
    bool retry = true,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    http.Response res;

    Future<http.Response> doRequest() async {
      switch (method) {
        case 'GET':
          return http.get(uri, headers: _headers(auth: auth));
        case 'POST':
          return http.post(uri,
              headers: _headers(auth: auth), body: jsonEncode(body ?? {}));
        case 'PUT':
          return http.put(uri,
              headers: _headers(auth: auth), body: jsonEncode(body ?? {}));
        default:
          throw Exception('Unsupported method: $method');
      }
    }

    res = await doRequest();

    if (res.statusCode == 401 && retry && _refreshToken != null) {
      final refreshed = await _doRefresh();
      if (refreshed) res = await doRequest();
    }

    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg = data is Map
          ? (data['message'] ?? data['error'] ?? 'Request failed')
          : 'Request failed';
      throw ApiException(
        message: msg is List ? msg.join('; ') : msg.toString(),
        statusCode: res.statusCode,
        code: data is Map ? data['code'] : null,
      );
    }
    return data;
  }

  Future<bool> _doRefresh() async {
    if (_refreshToken == null) return false;
    try {
      final res = await http.post(
        Uri.parse('$_baseUrl/api/v1/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': _refreshToken}),
      );
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        await setTokens(data['accessToken'], data['refreshToken']);
        return true;
      }
    } catch (_) {}
    await clearTokens();
    return false;
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> sendOtp(String phone) async =>
      await _request('POST', '/api/v1/auth/send-otp',
          body: {'phone': phone}, auth: false);

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    final res = await _request('POST', '/api/v1/auth/verify-otp',
        body: {'phone': phone, 'otp': otp, 'role': 'customer'}, auth: false);
    await setTokens(res['accessToken'], res['refreshToken']);
    return res;
  }

  Future<void> logout() async {
    if (_refreshToken != null) {
      try {
        await _request('POST', '/api/v1/auth/logout',
            body: {'refreshToken': _refreshToken});
      } catch (_) {}
    }
    await clearTokens();
  }

  Future<Map<String, dynamic>> getMe() async =>
      await _request('GET', '/api/v1/auth/me');

  // ─── Google Places & Location Search ──────────────────────────────────────

  Future<List<PlacePrediction>> searchPlaces(String query,
      {double? lat, double? lng}) async {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return [];

    String norm(String s) => s
        .toLowerCase()
        .replaceAll('echanari', 'eachanari')
        .replaceAll('ukadam', 'ukkadam')
        .replaceAll('rspuram', 'rs puram')
        .replaceAll('sundarampuram', 'sundarapuram');

    final qNorm = norm(q);

    // 1. Instant local matches from preset places
    final localMatches = kPresetPlaces
        .where((p) {
          final name = p['name'].toString().toLowerCase();
          final addr = p['address'].toString().toLowerCase();
          final fullNorm = norm('$name $addr');
          return name.contains(q) ||
              addr.contains(q) ||
              fullNorm.contains(qNorm) ||
              fullNorm.contains(q);
        })
        .map((p) => PlacePrediction(
              placeId: 'preset_${p['name']}',
              mainText: p['name'] as String,
              secondaryText: p['address'] as String,
              lat: (p['lat'] as num).toDouble(),
              lng: (p['lng'] as num).toDouble(),
              type: 'preset',
            ))
        .toList();

    final results = <PlacePrediction>[...localMatches];
    final seenNames = results.map((l) => l.mainText.toLowerCase().trim()).toSet();

    // 2. Query Google Places API (New & Legacy endpoints)
    final gKey = AppConfig.googleMapsApiKey;
    if (gKey.isNotEmpty && gKey != 'YOUR_GOOGLE_MAPS_API_KEY') {
      try {
        final biasLat = lat ?? 11.0168;
        final biasLng = lng ?? 76.9558;

        // Try Places API (New) first
        final newRes = await http.post(
          Uri.parse('https://places.googleapis.com/v1/places:autocomplete'),
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': gKey,
          },
          body: jsonEncode({
            'input': query,
            'includedRegionCodes': ['in'],
            'locationBias': {
              'circle': {
                'center': {'latitude': biasLat, 'longitude': biasLng},
                'radius': 50000.0,
              }
            }
          }),
        ).timeout(const Duration(milliseconds: 3500));

        if (newRes.statusCode == 200) {
          final data = jsonDecode(newRes.body);
          final suggestions = data['suggestions'] as List? ?? [];
          for (final s in suggestions) {
            final p = s['placePrediction'];
            if (p == null) continue;
            final placeId = (p['placeId'] ?? p['place']?.toString().replaceFirst('places/', ''))?.toString() ?? '';
            final main = p['structuredFormat']?['mainText']?['text']?.toString() ?? p['text']?['text']?.toString() ?? '';
            final sec = p['structuredFormat']?['secondaryText']?['text']?.toString() ?? '';
            final k = main.toLowerCase().trim();
            if (k.isNotEmpty && !seenNames.contains(k)) {
              seenNames.add(k);
              results.add(PlacePrediction(
                placeId: placeId,
                mainText: main,
                secondaryText: sec,
                type: 'place',
              ));
            }
          }
        } else {
          // Fallback to legacy endpoint
          final locParam = lat != null && lng != null
              ? '&location=$lat,$lng&radius=50000'
              : '&location=11.0168,76.9558&radius=50000';
          final gUrl =
              '${AppConfig.placesApiUrl}?input=${Uri.encodeComponent(query)}&components=country:in$locParam&key=$gKey';
          final gRes = await http.get(Uri.parse(gUrl)).timeout(const Duration(milliseconds: 3000));
          if (gRes.statusCode == 200) {
            final gData = jsonDecode(gRes.body);
            if (gData['status'] == 'OK' && gData['predictions'] is List) {
              for (final p in gData['predictions']) {
                final pred = PlacePrediction.fromGoogle(p);
                final k = pred.mainText.toLowerCase().trim();
                if (!seenNames.contains(k)) {
                  seenNames.add(k);
                  results.add(pred);
                }
              }
            }
          }
        }
      } catch (_) {}
    }

    // 3. Query backend search
    try {
      final backendResults = await _searchViaBackend(query, lat: lat, lng: lng);
      for (final b in backendResults) {
        final key = b.mainText.toLowerCase().trim();
        if (!seenNames.contains(key)) {
          seenNames.add(key);
          results.add(b);
        }
      }
    } catch (_) {}

    // 4. Photon Geocoding fallback (instant search for any Indian village, hamlet, town, street)
    try {
      var pUrl = 'https://photon.komoot.io/api/?q=${Uri.encodeComponent(query)}&limit=10';
      if (lat != null && lng != null) {
        pUrl += '&lat=$lat&lon=$lng';
      }
      final res = await http.get(Uri.parse(pUrl)).timeout(const Duration(milliseconds: 3500));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final features = data['features'] as List? ?? [];
        for (final f in features) {
          final props = f['properties'] as Map? ?? {};
          final coords = f['geometry']?['coordinates'] as List?;
          if (coords == null || coords.length < 2) continue;
          final name = (props['name'] ?? props['street'] ?? 'Location').toString().trim();
          final key = name.toLowerCase();
          if (seenNames.contains(key)) continue;

          final osmValue = (props['osm_value'] ?? props['osm_key'] ?? '').toString();
          final isVillage = osmValue == 'village' || osmValue == 'hamlet' || osmValue == 'isolated_dwelling';

          final parts = [
            props['district'] ?? props['county'],
            props['city'] ?? props['state'],
            props['country'] ?? 'India',
          ].where((e) => e != null && e.toString().isNotEmpty && e != name).toList();

          final secondary = parts.join(', ');
          seenNames.add(key);
          results.add(PlacePrediction(
            placeId: 'photon_${props['osm_id'] ?? DateTime.now().millisecondsSinceEpoch}',
            mainText: name,
            secondaryText: secondary.isNotEmpty ? secondary : 'Tamil Nadu, India',
            lat: (coords[1] as num).toDouble(),
            lng: (coords[0] as num).toDouble(),
            type: isVillage ? 'village' : (osmValue.isNotEmpty ? osmValue : 'place'),
          ));
        }
      }
    } catch (_) {}

    // 4. OpenStreetMap Nominatim for official administrative village search
    if (results.length < 10) {
      try {
        final nUrl = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=in&q=${Uri.encodeComponent(query)}';
        final res = await http.get(Uri.parse(nUrl), headers: {
          'User-Agent': 'SwiftCab-CustomerApp/1.0 (contact@swiftcab.local)',
        }).timeout(const Duration(milliseconds: 4000));
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          if (data is List) {
            for (final item in data) {
              if (item is Map) {
                final rawName = (item['name'] ?? item['display_name']?.toString().split(',').first ?? '').toString().trim();
                final key = rawName.toLowerCase();
                if (key.isNotEmpty && !seenNames.contains(key)) {
                  seenNames.add(key);
                  results.add(PlacePrediction(
                    placeId: 'osm_${item['place_id']}',
                    mainText: rawName,
                    secondaryText: item['display_name']?.toString() ?? '',
                    lat: double.tryParse(item['lat']?.toString() ?? ''),
                    lng: double.tryParse(item['lon']?.toString() ?? ''),
                    type: item['type']?.toString(),
                  ));
                }
              }
            }
          }
        }
      } catch (_) {}
    }

    return results;
  }

  Future<List<PlacePrediction>> _searchViaBackend(String query,
      {double? lat, double? lng}) async {
    try {
      var path = '/api/v1/locations/search?q=${Uri.encodeComponent(query)}';
      if (lat != null && lng != null) path += '&lat=$lat&lng=$lng';
      final res =
          await _request('GET', path, auth: _accessToken != null) as Map;
      final results = res['results'] as List? ?? [];
      return results.map((r) => PlacePrediction.fromBackend(r as Map)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>?> reverseGeocode(double lat, double lng) async {
    // 1. Google Reverse Geocode with user's key
    final gKey = AppConfig.googleMapsApiKey;
    if (gKey.isNotEmpty && gKey != 'YOUR_GOOGLE_MAPS_API_KEY') {
      try {
        final gUrl = '${AppConfig.geocodeUrl}?latlng=$lat,$lng&key=$gKey';
        final gRes = await http.get(Uri.parse(gUrl)).timeout(const Duration(milliseconds: 3000));
        if (gRes.statusCode == 200) {
          final gData = jsonDecode(gRes.body);
          if (gData['status'] == 'OK' && gData['results'] is List && (gData['results'] as List).isNotEmpty) {
            final first = gData['results'][0];
            final comps = first['address_components'] as List? ?? [];
            String villageOrLocality = '';
            for (final c in comps) {
              final types = (c['types'] as List? ?? []).cast<String>();
              if (types.contains('sublocality') ||
                  types.contains('locality') ||
                  types.contains('neighborhood') ||
                  types.contains('administrative_area_level_3')) {
                villageOrLocality = c['long_name']?.toString() ?? '';
                break;
              }
            }
            final name = villageOrLocality.isNotEmpty
                ? villageOrLocality
                : (comps.isNotEmpty ? comps[0]['long_name']?.toString() ?? 'Location' : 'Location');
            return {
              'id': 'google_rev_${first['place_id']}',
              'name': name,
              'address': first['formatted_address']?.toString() ?? '',
              'lat': lat,
              'lng': lng,
              'type': 'place',
            };
          }
        }
      } catch (_) {}
    }

    // 2. Try backend
    try {
      final res = await _request('GET', '/api/v1/locations/reverse?lat=$lat&lng=$lng', auth: false);
      if (res is Map && res['place'] != null) {
        final place = Map<String, dynamic>.from(res['place']);
        if (place['name'] != null && place['name'] != 'Pinned Location' && place['name'] != 'Current Location') {
          return place;
        }
      }
    } catch (_) {}

    // 3. Direct Nominatim reverse geocode for exact village / street / town name
    try {
      final url = 'https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=$lat&lon=$lng';
      final res = await http.get(Uri.parse(url), headers: {
        'User-Agent': 'SwiftCab-CustomerApp/1.0 (contact@swiftcab.local)',
      }).timeout(const Duration(milliseconds: 4000));
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        if (d is Map && d['display_name'] != null) {
          final addr = d['address'] as Map? ?? {};
          final villageName = (addr['village'] ??
                  addr['hamlet'] ??
                  addr['isolated_dwelling'] ??
                  addr['suburb'] ??
                  addr['neighbourhood'] ??
                  addr['town'] ??
                  addr['city_district'] ??
                  addr['road'] ??
                  d['name'] ??
                  '')
              .toString()
              .trim();

          final name = villageName.isNotEmpty ? villageName : 'Pinned Location';
          return {
            'id': 'osm_rev_${d['place_id'] ?? DateTime.now().millisecondsSinceEpoch}',
            'name': name,
            'address': d['display_name'].toString(),
            'lat': lat,
            'lng': lng,
            'type': addr['village'] != null ? 'village' : (addr['town'] != null ? 'town' : 'place'),
          };
        }
      }
    } catch (_) {}

    return {
      'id': 'pin_${lat.toStringAsFixed(4)}_${lng.toStringAsFixed(4)}',
      'name': 'Pinned Location',
      'address': 'Location (${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)})',
      'lat': lat,
      'lng': lng,
    };
  }

  Future<PlaceDetail?> getPlaceDetail(String placeId,
      {bool isBackendId = false}) async {
    final key = AppConfig.googleMapsApiKey;
    if (key.isEmpty || key == 'YOUR_GOOGLE_MAPS_API_KEY' || isBackendId) return null;

    final cleanPlaceId = placeId.startsWith('google_')
        ? placeId.substring(7)
        : (placeId.startsWith('places/') ? placeId.substring(7) : placeId);

    // 1. Try Places API (New) details endpoint
    try {
      final newUrl = 'https://places.googleapis.com/v1/places/$cleanPlaceId'
          '?fields=id,displayName,formattedAddress,location'
          '&key=$key';
      final res = await http.get(Uri.parse(newUrl)).timeout(const Duration(milliseconds: 3500));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final loc = data['location'];
        if (loc != null) {
          return PlaceDetail(
            lat: (loc['latitude'] as num).toDouble(),
            lng: (loc['longitude'] as num).toDouble(),
            name: data['displayName']?['text']?.toString() ?? '',
            address: data['formattedAddress']?.toString() ?? '',
          );
        }
      }
    } catch (_) {}

    // 2. Fallback to legacy placesDetailsUrl
    try {
      final url = '${AppConfig.placesDetailsUrl}'
          '?place_id=$cleanPlaceId'
          '&fields=geometry,name,formatted_address'
          '&key=$key';
      final res = await http.get(Uri.parse(url)).timeout(const Duration(milliseconds: 3500));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['status'] == 'OK' && data['result'] != null) {
          return PlaceDetail.fromGoogle(data['result']);
        }
      }
    } catch (_) {}
    return null;
  }

  // ─── Fares ────────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> estimateFares({
    required double pickupLat,
    required double pickupLng,
    required String pickupAddress,
    required double dropLat,
    required double dropLng,
    required String dropAddress,
  }) async =>
      await _request(
        'POST',
        '/api/v1/fares/estimate',
        body: {
          'pickup': {
            'lat': pickupLat,
            'lng': pickupLng,
            'address': pickupAddress
          },
          'dropoff': {
            'lat': dropLat,
            'lng': dropLng,
            'address': dropAddress
          },
        },
        auth: _accessToken != null,
      );

  // ─── Bookings ─────────────────────────────────────────────────────────────

  Future<Map<String, dynamic>> createBooking({
    required String estimateId,
    required String paymentMethod,
    required String idempotencyKey,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/v1/bookings');
    final res = await http.post(uri,
        headers: {..._headers(), 'Idempotency-Key': idempotencyKey},
        body: jsonEncode(
            {'estimateId': estimateId, 'paymentMethod': paymentMethod}));
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg =
          data is Map ? (data['message'] ?? 'Booking failed') : 'Booking failed';
      throw ApiException(
        message: msg is List ? msg.join('; ') : msg.toString(),
        statusCode: res.statusCode,
        code: data is Map ? data['code'] : null,
      );
    }
    return data;
  }

  Future<Map<String, dynamic>> trackBooking(String bookingId) async =>
      await _request('GET', '/api/v1/bookings/$bookingId/track');

  /// Fetches real turn-by-turn road polyline and steps from backend Google Routes service.
  Future<Map<String, dynamic>> getNavigationRoute(
    double fromLat,
    double fromLng,
    double toLat,
    double toLng,
  ) async {
    try {
      final res = await _request(
        'POST',
        '/api/v1/routes/estimate',
        body: {
          'pickup': {'lat': fromLat, 'lng': fromLng},
          'dropoff': {'lat': toLat, 'lng': toLng},
        },
      );
      final rawGeo = res['geometry'] as List? ?? [];
      final pts = rawGeo
          .where((p) => p is List && p.length >= 2)
          .map<List<double>>((p) {
            final a = (p[0] as num).toDouble();
            final b = (p[1] as num).toDouble();
            if (a > 50 && b < 40) return [b, a];
            return [a, b];
          })
          .where((p) => p[0] >= 8 && p[0] <= 38 && p[1] >= 68 && p[1] <= 98)
          .toList();
      return {
        'points': pts,
        'distanceKm': (res['distanceKm'] as num?)?.toDouble() ?? 0,
        'durationMin': (res['durationMin'] as num?)?.toInt() ?? 0,
        'steps': (res['steps'] as List? ?? []),
      };
    } catch (_) {
      return {'points': <List<double>>[], 'steps': []};
    }
  }

  Future<List<List<double>>> getDirectionsRoute(
    double fromLat,
    double fromLng,
    double toLat,
    double toLng,
  ) async {
    final nav = await getNavigationRoute(fromLat, fromLng, toLat, toLng);
    return nav['points'] as List<List<double>>;
  }

  static List<List<double>> _decodePolyline(String encoded) {
    final List<List<double>> poly = [];
    int index = 0, len = encoded.length;
    int lat = 0, lng = 0;

    while (index < len) {
      int b, shift = 0, result = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.add([lat / 1e5, lng / 1e5]);
    }
    return poly;
  }

  Future<Map<String, dynamic>?> getActiveBooking() async {
    final res = await _request('GET', '/api/v1/customers/me/active-booking');
    return res['booking'];
  }

  Future<Map<String, dynamic>> cancelBooking(String bookingId,
          {String? reason}) async =>
      await _request('POST', '/api/v1/bookings/$bookingId/cancel',
          body: {'reason': reason ?? ''});

  Future<Map<String, dynamic>> getMyBookings({int page = 1}) async =>
      await _request('GET', '/api/v1/customers/me/bookings?page=$page');

  // ─── Health ───────────────────────────────────────────────────────────────

  Future<bool> checkHealth() async {
    try {
      final res = await http
          .get(Uri.parse('$_baseUrl/api/v1/health'))
          .timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }
}

// ─── Supporting Types ──────────────────────────────────────────────────────

class PlacePrediction {
  final String placeId;
  final String mainText;
  final String secondaryText;
  final double? lat;
  final double? lng;
  final String? type;

  PlacePrediction({
    required this.placeId,
    required this.mainText,
    required this.secondaryText,
    this.lat,
    this.lng,
    this.type,
  });

  String get fullText => secondaryText.isEmpty ? mainText : '$mainText, $secondaryText';

  factory PlacePrediction.fromGoogle(Map j) => PlacePrediction(
        placeId: j['place_id']?.toString() ?? '',
        mainText: (j['structured_formatting']?['main_text'] ?? j['description'])?.toString() ?? '',
        secondaryText: j['structured_formatting']?['secondary_text']?.toString() ?? '',
      );

  factory PlacePrediction.fromBackend(Map j) => PlacePrediction(
        placeId: 'backend_${j['id'] ?? j['name']}',
        mainText: j['name']?.toString() ?? '',
        secondaryText: j['address']?.toString() ?? '',
        lat: (j['lat'] as num?)?.toDouble(),
        lng: (j['lng'] as num?)?.toDouble(),
        type: j['type']?.toString(),
      );
}

class PlaceDetail {
  final double lat;
  final double lng;
  final String name;
  final String address;

  PlaceDetail({required this.lat, required this.lng, required this.name, required this.address});

  factory PlaceDetail.fromGoogle(Map j) {
    final loc = j['geometry']['location'];
    return PlaceDetail(
      lat: (loc['lat'] as num).toDouble(),
      lng: (loc['lng'] as num).toDouble(),
      name: j['name']?.toString() ?? '',
      address: j['formatted_address']?.toString() ?? '',
    );
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  final String? code;
  ApiException({required this.message, required this.statusCode, this.code});
  @override
  String toString() => 'ApiException($statusCode): $message';
}
