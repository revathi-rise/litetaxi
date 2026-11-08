import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/models.dart';
import '../core/theme.dart';

class RidesScreen extends StatefulWidget {
  const RidesScreen({super.key});

  @override
  State<RidesScreen> createState() => _RidesScreenState();
}

class _RidesScreenState extends State<RidesScreen> {
  List<RideHistoryItem> _rides = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().getMyBookings();
      final items = (res['bookings'] as List? ?? res['items'] as List? ?? [])
          .map((j) => RideHistoryItem.fromJson(j as Map<String, dynamic>))
          .toList();
      setState(() { _rides = items; _loading = false; });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e is ApiException ? e.message : 'Could not load ride history';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Rides'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error != null
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                    const SizedBox(height: 12),
                    Text(_error!),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _load, child: const Text('Retry')),
                  ]),
                )
              : _rides.isEmpty
                  ? Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.local_taxi, size: 64, color: AppColors.border),
                        const SizedBox(height: 16),
                        const Text('No rides yet',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 8),
                        const Text('Book your first ride!',
                            style: TextStyle(color: AppColors.textSecondary)),
                      ]),
                    )
                  : RefreshIndicator(
                      onRefresh: _load,
                      color: AppColors.primary,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _rides.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => _RideCard(ride: _rides[i]),
                      ),
                    ),
    );
  }
}

class _RideCard extends StatelessWidget {
  final RideHistoryItem ride;
  const _RideCard({required this.ride});

  Color get _statusColor {
    switch (ride.status.toUpperCase()) {
      case 'COMPLETED': return AppColors.success;
      case 'CANCELLED': return AppColors.error;
      case 'NO_DRIVER': return AppColors.error;
      default: return AppColors.warning;
    }
  }

  IconData get _statusIcon {
    switch (ride.status.toUpperCase()) {
      case 'COMPLETED': return Icons.check_circle;
      case 'CANCELLED': return Icons.cancel;
      default: return Icons.local_taxi;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(_statusIcon, color: _statusColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('#${ride.reference}',
                          style: const TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 15)),
                      Text(
                        DateFormat('dd MMM y, h:mm a').format(ride.createdAt.toLocal()),
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
                Text('₹${ride.total}',
                    style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary)),
              ],
            ),
            const SizedBox(height: 14),
            // Route
            _RouteRow(
              icon: Icons.radio_button_checked,
              color: AppColors.success,
              text: ride.pickup,
            ),
            Padding(
              padding: const EdgeInsets.only(left: 9),
              child: Container(
                  width: 1, height: 18, color: AppColors.borderLight),
            ),
            _RouteRow(
              icon: Icons.location_on,
              color: AppColors.primary,
              text: ride.dropoff,
            ),
            if (ride.categoryName != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  ride.categoryName!,
                  style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _RouteRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String text;

  const _RouteRow({required this.icon, required this.color, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13, color: AppColors.textPrimary)),
        ),
      ],
    );
  }
}
