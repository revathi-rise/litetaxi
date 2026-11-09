import 'package:flutter/material.dart';

class BrandAssets {
  static Widget logo({double size = 32, double radius = 8, BoxFit fit = BoxFit.cover}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
      ),
      clipBehavior: Clip.antiAlias,
      child: Image.asset(
        'assets/images/litespark_logo.png',
        width: size,
        height: size,
        fit: fit,
        errorBuilder: (_, __, ___) => Container(
          color: const Color(0xFF581C87),
          child: Icon(Icons.local_taxi, color: Colors.amber, size: size * 0.6),
        ),
      ),
    );
  }
}
