// LiteSpark Taxi Color System & Theme
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Brand - LiteSpark Royal Purple & Gold System
  static const primary = Color(0xFF6D28D9);       // LiteSpark Electric Royal Purple
  static const primaryDark = Color(0xFF4C1D95);   // Deep Purple
  static const primaryLight = Color(0xFFF5F3FF);  // Soft Lavender tint
  static const primaryMedium = Color(0xFFEDE9FE); // Lavender border/accent
  
  static const accent = Color(0xFFF59E0B);        // LiteSpark Golden Amber
  static const accentLight = Color(0xFFFEF3C7);   // Soft Gold tint
  static const accentDark = Color(0xFFD97706);    // Deep Gold
  static const gold = Color(0xFFFFD700);          // Bright Sparkling Gold
  static const cyanSpark = Color(0xFF06B6D4);     // Electric Cyan ribbon highlight

  // Backgrounds
  static const bg = Color(0xFFF8F9FA);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceElevated = Color(0xFFFFFFFF);

  // Text
  static const textPrimary = Color(0xFF1E1B4B);   // Deep Indigo/Slate text
  static const textSecondary = Color(0xFF6B7280);
  static const textMuted = Color(0xFF9CA3AF);

  // Status
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);

  // Borders
  static const border = Color(0xFFE5E7EB);
  static const borderLight = Color(0xFFF3F4F6);
}

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.primary,
      primary: AppColors.primary,
      secondary: AppColors.accent,
      surface: AppColors.surface,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: AppColors.bg,
    textTheme: GoogleFonts.interTextTheme().copyWith(
      displayLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w800,
        fontSize: 32,
        color: AppColors.textPrimary,
      ),
      headlineMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        fontSize: 20,
        color: AppColors.textPrimary,
      ),
      titleMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w600,
        fontSize: 16,
        color: AppColors.textPrimary,
      ),
      bodyLarge: GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 15,
        color: AppColors.textPrimary,
      ),
      bodyMedium: GoogleFonts.inter(
        fontWeight: FontWeight.w400,
        fontSize: 13,
        color: AppColors.textSecondary,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 54),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 16),
        elevation: 2,
        shadowColor: AppColors.primary.withOpacity(0.35),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: const BorderSide(color: AppColors.primary, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.white,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      centerTitle: true,
      titleTextStyle: GoogleFonts.inter(
        fontWeight: FontWeight.w700,
        fontSize: 18,
        color: AppColors.textPrimary,
      ),
      iconTheme: const IconThemeData(color: AppColors.textPrimary),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: Colors.white,
      foregroundColor: AppColors.primary,
      elevation: 4,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: Colors.white,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
  );
}
