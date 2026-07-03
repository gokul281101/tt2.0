import 'package:flutter/foundation.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  bool _isLoading = false;
  bool _isLoggedIn = false;
  String _email = '';
  ShopId _currentShop = ShopId.shop1;
  String _errorMessage = '';

  bool get isLoading => _isLoading;
  bool get isLoggedIn => _isLoggedIn;
  String get email => _email;
  ShopId get currentShop => _currentShop;
  String get errorMessage => _errorMessage;

  final ApiService _api = ApiService.instance;

  Future<void> tryAutoLogin() async {
    _isLoading = true;
    notifyListeners();

    try {
      final loggedIn = await _api.isLoggedIn();
      _isLoggedIn = loggedIn;
      if (loggedIn) {
        _email = 'admin@jsfinance.com';
      }
    } catch (_) {
      _isLoggedIn = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> login(String password) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final res = await _api.login(password);
      if (res['success'] == true) {
        _isLoggedIn = true;
        _email = res['email'] ?? 'admin@jsfinance.com';
        _isLoading = false;
        notifyListeners();
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    await _api.logout();
    _isLoggedIn = false;
    _email = '';
    notifyListeners();
  }

  void changeShop(ShopId shop) {
    _currentShop = shop;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = '';
    notifyListeners();
  }
}

class FinanceProvider extends ChangeNotifier {
  List<Transaction> _transactions = [];
  List<Purchase> _purchases = [];
  Map<ShopId, List<Transaction>> _allTransactions = {
    ShopId.shop1: [],
    ShopId.shop2: [],
  };
  Map<ShopId, List<Purchase>> _allPurchases = {
    ShopId.shop1: [],
    ShopId.shop2: [],
  };
  List<Commitment> _commitments = [];
  List<CommitmentPayment> _commitmentPayments = [];
  List<CommitmentPayment> _allCommitmentPayments = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<Transaction> get transactions => _transactions;
  List<Purchase> get purchases => _purchases;
  Map<ShopId, List<Transaction>> get allTransactions => _allTransactions;
  Map<ShopId, List<Purchase>> get allPurchases => _allPurchases;
  List<Commitment> get commitments => _commitments;
  List<CommitmentPayment> get commitmentPayments => _commitmentPayments;
  List<CommitmentPayment> get allCommitmentPayments => _allCommitmentPayments;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  final ApiService _api = ApiService.instance;

  Future<void> loadFinanceData(ShopId shopId) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final txs = await _api.getTransactions(shopId);
      final buy = await _api.getPurchases(shopId);
      _transactions = txs;
      _purchases = buy;
      _allTransactions[shopId] = txs;
      _allPurchases[shopId] = buy;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAllShopsFinanceData(ShopId activeShopId) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final results = await Future.wait([
        _api.getTransactions(ShopId.shop1),
        _api.getTransactions(ShopId.shop2),
        _api.getPurchases(ShopId.shop1),
        _api.getPurchases(ShopId.shop2),
      ]);
      _allTransactions[ShopId.shop1] = results[0] as List<Transaction>;
      _allTransactions[ShopId.shop2] = results[1] as List<Transaction>;
      _allPurchases[ShopId.shop1] = results[2] as List<Purchase>;
      _allPurchases[ShopId.shop2] = results[3] as List<Purchase>;

      // Sync the active shop
      _transactions = _allTransactions[activeShopId] ?? [];
      _purchases = _allPurchases[activeShopId] ?? [];
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addTransaction(ShopId shopId, Transaction t) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addTransaction(shopId, t);
      _transactions.insert(0, added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteTransaction(ShopId shopId, String id, TransactionType type) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deleteTransaction(shopId, id, type);
      _transactions.removeWhere((tx) => tx.id == id && tx.type == type);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addPurchase(ShopId shopId, Purchase p) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addPurchase(shopId, p);
      _purchases.insert(0, added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deletePurchase(ShopId shopId, String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deletePurchase(shopId, id);
      _purchases.removeWhere((p) => p.id == id);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadCommitments(ShopId shopId, String monthKey) async {
    _isLoading = true;
    notifyListeners();
    try {
      final data = await _api.getCommitments(shopId, monthKey);
      _commitments = data['commitments'] as List<Commitment>;
      _commitmentPayments = data['payments'] as List<CommitmentPayment>;
      _allCommitmentPayments = (data['allPayments'] as List<dynamic>?)
              ?.map((item) => CommitmentPayment.fromJson(item))
              .toList() ??
          [];
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addCommitment(ShopId shopId, Commitment c) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addCommitment(shopId, c);
      _commitments.add(added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteCommitment(ShopId shopId, String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deleteCommitment(shopId, id);
      _commitments.removeWhere((c) => c.id == id);
      _commitmentPayments.removeWhere((p) => p.commitmentId == id);
      _allCommitmentPayments.removeWhere((p) => p.commitmentId == id);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> payCommitment(ShopId shopId, String commitmentId, String monthKey, double amount, PaymentMethod method, DateTime date, String note) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updatedPayment = await _api.payCommitment(shopId, commitmentId, monthKey, amount, method, date, note);
      
      final index = _commitmentPayments.indexWhere((p) => p.commitmentId == commitmentId && p.monthKey == monthKey);
      if (index != -1) {
        _commitmentPayments[index] = updatedPayment;
      } else {
        _commitmentPayments.add(updatedPayment);
      }

      final allIndex = _allCommitmentPayments.indexWhere((p) => p.commitmentId == commitmentId && p.monthKey == monthKey);
      if (allIndex != -1) {
        _allCommitmentPayments[allIndex] = updatedPayment;
      } else {
        _allCommitmentPayments.add(updatedPayment);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteCommitmentPartialPayment(ShopId shopId, String commitmentId, String partialId, String monthKey) async {
    _isLoading = true;
    notifyListeners();
    try {
      final res = await _api.deleteCommitmentPartialPayment(shopId, commitmentId, partialId, monthKey);
      final index = _commitmentPayments.indexWhere((p) => p.commitmentId == commitmentId && p.monthKey == monthKey);
      if (index != -1) {
        if (res == null) {
          _commitmentPayments.removeAt(index);
        } else {
          _commitmentPayments[index] = res;
        }
      }
      final allIndex = _allCommitmentPayments.indexWhere((p) => p.commitmentId == commitmentId && p.monthKey == monthKey);
      if (allIndex != -1) {
        if (res == null) {
          _allCommitmentPayments.removeAt(allIndex);
        } else {
          _allCommitmentPayments[allIndex] = res;
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

class InventoryProvider extends ChangeNotifier {
  List<StockItem> _stock = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<StockItem> get stock => _stock;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  final ApiService _api = ApiService.instance;

  Future<void> loadStock(ShopId shopId) async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final items = await _api.getStock(shopId);
      _stock = items;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addStockItem(ShopId shopId, StockItem s) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addStockItem(shopId, s);
      _stock.add(added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateStockItem(ShopId shopId, String id, Map<String, dynamic> fields) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updated = await _api.updateStockItem(shopId, id, fields);
      final idx = _stock.indexWhere((item) => item.id == id);
      if (idx != -1) {
        _stock[idx] = updated;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteStockItem(ShopId shopId, String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deleteStockItem(shopId, id);
      _stock.removeWhere((item) => item.id == id);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

class AttendanceProvider extends ChangeNotifier {
  List<Staff> _staff = [];
  List<AttendanceRecord> _attendance = [];
  List<SalaryPayment> _salaryPayments = [];
  List<dynamic> _salaryReport = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<Staff> get staff => _staff;
  List<AttendanceRecord> get attendance => _attendance;
  List<SalaryPayment> get salaryPayments => _salaryPayments;
  List<dynamic> get salaryReport => _salaryReport;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  final ApiService _api = ApiService.instance;

  Future<void> loadStaffData() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final members = await _api.getStaff();
      _staff = members;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addStaff(Staff s) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addStaff(s);
      _staff.add(added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> updateStaff(String id, Map<String, dynamic> fields) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updated = await _api.updateStaff(id, fields);
      final idx = _staff.indexWhere((m) => m.id == id);
      if (idx != -1) {
        _staff[idx] = updated;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteStaff(String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deleteStaff(id);
      _staff.removeWhere((m) => m.id == id);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAttendance({String? from, String? to}) async {
    _isLoading = true;
    notifyListeners();
    try {
      final records = await _api.getAttendance(from: from, to: to);
      _attendance = records;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> saveAttendance(String staffId, String date, String status) async {
    _isLoading = true;
    notifyListeners();
    try {
      final saved = await _api.saveAttendance(staffId, date, status);
      final idx = _attendance.indexWhere(
        (rec) => rec.staffId == staffId && rec.date.toIso8601String().substring(0, 10) == date.substring(0, 10),
      );
      if (idx != -1) {
        _attendance[idx] = saved;
      } else {
        _attendance.add(saved);
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadSalaryReport(String monthKey) async {
    _isLoading = true;
    notifyListeners();
    try {
      final report = await _api.getSalaryReport(monthKey);
      final payments = await _api.getSalaryPayments(monthKey: monthKey);
      _salaryReport = report;
      _salaryPayments = payments;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> paySalary(String staffId, String staffName, String monthKey, double amount, PaymentMethod method, DateTime date, String note) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.paySalary(staffId, staffName, monthKey, amount, method, date, note);
      _salaryPayments.add(added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteSalaryPayment(String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deleteSalaryPayment(id);
      _salaryPayments.removeWhere((p) => p.id == id);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadAllSalaryPayments() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();
    try {
      final payments = await _api.getSalaryPayments();
      _salaryPayments = payments;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

class DebtProvider extends ChangeNotifier {
  List<Debt> _debts = [];
  List<PersonalExpense> _personalExpenses = [];
  bool _isLoading = false;
  String _errorMessage = '';

  List<Debt> get debts => _debts;
  List<PersonalExpense> get personalExpenses => _personalExpenses;
  bool get isLoading => _isLoading;
  String get errorMessage => _errorMessage;

  final ApiService _api = ApiService.instance;

  Future<void> loadDebtData() async {
    _isLoading = true;
    _errorMessage = '';
    notifyListeners();

    try {
      final dList = await _api.getDebts();
      final pList = await _api.getPersonalExpenses();
      _debts = dList;
      _personalExpenses = pList;
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addDebt(Debt d) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addDebt(d);
      _debts.add(added);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> payDebt(String id, double amount, DateTime date, String description, PaymentMethod method) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updated = await _api.payDebt(id, amount, date, description, method);
      final idx = _debts.indexWhere((d) => d.id == id);
      if (idx != -1) {
        _debts[idx] = updated;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteDebt(String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deleteDebt(id);
      _debts.removeWhere((d) => d.id == id);
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deleteDebtPayment(String debtId, String paymentId) async {
    _isLoading = true;
    notifyListeners();
    try {
      final updated = await _api.deleteDebtPayment(debtId, paymentId);
      final idx = _debts.indexWhere((d) => d.id == debtId);
      if (idx != -1) {
        _debts[idx] = updated;
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addPersonalExpense(PersonalExpense e) async {
    _isLoading = true;
    notifyListeners();
    try {
      final added = await _api.addPersonalExpense(e);
      _personalExpenses.insert(0, added);
    } catch (err) {
      _errorMessage = err.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> deletePersonalExpense(String id) async {
    _isLoading = true;
    notifyListeners();
    try {
      await _api.deletePersonalExpense(id);
      _personalExpenses.removeWhere((e) => e.id == id);
    } catch (err) {
      _errorMessage = err.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
