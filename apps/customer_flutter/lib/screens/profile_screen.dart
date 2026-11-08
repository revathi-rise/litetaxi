import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/theme.dart';

class ProfileScreen extends StatefulWidget {
  final VoidCallback onLogout;
  const ProfileScreen({super.key, required this.onLogout});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _user;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final res = await ApiClient().getMe();
      setState(() { _user = res; _loading = false; });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Avatar
          Center(
            child: Stack(
              alignment: Alignment.bottomRight,
              children: [
                CircleAvatar(
                  radius: 48,
                  backgroundColor: AppColors.primaryLight,
                  child: _loading
                      ? const CircularProgressIndicator(color: AppColors.primary)
                      : Text(
                          _user?['name']?.toString().substring(0, 1).toUpperCase() ?? 'U',
                          style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary),
                        ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  child: const Icon(Icons.edit, size: 12, color: Colors.white),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          if (_user != null) ...[
            Center(
              child: Text(
                _user!['name']?.toString() ?? 'Customer',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
              ),
            ),
            Center(
              child: Text(
                _user!['phone']?.toString() ?? '',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
            ),
          ],
          const SizedBox(height: 32),

          // Stats row
          if (_user != null) ...[
            Row(
              children: [
                _StatCard(label: 'Total Rides', value: _user!['ridesCount']?.toString() ?? '0'),
                const SizedBox(width: 12),
                _StatCard(label: 'Member Since',
                    value: _user!['createdAt'] != null
                        ? DateTime.tryParse(_user!['createdAt'])?.year.toString() ?? '-'
                        : '-'),
                const SizedBox(width: 12),
                _StatCard(label: 'Rating', value: _user!['rating']?.toString() ?? '5.0'),
              ],
            ),
            const SizedBox(height: 24),
          ],

          // Settings section
          _SectionHeader('Settings'),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            label: 'Notifications',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.language,
            label: 'Language',
            trailing: 'English',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.privacy_tip_outlined,
            label: 'Privacy Policy',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.help_outline,
            label: 'Help & Support',
            onTap: () {},
          ),
          const SizedBox(height: 8),
          _SectionHeader('Developer'),
          _SettingsTile(
            icon: Icons.dns_outlined,
            label: 'Backend Server URL',
            trailing: ApiClient().baseUrl.replaceFirst('http://', ''),
            onTap: () => _showServerConfig(context),
          ),
          const SizedBox(height: 24),

          // Logout
          OutlinedButton.icon(
            onPressed: () async {
              await ApiClient().logout();
              widget.onLogout();
            },
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text('Sign Out', style: TextStyle(color: AppColors.error)),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 52),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              side: const BorderSide(color: AppColors.error),
            ),
          ),
          const SizedBox(height: 16),
          const Center(
            child: Text('LiteSpark Taxi v1.0.0',
                style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  void _showServerConfig(BuildContext context) {
    final ctrl = TextEditingController(text: ApiClient().baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Backend Server URL'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: ctrl,
              decoration: const InputDecoration(
                  labelText: 'Base URL',
                  hintText: 'http://10.0.2.2:3001'),
            ),
            const SizedBox(height: 8),
            const Text('Android emulator: http://10.0.2.2:3001\nPhysical device: http://192.168.x.x:3001',
                style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await ApiClient().setBaseUrl(ctrl.text.trim());
              if (ctx.mounted) {
                Navigator.pop(ctx);
                setState(() {});
              }
            },
            style: ElevatedButton.styleFrom(minimumSize: const Size(80, 40)),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary)),
            const SizedBox(height: 2),
            Text(label,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Text(title.toUpperCase(),
          style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1,
              color: AppColors.textMuted)),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? trailing;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.label,
    this.trailing,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary, size: 20),
        title: Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        trailing: trailing != null
            ? Text(trailing!,
                style: const TextStyle(fontSize: 12, color: AppColors.textMuted))
            : const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 18),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
