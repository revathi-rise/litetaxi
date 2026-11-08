import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class DriverApiClient {
  static final DriverApiClient _instance = DriverApiClient._internal();
  factory DriverApiClient() => _instance;
  DriverApiClient._internal();

  // Override at build time: flutter build web --dart-define=API_URL=https://api.example.com
  static const String _apiUrlOverride = String.fromEnvironment('API_URL');
  String _baseUrl = _apiUrlOverride.isNotEmpty ? '$_apiUrlOverride/api/v1' : 'http://localhost:3001/api/v1';
  String? _accessToken;
  String? _refreshToken;
  Map<String, dynamic>? _driverUser;

  String get baseUrl => _baseUrl;
  String? get accessToken => _accessToken;
  String? get refreshToken => _refreshToken;
  Map<String, dynamic>? get driverUser => _driverUser;
  bool get isAuthenticated => _accessToken != null;

  void setBaseUrl(String url) {
    _baseUrl = url.replaceAll(RegExp(r'/+$'), '');
  }

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('driver_access_token');
    _refreshToken = prefs.getString('driver_refresh_token');
    final userJson = prefs.getString('driver_user');
    if (userJson != null) {
      try {
        _driverUser = jsonDecode(userJson);
      } catch (_) {}
    }
    final savedBase = prefs.getString('driver_base_url');
    if (savedBase != null && savedBase.isNotEmpty) {
      _baseUrl = savedBase;
    }
  }

  Map<String, String> _headers({bool needsAuth = true}) {
    final h = {'Content-Type': 'application/json'};
    if (needsAuth && _accessToken != null) {
      h['Authorization'] = 'Bearer $_accessToken';
    }
    return h;
  }

  Future<bool> refreshSession({String? fallbackPhone}) async {
    // 1. Try refresh token if available
    if (_refreshToken != null) {
      try {
        final res = await http.post(
          Uri.parse('$_baseUrl/auth/refresh'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'refreshToken': _refreshToken}),
        );
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          _accessToken = data['accessToken'];
          _refreshToken = data['refreshToken'];
          final prefs = await SharedPreferences.getInstance();
          if (_accessToken != null) await prefs.setString('driver_access_token', _accessToken!);
          if (_refreshToken != null) await prefs.setString('driver_refresh_token', _refreshToken!);
          return true;
        }
      } catch (_) {}
    }

    // 2. Dev mode auto-reauthentication with driver's phone
    final phone = fallbackPhone ?? _driverUser?['phone'];
    if (phone != null && phone.isNotEmpty) {
      try {
        final sendRes = await sendOtp(phone);
        final devOtp = (sendRes['devOtp'] ?? sendRes['otp'] ?? '000000').toString();
        await verifyOtp(phone, devOtp);
        return true;
      } catch (err) {
        debugPrint('Auto re-authentication failed: $err');
      }
    }
    return false;
  }

  Future<Map<String, dynamic>> sendOtp(String phone) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/send-otp'),
      headers: _headers(needsAuth: false),
      body: jsonEncode({'phone': phone}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg = data['message'] is List ? (data['message'] as List).join(', ') : data['message'];
      throw Exception(msg ?? 'Failed to send OTP');
    }
    return data;
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/verify-otp'),
      headers: _headers(needsAuth: false),
      body: jsonEncode({'phone': phone, 'otp': otp, 'role': 'driver'}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg = data['message'] is List ? (data['message'] as List).join(', ') : data['message'];
      throw Exception(msg ?? 'Failed to verify OTP');
    }
    _accessToken = data['accessToken'];
    _refreshToken = data['refreshToken'];
    _driverUser = data['user'];

    final prefs = await SharedPreferences.getInstance();
    if (_accessToken != null) {
      await prefs.setString('driver_access_token', _accessToken!);
    }
    if (_refreshToken != null) {
      await prefs.setString('driver_refresh_token', _refreshToken!);
    }
    if (_driverUser != null) {
      await prefs.setString('driver_user', jsonEncode(_driverUser));
    }
    return data;
  }

  Future<void> logout() async {
    _accessToken = null;
    _refreshToken = null;
    _driverUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('driver_access_token');
    await prefs.remove('driver_refresh_token');
    await prefs.remove('driver_user');
  }

  Future<Map<String, dynamic>> getDriverProfile() async {
    var res = await http.get(
      Uri.parse('$_baseUrl/drivers/profile'),
      headers: _headers(),
    );

    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.get(
          Uri.parse('$_baseUrl/drivers/profile'),
          headers: _headers(),
        );
      }
    }

    if (res.statusCode >= 400) {
      return {'hasProfile': false};
    }
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getTrips() async {
    var res = await http.get(
      Uri.parse('$_baseUrl/drivers/trips'),
      headers: _headers(),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.get(
          Uri.parse('$_baseUrl/drivers/trips'),
          headers: _headers(),
        );
      }
    }
    if (res.statusCode >= 400) {
      return {'trips': [], 'count': 0};
    }
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> getWallet() async {
    var res = await http.get(
      Uri.parse('$_baseUrl/drivers/wallet'),
      headers: _headers(),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.get(
          Uri.parse('$_baseUrl/drivers/wallet'),
          headers: _headers(),
        );
      }
    }
    if (res.statusCode >= 400) {
      return {
        'walletBalance': 0,
        'todayEarnings': 0,
        'totalEarnings': 0,
        'completedTrips': 0,
        'recentTransactions': [],
      };
    }
    return jsonDecode(res.body);
  }

  Future<Map<String, dynamic>> registerDriver(Map<String, dynamic> data) async {
    if (_accessToken == null && data['phone'] != null) {
      await refreshSession(fallbackPhone: data['phone']);
    }

    var res = await http.post(
      Uri.parse('$_baseUrl/drivers/register'),
      headers: _headers(),
      body: jsonEncode(data),
    );

    // Auto-heal expired session and retry automatically!
    if (res.statusCode == 401) {
      final ok = await refreshSession(fallbackPhone: data['phone']);
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/drivers/register'),
          headers: _headers(),
          body: jsonEncode(data),
        );
      }
    }

    final resData = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      final msg = resData['message'] is List ? (resData['message'] as List).join(', ') : resData['message'];
      throw Exception(msg ?? 'Failed to submit registration');
    }
    return resData;
  }

  Future<Map<String, dynamic>> updatePlan(String plan) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/drivers/plan'),
      headers: _headers(),
      body: jsonEncode({'plan': plan}),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/drivers/plan'),
          headers: _headers(),
          body: jsonEncode({'plan': plan}),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) throw Exception(data['message'] ?? 'Failed to update plan');
    return data;
  }

  Future<Map<String, dynamic>> activateSubscription({String tier = 'daily_29'}) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/drivers/subscription/activate'),
      headers: _headers(),
      body: jsonEncode({'tier': tier}),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/drivers/subscription/activate'),
          headers: _headers(),
          body: jsonEncode({'tier': tier}),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) throw Exception(data['message'] ?? 'Failed to activate subscription');
    return data;
  }

  Future<Map<String, dynamic>> createRazorpayOrder(double amount, {String purpose = 'wallet_topup'}) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/payments/razorpay/order'),
      headers: _headers(),
      body: jsonEncode({'amount': amount, 'purpose': purpose}),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/payments/razorpay/order'),
          headers: _headers(),
          body: jsonEncode({'amount': amount, 'purpose': purpose}),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) throw Exception(data['message'] ?? 'Failed to create payment order');
    return data;
  }

  Future<Map<String, dynamic>> verifyRazorpayPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/payments/razorpay/verify'),
      headers: _headers(),
      body: jsonEncode({
        'razorpayOrderId': orderId,
        'razorpayPaymentId': paymentId,
        'razorpaySignature': signature,
      }),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/payments/razorpay/verify'),
          headers: _headers(),
          body: jsonEncode({
            'razorpayOrderId': orderId,
            'razorpayPaymentId': paymentId,
            'razorpaySignature': signature,
          }),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) throw Exception(data['message'] ?? 'Payment verification failed');
    return data;
  }

  Future<List<dynamic>> getVehicleCategories() async {
    try {
      final res = await http.get(Uri.parse('$_baseUrl/admin/vehicle-categories'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['categories'] ?? [];
      }
    } catch (_) {}
    return [
      {'id': 'auto', 'code': 'auto', 'name': 'Auto'},
      {'id': 'mini', 'code': 'mini', 'name': 'Mini'},
      {'id': 'sedan', 'code': 'sedan', 'name': 'Sedan'},
      {'id': 'xl', 'code': 'xl', 'name': 'SUV / XL'},
    ];
  }

  Future<Map<String, dynamic>> updateLocation(double lat, double lng, {double? heading}) async {
    final body = <String, dynamic>{'lat': lat, 'lng': lng};
    if (heading != null && !heading.isNaN) {
      body['heading'] = heading.round();
    }
    var res = await http.post(
      Uri.parse('$_baseUrl/drivers/location'),
      headers: _headers(),
      body: jsonEncode(body),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/drivers/location'),
          headers: _headers(),
          body: jsonEncode(body),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to update location');
    }
    return data;
  }

  Future<Map<String, dynamic>> setAvailability(bool online) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/drivers/availability'),
      headers: _headers(),
      body: jsonEncode({'online': online}),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/drivers/availability'),
          headers: _headers(),
          body: jsonEncode({'online': online}),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to update availability');
    }
    return data;
  }

  Future<List<dynamic>> getRideRequests() async {
    var res = await http.get(
      Uri.parse('$_baseUrl/drivers/ride-requests'),
      headers: _headers(),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.get(
          Uri.parse('$_baseUrl/drivers/ride-requests'),
          headers: _headers(),
        );
      }
    }
    if (res.statusCode >= 400) {
      return [];
    }
    final data = jsonDecode(res.body);
    return data['requests'] as List<dynamic>? ?? [];
  }

  Future<Map<String, dynamic>> acceptRequest(String bookingId) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/drivers/ride-requests/$bookingId/accept'),
      headers: _headers(),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.post(
          Uri.parse('$_baseUrl/drivers/ride-requests/$bookingId/accept'),
          headers: _headers(),
        );
      }
    }
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to accept ride');
    }
    return data;
  }

  Future<void> rejectRequest(String bookingId) async {
    await http.post(
      Uri.parse('$_baseUrl/drivers/ride-requests/$bookingId/reject'),
      headers: _headers(),
    );
  }

  Future<Map<String, dynamic>?> getActiveTrip() async {
    var res = await http.get(
      Uri.parse('$_baseUrl/drivers/active-trip'),
      headers: _headers(),
    );
    if (res.statusCode == 401) {
      final ok = await refreshSession();
      if (ok) {
        res = await http.get(
          Uri.parse('$_baseUrl/drivers/active-trip'),
          headers: _headers(),
        );
      }
    }
    if (res.statusCode >= 400) return null;
    final data = jsonDecode(res.body);
    return data['trip'] as Map<String, dynamic>?;
  }

  Future<Map<String, dynamic>> arriveAtPickup(String bookingId) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/trips/$bookingId/arrive'),
      headers: _headers(),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to mark arrival');
    }
    return data;
  }

  Future<Map<String, dynamic>> startTrip(String bookingId, String otp) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/trips/$bookingId/start'),
      headers: _headers(),
      body: jsonEncode({'otp': otp}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Invalid OTP or failed to start trip');
    }
    return data;
  }

  Future<Map<String, dynamic>> completeTrip(String bookingId) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/trips/$bookingId/complete'),
      headers: _headers(),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to complete trip');
    }
    return data;
  }

  Future<Map<String, dynamic>> confirmCash(String bookingId) async {
    var res = await http.post(
      Uri.parse('$_baseUrl/trips/$bookingId/cash-collected'),
      headers: _headers(),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode >= 400) {
      throw Exception(data['message'] ?? 'Failed to confirm cash collection');
    }
    return data;
  }
}
