import 'package:flutter/material.dart';
import '../core/brand_assets.dart';
import '../core/driver_api_client.dart';
import '../core/theme.dart';
import 'dashboard_screen.dart';
import 'pending_approval_screen.dart';
import 'registration_screen.dart';

class DriverLoginScreen extends StatefulWidget {
  const DriverLoginScreen({super.key});

  @override
  State<DriverLoginScreen> createState() => _DriverLoginScreenState();
}

class _DriverLoginScreenState extends State<DriverLoginScreen> {
  final _phoneController = TextEditingController(text: '+919000000020');
  final _otpController = TextEditingController();
  final _api = DriverApiClient();

  bool _otpSent = false;
  bool _loading = false;
  String? _error;
  String? _serverUrl;

  @override
  void initState() {
    super.initState();
    _serverUrl = _api.baseUrl;
  }

  Future<void> _sendOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      setState(() => _error = 'Please enter a valid phone number');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _api.sendOtp(phone);
      setState(() {
        _otpSent = true;
        _loading = false;
        // In dev mode, API returns devOtp
        final devOtp = res['devOtp'] ?? res['otp'];
        if (devOtp != null) {
          _otpController.text = devOtp.toString();
        } else {
          _otpController.text = '000000';
        }
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  Future<void> _verifyOtp() async {
    final phone = _phoneController.text.trim();
    final otp = _otpController.text.trim();
    if (otp.length < 6) {
      setState(() => _error = 'Please enter the 6-digit OTP');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await _api.verifyOtp(phone, otp);
      if (!mounted) return;

      // Check driver profile and approval status
      final profileRes = await _api.getDriverProfile();
      if (!mounted) return;

      if (profileRes['hasProfile'] == true) {
        final profile = profileRes['profile'] as Map<String, dynamic>;
        final approval = profile['approval'] ?? 'pending';

        if (approval == 'approved') {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const DriverDashboardScreen()),
          );
        } else {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => DriverPendingApprovalScreen(initialProfile: profile)),
          );
        }
      } else {
        // First-time driver needs to complete registration & upload documents!
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => DriverRegistrationScreen(initialPhone: phone)),
        );
      }
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _showServerSettings() {
    final urlController = TextEditingController(text: _api.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('API Server URL'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'If testing on a real phone via Wi-Fi, enter your PC\'s local IP (e.g. http://192.168.1.100:3001/api/v1):',
              style: TextStyle(fontSize: 13, color: Colors.black54),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'http://192.168.1.xxx:3001/api/v1',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _api.setBaseUrl(urlController.text.trim());
              setState(() => _serverUrl = _api.baseUrl);
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('LiteSpark Driver Partner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'Server Settings',
            onPressed: _showServerSettings,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 10),
              Center(
                child: BrandAssets.logo(size: 72, radius: 16),
              ),
              const SizedBox(height: 16),
              const Center(
                child: Text(
                  'LiteSpark Driver',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: DriverColors.primaryDark,
                  ),
                ),
              ),
              const Center(
                child: Text(
                  'Real-Time Cab GPS & Dispatch Partner',
                  style: TextStyle(fontSize: 14, color: Colors.black54),
                ),
              ),
              const SizedBox(height: 32),

              // Quick fill demo test accounts
              const Text(
                'TEST DRIVERS (PRE-APPROVED)',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.black45, letterSpacing: 0.5),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    avatar: const Icon(Icons.local_taxi, size: 16, color: DriverColors.primary),
                    label: const Text('Driver 1 (+919000000020)', style: TextStyle(fontSize: 12)),
                    onPressed: () => setState(() => _phoneController.text = '+919000000020'),
                  ),
                  ActionChip(
                    avatar: const Icon(Icons.local_taxi, size: 16, color: DriverColors.primary),
                    label: const Text('Driver 2 (+919000000021)', style: TextStyle(fontSize: 12)),
                    onPressed: () => setState(() => _phoneController.text = '+919000000021'),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              TextField(
                controller: _phoneController,
                enabled: !_otpSent,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Mobile Phone Number',
                  prefixIcon: const Icon(Icons.phone_android, color: DriverColors.primary),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  filled: true,
                  fillColor: DriverColors.lightBg,
                ),
              ),

              if (_otpSent) ...[
                const SizedBox(height: 16),
                TextField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  autofocus: true,
                  style: const TextStyle(fontSize: 20, letterSpacing: 4, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                  decoration: InputDecoration(
                    labelText: '6-Digit Verification OTP',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    filled: true,
                    fillColor: DriverColors.lightBg,
                    counterText: '',
                  ),
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: _loading ? null : (_otpSent ? _verifyOtp : _sendOtp),
                style: ElevatedButton.styleFrom(
                  backgroundColor: DriverColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : Text(
                        _otpSent ? 'VERIFY & GO TO DASHBOARD' : 'SEND OTP',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
              ),

              if (_otpSent) ...[
                const SizedBox(height: 12),
                TextButton(
                  onPressed: _loading ? null : () => setState(() => _otpSent = false),
                  child: const Text('Change Phone Number'),
                ),
              ],

              const SizedBox(height: 40),
              Center(
                child: Text(
                  'Connected to: $_serverUrl',
                  style: const TextStyle(fontSize: 11, color: Colors.black38),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

