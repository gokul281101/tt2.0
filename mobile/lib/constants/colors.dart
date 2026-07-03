import 'package:flutter/material.dart';

class AppColors {
  static const Color background = Color(0xFF0D0E12);
  static const Color surface = Color(0xFF16181F);
  static const Color surfaceLight = Color(0xFF20232E);
  static const Color border = Color(0xFF282C3D);

  static const Color primary = Color(0xFF8B5CF6); // Violet
  static const Color primaryLight = Color(0xFFA78BFA);
  
  static const Color accent = Color(0xFF3B82F6); // Blue
  static const Color accentLight = Color(0xFF60A5FA);

  static const Color success = Color(0xFF10B981); // Emerald
  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color danger = Color(0xFFEF4444); // Rose
  
  static const Color textPrimary = Color(0xFFF8FAFC);
  static const Color textSecondary = Color(0xFF94A3B8);
  static const Color textMuted = Color(0xFF64748B);

  // Gradients
  static const Gradient primaryGradient = LinearGradient(
    colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient accentGradient = LinearGradient(
    colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const Gradient surfaceGradient = LinearGradient(
    colors: [Color(0xFF16181F), Color(0xFF1E212E)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
