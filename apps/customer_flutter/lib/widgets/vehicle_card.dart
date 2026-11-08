import 'package:flutter/material.dart';
import '../core/theme.dart';
import '../core/models.dart';

class VehicleCard extends StatelessWidget {
  final VehicleOption vehicle;
  final bool selected;
  final VoidCallback onTap;

  const VehicleCard({
    super.key,
    required this.vehicle,
    required this.selected,
    required this.onTap,
  });

  IconData get _icon {
    switch (vehicle.categoryCode.toUpperCase()) {
      case 'BIKE':
      case 'MOTO':
        return Icons.two_wheeler;
      case 'AUTO':
        return Icons.electric_rickshaw;
      case 'SUV':
        return Icons.airport_shuttle;
      default:
        return Icons.local_taxi;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: vehicle.available ? onTap : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : Colors.white,
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
            width: selected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Icon(
              _icon,
              size: 34,
              color: selected ? Colors.white : (vehicle.available ? AppColors.primary : AppColors.textMuted),
            ),
            const SizedBox(height: 6),
            // Name
            Text(
              vehicle.categoryName,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: selected ? Colors.white : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 2),
            // Fare
            Text(
              '₹${vehicle.fareTotal}',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: selected ? Colors.white : AppColors.primary,
              ),
            ),
            const SizedBox(height: 2),
            // ETA
            if (vehicle.available)
              Text(
                vehicle.etaMinutes != null
                    ? '${vehicle.etaMinutes} min'
                    : '${vehicle.driversNearby} nearby',
                style: TextStyle(
                  fontSize: 11,
                  color: selected ? Colors.white70 : AppColors.textSecondary,
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.textMuted.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'Unavailable',
                  style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
