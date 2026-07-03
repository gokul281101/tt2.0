import 'dart:convert';

enum TransactionType { income, expense }

enum PaymentMethod { cash, gpay, zomato }

enum ShopId { shop1, shop2 }

enum PurchaseCategory {
  fruitsAndVegetables,
  packagingAndPlastics,
  otherSupplies,
  iceCream,
  dryFruits,
  cleaningUtility,
  essence;

  String get displayName {
    switch (this) {
      case PurchaseCategory.fruitsAndVegetables:
        return 'Fruits & Vegetables';
      case PurchaseCategory.packagingAndPlastics:
        return 'Packaging & Plastics';
      case PurchaseCategory.otherSupplies:
        return 'Other Supplies';
      case PurchaseCategory.iceCream:
        return 'Ice Cream';
      case PurchaseCategory.dryFruits:
        return 'Dry Fruits';
      case PurchaseCategory.cleaningUtility:
        return 'Cleaning Utility';
      case PurchaseCategory.essence:
        return 'Essence';
    }
  }

  static PurchaseCategory fromString(String val) {
    switch (val) {
      case 'Fruits & Vegetables':
        return PurchaseCategory.fruitsAndVegetables;
      case 'Packaging & Plastics':
        return PurchaseCategory.packagingAndPlastics;
      case 'Other Supplies':
        return PurchaseCategory.otherSupplies;
      case 'Ice Cream':
        return PurchaseCategory.iceCream;
      case 'Dry Fruits':
        return PurchaseCategory.dryFruits;
      case 'Cleaning Utility':
        return PurchaseCategory.cleaningUtility;
      case 'Essence':
        return PurchaseCategory.essence;
      default:
        return PurchaseCategory.otherSupplies;
    }
  }
}

enum PurchaseUnit {
  kg,
  gram,
  liter,
  liters,
  packet,
  packets,
  box,
  boxes,
  pcs,
  dozen;

  String get displayName => name;

  static PurchaseUnit fromString(String val) {
    return PurchaseUnit.values.firstWhere(
      (e) => e.name.toLowerCase() == val.toLowerCase(),
      orElse: () => PurchaseUnit.kg,
    );
  }
}

class Transaction {
  final String id;
  final TransactionType type;
  final PaymentMethod paymentMethod;
  final double amount;
  final String category;
  final String description;
  final DateTime date;

  Transaction({
    required this.id,
    required this.type,
    required this.paymentMethod,
    required this.amount,
    required this.category,
    required this.description,
    required this.date,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? json['_id'] ?? '',
      type: json['type'] == 'expense' ? TransactionType.expense : TransactionType.income,
      paymentMethod: _parsePaymentMethod(json['paymentMethod']),
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      category: json['category'] ?? '',
      description: json['description'] ?? '',
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'paymentMethod': paymentMethod.name,
      'amount': amount,
      'category': category,
      'description': description,
      'date': date.toIso8601String(),
    };
  }

  static PaymentMethod _parsePaymentMethod(dynamic val) {
    if (val == 'gpay') return PaymentMethod.gpay;
    if (val == 'zomato') return PaymentMethod.zomato;
    return PaymentMethod.cash;
  }
}

class Purchase {
  final String id;
  final String itemName;
  final PurchaseCategory category;
  final double quantity;
  final PurchaseUnit unit;
  final double pricePerUnit;
  final double totalPrice;
  final DateTime date;
  final String? expenseId;

  Purchase({
    required this.id,
    required this.itemName,
    required this.category,
    required this.quantity,
    required this.unit,
    required this.pricePerUnit,
    required this.totalPrice,
    required this.date,
    this.expenseId,
  });

  factory Purchase.fromJson(Map<String, dynamic> json) {
    return Purchase(
      id: json['id'] ?? json['_id'] ?? '',
      itemName: json['itemName'] ?? json['productName'] ?? '',
      category: PurchaseCategory.fromString(json['category'] ?? ''),
      quantity: (json['quantity'] as num?)?.toDouble() ?? 0.0,
      unit: PurchaseUnit.fromString(json['unit'] ?? ''),
      pricePerUnit: (json['pricePerUnit'] as num?)?.toDouble() ?? 0.0,
      totalPrice: (json['totalPrice'] ?? json['totalAmount'] as num?)?.toDouble() ?? 0.0,
      date: json['date'] != null ? DateTime.parse(json['date']) : (json['purchaseDate'] != null ? DateTime.parse(json['purchaseDate']) : DateTime.now()),
      expenseId: json['expenseId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productName': itemName,
      'category': category.displayName,
      'quantity': quantity,
      'unit': unit.displayName,
      'pricePerUnit': pricePerUnit,
      'totalAmount': totalPrice,
      'purchaseDate': date.toIso8601String(),
      'expenseId': expenseId,
    };
  }
}

class Commitment {
  final String id;
  final String name;
  final String emoji;
  final double amount;
  final int dueDay;
  final String color;

