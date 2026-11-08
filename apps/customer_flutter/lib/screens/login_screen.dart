import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../core/brand_assets.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoggedIn;
  const LoginScreen({super.key, required this.onLoggedIn});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrl =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocus = List.generate(6, (_) => FocusNode());

  bool _otpSent = false;
  bool _loading = false;
  String? _error;
  String? _hint; // show OTP hint for demo

  @override
  void dispose() {
    _phoneCtrl.dispose();
    for (final c in _otpCtrl) c.dispose();
    for (final f in _otpFocus) f.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 10) {
      setState(() => _error = 'Enter a valid 10-digit mobile number');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().sendOtp('+91$phone');
      final devOtp = res['devOtp']?.toString() ?? res['otp']?.toString();
      setState(() {
        _otpSent = true;
        _loading = false;
        _hint = devOtp ?? res['message']?.toString();
      });
      if (devOtp != null && devOtp.length == 6) {
        for (int i = 0; i < 6; i++) {
          _otpCtrl[i].text = devOtp[i];
        }
      }
      Future.delayed(const Duration(milliseconds: 100), () {
        _otpFocus[0].requestFocus();
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e is ApiException ? e.message : 'Failed to send OTP. Check server connection.';
      });
    }
  }

  Future<void> _loginWithDemo() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().sendOtp('+919876543210');
      final otp = res['devOtp']?.toString() ?? res['otp']?.toString() ?? '123456';
      await ApiClient().verifyOtp('+919876543210', otp);
      if (mounted) widget.onLoggedIn();
    } catch (e) {
      // In case server has issues, allow direct demo access
      await ApiClient().setTokens('demo_access_token', 'demo_refresh_token');
      if (mounted) widget.onLoggedIn();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpCtrl.map((c) => c.text).join();
    if (otp.length < 6) {
      setState(() => _error = 'Enter the 6-digit OTP');
      return;
    }
    final phone = _phoneCtrl.text.trim();
    setState(() { _loading = true; _error = null; });
    try {
      await ApiClient().verifyOtp('+91$phone', otp);
      if (mounted) widget.onLoggedIn();
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e is ApiException ? e.message : 'Invalid OTP. Try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              // Logo
              Row(
                children: [
                  BrandAssets.logo(size: 52, radius: 14),
                  const SizedBox(width: 14),
                  const Text('LiteSpark Taxi',
                      style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF581C87))),
                ],
              ),
              const SizedBox(height: 48),
              // Heading
              Text(
                _otpSent ? 'Verify OTP' : 'Sign In',
                style: Theme.of(context).textTheme.displayLarge,
              ),
              const SizedBox(height: 6),
              Text(
                _otpSent
                    ? 'Enter the 6-digit code sent to +91 ${_phoneCtrl.text}'
                    : 'Enter your mobile number to continue',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textSecondary),
              ),
              const SizedBox(height: 32),

              if (!_otpSent) ...[
                // Phone input
                TextField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  decoration: const InputDecoration(
                    prefixText: '+91  ',
                    prefixStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    hintText: '9876543210',
                    labelText: 'Mobile Number',
                  ),
                  onSubmitted: (_) => _sendOtp(),
                ),
              ] else ...[
                // OTP boxes
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(6, (i) => _OtpBox(
                    controller: _otpCtrl[i],
                    focusNode: _otpFocus[i],
                    onChanged: (v) {
                      if (v.isNotEmpty && i < 5) {
                        _otpFocus[i + 1].requestFocus();
                      } else if (v.isEmpty && i > 0) {
                        _otpFocus[i - 1].requestFocus();
                      }
                      if (i == 5 && v.isNotEmpty) _verifyOtp();
                    },
                  )),
                ),
                // Demo hint
                if (_hint != null && _hint!.contains(RegExp(r'\d{6}'))) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.info.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.info.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline, color: AppColors.info, size: 16),
                        const SizedBox(width: 8),
                        Text('Demo OTP: $_hint',
                            style: const TextStyle(
                                color: AppColors.info,
                                fontWeight: FontWeight.w600,
                                fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ],

              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.error.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 16),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_error!,
                          style: const TextStyle(color: AppColors.error, fontSize: 13))),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 28),
              ElevatedButton(
                onPressed: _loading ? null : (_otpSent ? _verifyOtp : _sendOtp),
                child: _loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_otpSent ? 'Verify & Continue' : 'Send OTP'),
              ),
              const SizedBox(height: 14),
              OutlinedButton.icon(
                onPressed: _loading ? null : _loginWithDemo,
                icon: const Icon(Icons.bolt, color: AppColors.accent),
                label: const Text('⚡ Instant Demo Mode (Skip to Map)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.primary)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  side: const BorderSide(color: AppColors.primary, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              if (_otpSent) ...[
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: _loading
                        ? null
                        : () {
                            setState(() {
                              _otpSent = false;
                              _error = null;
                              _hint = null;
                              for (final c in _otpCtrl) c.clear();
                            });
                          },
                    child: const Text('← Change number'),
                  ),
                ),
              ],

              const SizedBox(height: 40),
              // Server config hint
              Center(
                child: TextButton.icon(
                  icon: const Icon(Icons.settings, size: 14),
                  label: const Text('Configure Server', style: TextStyle(fontSize: 12)),
                  style: TextButton.styleFrom(foregroundColor: AppColors.textMuted),
                  onPressed: () => _showServerConfig(context),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showServerConfig(BuildContext context) {
    final ctrl = TextEditingController(text: ApiClient().baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Backend Server URL'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(labelText: 'Base URL', hintText: 'http://10.0.2.2:3001'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await ApiClient().setBaseUrl(ctrl.text.trim());
              if (ctx.mounted) Navigator.pop(ctx);
            },
            style: ElevatedButton.styleFrom(minimumSize: const Size(80, 40)),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  const _OtpBox({required this.controller, required this.focusNode, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 56,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly,
          LengthLimitingTextInputFormatter(1),
        ],
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
        decoration: InputDecoration(
          contentPadding: EdgeInsets.zero,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
        ),
        onChanged: onChanged,
      ),
    );
  }
}
