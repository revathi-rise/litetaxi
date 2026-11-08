import 'package:flutter/material.dart';
import '../core/theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool large;

  const StatusBadge({super.key, required this.status, this.large = false});

  _BadgeStyle get _style {
    switch (status.toUpperCase()) {
      case 'SEARCHING':
      case 'SEARCHING_DRIVER':
        return _BadgeStyle('Searching Driver', AppColors.info, Icons.search);
      case 'DRIVER_ASSIGNED':
        return _BadgeStyle('Driver Assigned', AppColors.warning, Icons.person_pin_circle);
      case 'DRIVER_ARRIVED':
        return _BadgeStyle('Driver Arrived', AppColors.warning, Icons.where_to_vote);
      case 'IN_PROGRESS':
        return _BadgeStyle('Trip in progress', AppColors.success, Icons.navigation);
      case 'COMPLETED':
        return _BadgeStyle('Completed', AppColors.success, Icons.check_circle);
      case 'CANCELLED':
        return _BadgeStyle('Cancelled', AppColors.error, Icons.cancel);
      case 'NO_DRIVER':
      case 'NO_DRIVER_AVAILABLE':
        return _BadgeStyle('No Driver Found', AppColors.error, Icons.car_crash);
      default:
        return _BadgeStyle(status, AppColors.textSecondary, Icons.info_outline);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = _style;
    final pad = large
        ? const EdgeInsets.symmetric(horizontal: 16, vertical: 8)
        : const EdgeInsets.symmetric(horizontal: 10, vertical: 4);
    final iconSize = large ? 18.0 : 14.0;
    final fontSize = large ? 14.0 : 12.0;

    return Container(
      padding: pad,
      decoration: BoxDecoration(
        color: s.color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(100),
        border: Border.all(color: s.color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(s.icon, size: iconSize, color: s.color),
          const SizedBox(width: 5),
          Text(s.label,
              style: TextStyle(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w700,
                  color: s.color)),
        ],
      ),
    );
  }
}

class _BadgeStyle {
  final String label;
  final Color color;
  final IconData icon;
  _BadgeStyle(this.label, this.color, this.icon);
}