  Commitment({
    required this.id,
    required this.name,
    required this.emoji,
    required this.amount,
    required this.dueDay,
    required this.color,
  });

  factory Commitment.fromJson(Map<String, dynamic> json) {
    return Commitment(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      emoji: json['emoji'] ?? '🏪',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      dueDay: json['dueDay'] as int? ?? 1,
      color: json['color'] ?? '#7c3aed',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'emoji': emoji,
      'amount': amount,
      'dueDay': dueDay,
      'color': color,
    };
  }
}

class PartialPayment {
  final String id;
  final double amount;
  final PaymentMethod paymentMethod;
  final DateTime paidDate;
  final String note;

  PartialPayment({
    required this.id,
    required this.amount,
    required this.paymentMethod,
    required this.paidDate,
    required this.note,
  });

  factory PartialPayment.fromJson(Map<String, dynamic> json) {
    return PartialPayment(
      id: json['id'] ?? json['_id'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: Transaction._parsePaymentMethod(json['paymentMethod']),
      paidDate: json['paidDate'] != null ? DateTime.parse(json['paidDate']) : DateTime.now(),
      note: json['note'] ?? '',
    );
  }
}

class CommitmentPayment {
  final String id;
  final String commitmentId;
  final String monthKey;
  final double paidAmount;
  final PaymentMethod paymentMethod;
  final DateTime paidDate;
  final String note;
  final List<PartialPayment> partialPayments;

  CommitmentPayment({
    required this.id,
    required this.commitmentId,
    required this.monthKey,
    required this.paidAmount,
    required this.paymentMethod,
    required this.paidDate,
    required this.note,
    required this.partialPayments,
  });

