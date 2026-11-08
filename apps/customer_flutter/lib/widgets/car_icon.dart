import 'dart:math' as math;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../core/brand_assets.dart';

/// Renders a photorealistic top-down LiteSpark taxi marker matching the logo.
/// Pre-caches 24 rotated variants (15° apart) for smooth live map movement.
class CarIcons {
  static const int _steps = 24;
  static const double _px = 160; // render size
  static final List<BitmapDescriptor?> _cache = List.filled(_steps, null);
  static bool _loading = false;
  static ui.Image? _baseImage;

  static bool get ready => _cache.every((e) => e != null);

  /// Pre-generate all rotations. Safe to call multiple times.
  static Future<void> load() async {
    if (ready || _loading) return;
    _loading = true;
    try {
      if (_baseImage == null) {
        try {
          final codec = await ui.instantiateImageCodec(BrandAssets.carBytes);
          final frame = await codec.getNextFrame();
          _baseImage = frame.image;
        } catch (e) {
          debugPrint('Failed to decode carBytes: $e');
        }
      }

      for (int i = 0; i < _steps; i++) {
        _cache[i] = await _render(i * 360.0 / _steps);
      }
    } finally {
      _loading = false;
    }
  }

  /// Icon pointing toward [heading] degrees (0 = north, clockwise).
  static BitmapDescriptor? forHeading(double heading) {
    final h = ((heading % 360) + 360) % 360;
    final idx = (h / (360 / _steps)).round() % _steps;
    return _cache[idx];
  }

  static Future<BitmapDescriptor> _render(double deg) async {
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder, const Rect.fromLTWH(0, 0, _px, _px));
    final c = const Offset(_px / 2, _px / 2);

    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.rotate(deg * math.pi / 180);

    if (_baseImage != null) {
      // Draw photorealistic LiteSpark sedan
      const dw = 48.0;
      const dh = 90.0;
      final src = Rect.fromLTWH(0, 0, _baseImage!.width.toDouble(), _baseImage!.height.toDouble());
      final dst = Rect.fromCenter(center: Offset.zero, width: dw, height: dh);
      canvas.drawImageRect(_baseImage!, src, dst, Paint()..filterQuality = FilterQuality.high);
    } else {
      // Direct vector fallback: White car with LiteSpark Royal Purple roof & gold star
      // Drop shadow
      final shadowRect = RRect.fromRectAndRadius(
        Rect.fromCenter(center: const Offset(1.5, 3.5), width: 44, height: 86),
        const Radius.circular(16),
      );
      canvas.drawRRect(shadowRect, Paint()..color = const Color(0x38000000)..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5));

      // White Body
      final body = RRect.fromRectAndRadius(
        Rect.fromCenter(center: Offset.zero, width: 42, height: 84),
        const Radius.circular(15),
      );
      canvas.drawRRect(body, Paint()..color = const Color(0xFFFAFAFC));
      canvas.drawRRect(body, Paint()..color = const Color(0xFFD1D5DB)..style = PaintingStyle.stroke..strokeWidth = 1.2);

      // Side mirrors
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: const Offset(-24, -12), width: 8, height: 4), const Radius.circular(2)), Paint()..color = const Color(0xFFFAFAFC));
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: const Offset(24, -12), width: 8, height: 4), const Radius.circular(2)), Paint()..color = const Color(0xFFFAFAFC));

      // Tinted Glass Canopy
      final glass = RRect.fromRectAndRadius(
        Rect.fromCenter(center: const Offset(0, 2), width: 33, height: 58),
        const Radius.circular(10),
      );
      canvas.drawRRect(glass, Paint()..color = const Color(0xFF1E232F));

      // LiteSpark Royal Purple Roof
      final roof = RRect.fromRectAndRadius(
        Rect.fromCenter(center: const Offset(0, 4), width: 29, height: 35),
        const Radius.circular(8),
      );
      canvas.drawRRect(roof, Paint()..color = const Color(0xFF6D28D9));

      // Gold Spark on Roof
      final goldPaint = Paint()..color = const Color(0xFFF59E0B);
      final p = Path();
      const sy = 4.0, sr = 6.0, sw = 2.0;
      p.moveTo(0, sy - sr);
      p.lineTo(sw, sy - sw);
      p.lineTo(sr, sy);
      p.lineTo(sw, sy + sw);
      p.lineTo(0, sy + sr);
      p.lineTo(-sw, sy + sw);
      p.lineTo(-sr, sy);
      p.lineTo(-sw, sy - sw);
      p.close();
      canvas.drawPath(p, goldPaint);

      // Tail lights
      final tail = Paint()..color = const Color(0xFFEF4444);
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: const Offset(-15, 38), width: 6, height: 3), const Radius.circular(1.5)), tail);
      canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: const Offset(15, 38), width: 6, height: 3), const Radius.circular(1.5)), tail);
    }

    canvas.restore();

    final img = await recorder.endRecording().toImage(_px.toInt(), _px.toInt());
    final data = await img.toByteData(format: ui.ImageByteFormat.png);
    return BitmapDescriptor.bytes(data!.buffer.asUint8List(), width: 48, height: 48);
  }
}
