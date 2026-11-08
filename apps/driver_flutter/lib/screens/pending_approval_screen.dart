import 'dart:async';
import 'package:flutter/material.dart';
import '../core/brand_assets.dart';
import '../core/driver_api_client.dart';
import '../core/theme.dart';
import 'dashboard_screen.dart';
import 'login_screen.dart';

class DriverPendingApprovalScreen extends StatefulWidget {
  final Map<String, dynamic>? initialProfile;
  const DriverPendingApprovalScreen({super.key, this.initialProfile});

  @override
  State<DriverPendingApprovalScreen> createState() => _DriverPendingApprovalScreenState();
}

class _DriverPendingApprovalScreenState extends State<DriverPendingApprovalScreen> {
  final _api = DriverApiClient();
  Timer? _checkTimer;
  bool _checking = false;
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _profile = widget.initialProfile;
    // Auto-check approval every 4 seconds so when admin approves on the portal, it immediately unlocks!
    _checkTimer = Timer.periodic(const Duration(seconds: 4), (_) => _checkStatus(silent: true));
  }

  Future<void> _checkStatus({bool silent = false}) async {
    if (_checking && !silent) return;
    if (!silent) setState(() => _checking = true);
    try {
      final res = await _api.getDriverProfile();
      if (!mounted) return;
      if (res['hasProfile'] == true) {
        final p = res['profile'] as Map<String, dynamic>;
        setState(() => _profile = p);
        if (p['approval'] == 'approved') {
          _checkTimer?.cancel();
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const DriverDashboardScreen()),
          );
          return;
        }
      }
    } catch (_) {}
    if (!silent && mounted) setState(() => _checking = false);
  }

  Future<void> _logout() async {
    _checkTimer?.cancel();
    await _api.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const DriverLoginScreen()),
    );
  }

  @override
  void dispose() {
    _checkTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final name = _profile?['name'] ?? 'Driver Partner';
    final approval = _profile?['approval'] ?? 'pending';
    final isRejected = approval == 'rejected';
    final reason = _profile?['rejectionReason'];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('LiteSpark Driver Partner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Log out',
            onPressed: _logout,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              Center(
                child: BrandAssets.logo(size: 64, radius: 14),
              ),
              const SizedBox(height: 24),

              // Status Icon
              Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: isRejected ? Colors.red.shade50 : Colors.amber.shade50,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isRejected ? Icons.cancel_outlined : Icons.hourglass_top_rounded,
                    size: 48,
                    color: isRejected ? Colors.red : Colors.amber.shade800,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Title
              Center(
                child: Text(
                  isRejected ? 'Application Needs Revision' : 'Application Under Review',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: isRejected ? Colors.red.shade800 : DriverColors.primaryDark,
                  ),
                ),
              ),
              const SizedBox(height: 12),

              Center(
                child: Text(
                  isRejected
                      ? 'Your application was not approved: ${reason ?? "Please update your documents."}'
                      : 'Welcome, $name! Your licence, Aadhaar card, and 4-sided vehicle images have been submitted.\n\nLiteSpark Admin will review your profile shortly.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14, color: Colors.black54, height: 1.5),
                ),
              ),
              const SizedBox(height: 32),

              // Application Details Card
              Card(
                elevation: 0,
                color: DriverColors.lightBg,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: DriverColors.border),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    children: [
                      _buildInfoRow('Driver Name', name),
                      const Divider(height: 18),
                      _buildInfoRow('Mobile Phone', _profile?['phone'] ?? ''),
                      const Divider(height: 18),
                      _buildInfoRow('Licence Number', _profile?['licenseNumber'] ?? 'Verified'),
                      const Divider(height: 18),
                      _buildInfoRow('Aadhaar Number', _profile?['aadhaarNumber'] ?? 'Verified'),
                      const Divider(height: 18),
                      _buildInfoRow('Vehicle Photos', '4 Sides Uploaded (Front, Back, L, R)'),
                      const Divider(height: 18),
                      _buildInfoRow(
                        'Approval Status',
                        isRejected ? 'REJECTED' : 'PENDING APPROVAL',
                        color: isRejected ? Colors.red : Colors.orange.shade800,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 30),

              // Refresh Button
              ElevatedButton.icon(
                onPressed: _checking ? null : () => _checkStatus(silent: false),
                icon: _checking
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.refresh),
                label: Text(
                  _checking ? 'Checking Status...' : 'REFRESH APPROVAL STATUS',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: DriverColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),

              const SizedBox(height: 16),
              const Center(
                child: Text(
                  'Approvals are managed live from the Next.js Admin Portal',
                  style: TextStyle(fontSize: 12, color: Colors.black38),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: Colors.black54)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: color ?? DriverColors.textPrimary,
          ),
        ),
      ],
    );
  }
}

