import 'package:flutter/material.dart';
import 'package:pointer_interceptor/pointer_interceptor.dart';
import '../core/theme.dart';
import '../core/models.dart';

class FareBreakdownSheet extends StatelessWidget {
  final VehicleOption vehicle;
  final double distanceKm;
  final int durationMin;
  final VoidCallback onBook;
  final bool loading;

  const FareBreakdownSheet({
    super.key,
    required this.vehicle,
    required this.distanceKm,
    required this.durationMin,
    required this.onBook,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    return PointerInterceptor(
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('Fare Breakdown',
                        style: Theme.of(context).textTheme.headlineMedium),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        vehicle.categoryName,
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${distanceKm.toStringAsFixed(1)} km • $durationMin min',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                // Fare lines
                ...vehicle.fareLines.map((line) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 4),
                      child: Row(
                        children: [
                          Text(
                            line['label']?.toString() ?? '',
                            style: const TextStyle(
                                fontSize: 14, color: AppColors.textSecondary),
                          ),
                          const Spacer(),
                          Text(
                            '₹${line['amount'] ?? 0}',
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    )),
                const Divider(height: 24),
                Row(
                  children: [
                    const Text('Total',
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.w800)),
                    const Spacer(),
                    Text(
                      '₹${vehicle.fareTotal}',
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primary),
                    ),
                  ],
                ),
                if (vehicle.minimumFareApplied) ...[
                  const SizedBox(height: 4),
                  const Text(
                    '* Minimum fare applied',
                    style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                ],
                const SizedBox(height: 20),
                // Payment options
                _PaymentRow(),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: loading ? null : onBook,
                  child: loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Book Ride'),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    ),);
  }
}

class _PaymentRow extends StatefulWidget {
  @override
  State<_PaymentRow> createState() => _PaymentRowState();
}

class _PaymentRowState extends State<_PaymentRow> {
  int _selected = 0;
  final _methods = [
    {'icon': Icons.money, 'label': 'Cash'},
    {'icon': Icons.account_balance_wallet, 'label': 'UPI'},
  ];

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(_methods.length, (i) {
        final m = _methods[i];
        final sel = _selected == i;
        return Expanded(
          child: GestureDetector(
            onTap: () => setState(() => _selected = i),
            child: Container(
              margin: EdgeInsets.only(right: i == 0 ? 8 : 0),
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: sel ? AppColors.primaryLight : AppColors.bg,
                border: Border.all(
                  color: sel ? AppColors.primary : AppColors.border,
                  width: sel ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(m['icon'] as IconData,
                      size: 16,
                      color: sel ? AppColors.primary : AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(m['label'] as String,
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: sel ? AppColors.primary : AppColors.textSecondary)),
                ],
              ),
            ),
          ),
        );
      }),
    );
  }
}