  factory CommitmentPayment.fromJson(Map<String, dynamic> json) {
    var list = json['partialPayments'] as List?;
    List<PartialPayment> partials = list != null
        ? list.map((i) => PartialPayment.fromJson(i)).toList()
        : [];
    return CommitmentPayment(
      id: json['id'] ?? json['_id'] ?? '',
      commitmentId: json['commitmentId'] ?? '',
      monthKey: json['monthKey'] ?? '',
      paidAmount: (json['paidAmount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: Transaction._parsePaymentMethod(json['paymentMethod']),
      paidDate: json['paidDate'] != null ? DateTime.parse(json['paidDate']) : DateTime.now(),
      note: json['note'] ?? '',
      partialPayments: partials,
    );
  }
}

class StockItem {
  final String id;
  final String name;
  final PurchaseCategory category;
  final double currentQty;
  final PurchaseUnit unit;
  final double minThreshold;
  final bool wanted;
  final double wantedQty;
  final String wantedNote;

  StockItem({
    required this.id,
    required this.name,
    required this.category,
    required this.currentQty,
    required this.unit,
    required this.minThreshold,
    required this.wanted,
    this.wantedQty = 1.0,
    this.wantedNote = '',
  });

  factory StockItem.fromJson(Map<String, dynamic> json) {
    return StockItem(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? json['productName'] ?? '',
      category: PurchaseCategory.fromString(json['category'] ?? ''),
      currentQty: (json['currentQty'] ?? json['remainingQty'] ?? json['availableQty'] ?? 0 as num).toDouble(),
      unit: PurchaseUnit.fromString(json['unit'] ?? ''),
      minThreshold: (json['minThreshold'] ?? json['minStockLevel'] ?? 0 as num).toDouble(),
      wanted: json['wanted'] ?? json['isWanted'] ?? false,
      wantedQty: (json['wantedQty'] as num?)?.toDouble() ?? 1.0,
      wantedNote: json['wantedNote'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productName': name,
      'availableQty': currentQty,
      'minStockLevel': minThreshold,
      'category': category.displayName,
      'unit': unit.displayName,
      'isWanted': wanted,
    };
  }
}

class PersonalExpense {
  final String id;
  final double amount;
  final String category; // 'Home' | 'Personal Use'
  final String description;
  final DateTime date;
  final PaymentMethod paymentMethod;

  PersonalExpense({
    required this.id,
    required this.amount,
    required this.category,
    required this.description,
    required this.date,
    required this.paymentMethod,
  });

  factory PersonalExpense.fromJson(Map<String, dynamic> json) {
    return PersonalExpense(
      id: json['id'] ?? json['_id'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      category: json['category'] ?? 'Personal Use',
      description: json['description'] ?? '',
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      paymentMethod: Transaction._parsePaymentMethod(json['paymentMethod']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'amount': amount,
      'category': category,
      'description': description,
      'date': date.toIso8601String(),
      'paymentMethod': paymentMethod.name,
    };
  }
}

class DebtPayment {
  final String id;
  final double amount;
  final DateTime date;
  final String description;
  final PaymentMethod paymentMethod;

  DebtPayment({
    required this.id,
    required this.amount,
    required this.date,
    required this.description,
    required this.paymentMethod,
  });

  factory DebtPayment.fromJson(Map<String, dynamic> json) {
    return DebtPayment(
      id: json['id'] ?? json['_id'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      description: json['description'] ?? '',
      paymentMethod: Transaction._parsePaymentMethod(json['paymentMethod']),
    );
  }
}

class Debt {
  final String id;
  final String debtName;
  final String creditorName;
  final double originalAmount;
  final double remainingAmount;
  final DateTime dueDate;
  final List<DebtPayment> payments;
  final String status; // 'pending' | 'paid'

  Debt({
    required this.id,
    required this.debtName,
    required this.creditorName,
    required this.originalAmount,
    required this.remainingAmount,
    required this.dueDate,
    required this.payments,
    required this.status,
  });

  factory Debt.fromJson(Map<String, dynamic> json) {
    var list = json['payments'] as List?;
    List<DebtPayment> pyList = list != null
        ? list.map((i) => DebtPayment.fromJson(i)).toList()
        : [];
    return Debt(
      id: json['id'] ?? json['_id'] ?? '',
      debtName: json['debtName'] ?? '',
      creditorName: json['creditorName'] ?? '',
      originalAmount: (json['originalAmount'] as num?)?.toDouble() ?? 0.0,
      remainingAmount: (json['remainingAmount'] as num?)?.toDouble() ?? 0.0,
      dueDate: json['dueDate'] != null ? DateTime.parse(json['dueDate']) : DateTime.now(),
      payments: pyList,
      status: json['status'] ?? 'pending',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'debtName': debtName,
      'creditorName': creditorName,
      'originalAmount': originalAmount,
      'dueDate': dueDate.toIso8601String(),
    };
  }
}

class WageHistoryEntry {
  final double dailyWage;
  final String effectiveDate;

  WageHistoryEntry({
    required this.dailyWage,
    required this.effectiveDate,
  });

  factory WageHistoryEntry.fromJson(Map<String, dynamic> json) {
    return WageHistoryEntry(
      dailyWage: (json['dailyWage'] as num?)?.toDouble() ?? 0.0,
      effectiveDate: json['effectiveDate'] ?? '',
    );
  }
}

class Staff {
  final String id;
  final String name;
  final double dailyWage;
  final List<WageHistoryEntry> wageHistory;

  Staff({
    required this.id,
    required this.name,
    required this.dailyWage,
    required this.wageHistory,
  });

  factory Staff.fromJson(Map<String, dynamic> json) {
    var list = json['wageHistory'] as List?;
    List<WageHistoryEntry> history = list != null
        ? list.map((i) => WageHistoryEntry.fromJson(i)).toList()
        : [];
    return Staff(
      id: json['id'] ?? json['_id'] ?? '',
      name: json['name'] ?? '',
      dailyWage: (json['dailyWage'] as num?)?.toDouble() ?? 0.0,
      wageHistory: history,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'dailyWage': dailyWage,
    };
  }
}

class AttendanceRecord {
  final String id;
  final String staffId;
  final DateTime date;
  final String status; // 'present' | 'absent' | 'half-day'

  AttendanceRecord({
    required this.id,
    required this.staffId,
    required this.date,
    required this.status,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] ?? json['_id'] ?? '',
      staffId: json['staffId'] is Map ? (json['staffId']['_id'] ?? '') : (json['staffId'] ?? ''),
      date: json['date'] != null ? DateTime.parse(json['date']) : DateTime.now(),
      status: json['status'] ?? 'present',
    );
  }
}

class SalaryPayment {
  final String id;
  final String staffId;
  final String staffName;
  final String monthKey;
  final double amount;
  final PaymentMethod paymentMethod;
  final DateTime paidDate;
  final String note;

  SalaryPayment({
    required this.id,
    required this.staffId,
    required this.staffName,
    required this.monthKey,
    required this.amount,
    required this.paymentMethod,
    required this.paidDate,
    required this.note,
  });

  factory SalaryPayment.fromJson(Map<String, dynamic> json) {
    return SalaryPayment(
      id: json['id'] ?? json['_id'] ?? '',
      staffId: json['staffId'] ?? '',
      staffName: json['staffName'] ?? '',
      monthKey: json['monthKey'] ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      paymentMethod: Transaction._parsePaymentMethod(json['paymentMethod']),
      paidDate: json['paidDate'] != null ? DateTime.parse(json['paidDate']) : DateTime.now(),
      note: json['note'] ?? '',
    );
  }
}
