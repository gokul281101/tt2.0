import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static String fmt(double value) {
    if (value.abs() < 0.01) {
      return '₹0';
    }
    final formatted = _currencyFormat.format(value);
    if (formatted == '₹-0' || formatted == '₹-0.0') {
      return '₹0';
    }
    return formatted;
  }

  static String fmtShort(double value) {
    if (value.abs() < 0.01) {
      return '₹0';
    }
    final absVal = value.abs();
    final sign = value < 0 ? '-' : '';
    if (absVal >= 100000) {
      return '$sign₹${(absVal / 100000).toStringAsFixed(1)}L';
    } else if (absVal >= 1000) {
      return '$sign₹${(absVal / 1000).toStringAsFixed(1)}k';
    }
    final valStr = absVal.toStringAsFixed(1).replaceAll(RegExp(r'\.0$'), '');
    if (valStr == '0') return '₹0';
    return '$sign₹$valStr';
  }
}
