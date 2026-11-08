import 'package:flutter/material.dart';

class DriverColors {
  // LiteSpark Brand Colors
  static const Color primary = Color(0xFF6D28D9);      // Royal Purple
  static const Color primaryDark = Color(0xFF4C1D95);
  static const Color primaryLight = Color(0xFFF5F3FF); // Soft Lavender
  static const Color accent = Color(0xFFF59E0B);       // Golden Spark
  static const Color accentDark = Color(0xFFD97706);

  // Status Colors
  static const Color online = Color(0xFF10B981);       // Emerald Green
  static const Color offline = Color(0xFF64748B);      // Slate Grey
  static const Color alert = Color(0xFFEF4444);        // Crimson Red
  static const Color inProgress = Color(0xFF3B82F6);   // Blue

  // UI Neutrals
  static const Color darkBg = Color(0xFF0F172A);
  static const Color cardDark = Color(0xFF1E293B);
  static const Color lightBg = Color(0xFFF8FAFC);
  static const Color surface = Colors.white;
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color border = Color(0xFFE2E8F0);
}

class DriverTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: DriverColors.primary,
        primary: DriverColors.primary,
        secondary: DriverColors.accent,
        surface: DriverColors.surface,
      ),
      scaffoldBackgroundColor: DriverColors.lightBg,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: DriverColors.primaryDark,
        elevation: 0,
        centerTitle: false,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: DriverColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          elevation: 2,
        ),
      ),
    );
  }
}

