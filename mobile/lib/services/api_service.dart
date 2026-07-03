import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  static final ApiService instance = ApiService._internal();
  ApiService._internal();

  String _baseUrl = '';

  Future<String> getBaseUrl() async {
    if (_baseUrl.isNotEmpty) return _baseUrl;

    final prefs = await SharedPreferences.getInstance();
    final customUrl = prefs.getString('jsf_custom_api_url');
    if (customUrl != null && customUrl.isNotEmpty) {
      _baseUrl = customUrl;
      return _baseUrl;
    }

    if (kIsWeb) {
      _baseUrl = 'http://localhost:5001/api';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      _baseUrl = 'http://10.0.2.2:5001/api';
    } else {
      _baseUrl = 'http://localhost:5001/api';
    }
    return _baseUrl;
  }

  Future<void> setCustomBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jsf_custom_api_url', url);
    _baseUrl = url;
  }

  Future<Map<String, String>> _getHeaders([ShopId? shopId]) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jsf_token') ?? '';
    final headers = {
      'Content-Type': 'application/json',
    };
    if (token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (shopId != null) {
      headers['x-shop'] = shopId == ShopId.shop2 ? 'Shop 2' : 'Shop 1';
    }
    return headers;
  }

  // --- Auth API ---

  Future<Map<String, dynamic>> login(String password) async {
    final baseUrl = await getBaseUrl();
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': 'admin@jsfinance.com',
        'password': password,
      }),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Login failed');
    }

    final token = resJson['token'] ?? '';
    final email = resJson['user']?['email'] ?? '';

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jsf_token', token);

    return {'success': true, 'token': token, 'email': email};
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jsf_token');
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('jsf_token');
    return token != null && token.isNotEmpty;
  }

  // --- Transactions / Finance API ---

  Future<List<Transaction>> getTransactions(ShopId shopId) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final incFuture = http.get(Uri.parse('$baseUrl/income?limit=1000'), headers: headers);
    final expFuture = http.get(Uri.parse('$baseUrl/expenses?limit=1000'), headers: headers);

    final responses = await Future.wait([incFuture, expFuture]);
    final incJson = jsonDecode(responses[0].body);
    final expJson = jsonDecode(responses[1].body);

    final List<Transaction> list = [];
    if (incJson['data'] != null) {
      for (var item in incJson['data']) {
        list.add(Transaction.fromJson(item));
      }
    }
    if (expJson['data'] != null) {
      for (var item in expJson['data']) {
        list.add(Transaction.fromJson(item));
      }
    }

    list.sort((a, b) => b.date.compareTo(a.date));
    return list;
  }

  Future<Transaction> addTransaction(ShopId shopId, Transaction transaction) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);
    final url = transaction.type == TransactionType.income
        ? '$baseUrl/income'
        : '$baseUrl/expenses';

    final Map<String, dynamic> body = transaction.type == TransactionType.income
        ? {
            'amount': transaction.amount,
            'paymentMethod': transaction.paymentMethod.name,
            'category': transaction.category,
            'description': transaction.description,
            'date': transaction.date.toIso8601String(),
          }
        : {
            'amount': transaction.amount,
            'type': transaction.category,
            'paymentMethod': transaction.paymentMethod.name,
            'description': transaction.description,
            'date': transaction.date.toIso8601String(),
          };

    final response = await http.post(
      Uri.parse(url),
      headers: headers,
      body: jsonEncode(body),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to save transaction');
    }

    return Transaction.fromJson(resJson['data']);
  }

  Future<void> deleteTransaction(ShopId shopId, String id, TransactionType type) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);
    final url = type == TransactionType.income
        ? '$baseUrl/income/$id'
        : '$baseUrl/expenses/$id';

    final response = await http.delete(Uri.parse(url), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete entry');
    }
  }

  // --- Purchases API ---

  Future<List<Purchase>> getPurchases(ShopId shopId) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.get(Uri.parse('$baseUrl/purchases?limit=1000'), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<Purchase> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(Purchase.fromJson(item));
      }
    }
    return list;
  }

  Future<Purchase> addPurchase(ShopId shopId, Purchase purchase) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.post(
      Uri.parse('$baseUrl/purchases'),
      headers: headers,
      body: jsonEncode(purchase.toJson()),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to save purchase');
    }
    return Purchase.fromJson(resJson['data']);
  }

  Future<void> deletePurchase(ShopId shopId, String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.delete(Uri.parse('$baseUrl/purchases/$id'), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete purchase');
    }
  }

  // --- Commitments API ---

  Future<Map<String, dynamic>> getCommitments(ShopId shopId, String monthKey) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.get(
      Uri.parse('$baseUrl/commitments?monthKey=$monthKey'),
      headers: headers,
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to load commitments');
    }

    final List<Commitment> commitments = [];
    final List<CommitmentPayment> payments = [];
    final List<CommitmentPayment> allPayments = [];

    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        commitments.add(Commitment.fromJson(item));
        if (item['payment'] != null) {
          payments.add(CommitmentPayment.fromJson(item['payment']));
        }
      }
    }

    if (resJson['allPayments'] != null) {
      for (var item in resJson['allPayments']) {
        allPayments.add(CommitmentPayment.fromJson(item));
      }
    }

    return {'commitments': commitments, 'payments': payments, 'allPayments': allPayments};
  }

  Future<Commitment> addCommitment(ShopId shopId, Commitment commitment) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.post(
      Uri.parse('$baseUrl/commitments'),
      headers: headers,
      body: jsonEncode(commitment.toJson()),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to add commitment');
    }
    return Commitment.fromJson(resJson['data']);
  }

  Future<void> deleteCommitment(ShopId shopId, String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.delete(Uri.parse('$baseUrl/commitments/$id'), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete commitment');
    }
  }

  Future<CommitmentPayment> payCommitment(
      ShopId shopId, String commitmentId, String monthKey, double paidAmount, PaymentMethod method, DateTime date, String note) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.post(
      Uri.parse('$baseUrl/commitments/$commitmentId/pay'),
      headers: headers,
      body: jsonEncode({
        'monthKey': monthKey,
        'paidAmount': paidAmount,
        'paymentMethod': method.name,
        'paidDate': date.toIso8601String(),
        'note': note,
      }),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to save commitment payment');
    }
    return CommitmentPayment.fromJson(resJson['data']);
  }

  Future<CommitmentPayment?> deleteCommitmentPartialPayment(ShopId shopId, String commitmentId, String partialId, String monthKey) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.delete(
      Uri.parse('$baseUrl/commitments/$commitmentId/pay/$partialId?monthKey=$monthKey'),
      headers: headers,
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete partial payment');
    }
    return resJson['data'] != null ? CommitmentPayment.fromJson(resJson['data']) : null;
  }

  Future<List<CommitmentPayment>> getCommitmentHistory(ShopId shopId, String commitmentId) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.get(
      Uri.parse('$baseUrl/commitments/$commitmentId/history'),
      headers: headers,
    );
    final resJson = jsonDecode(response.body);
    final List<CommitmentPayment> history = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        history.add(CommitmentPayment.fromJson(item));
      }
    }
    return history;
  }

  // --- Inventory / Stock API ---

  Future<List<StockItem>> getStock(ShopId shopId) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.get(Uri.parse('$baseUrl/inventory'), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<StockItem> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(StockItem.fromJson(item));
      }
    }
    return list;
  }

  Future<StockItem> addStockItem(ShopId shopId, StockItem s) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.post(
      Uri.parse('$baseUrl/inventory'),
      headers: headers,
      body: jsonEncode(s.toJson()),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to add stock item');
    }
    return StockItem.fromJson(resJson['data']);
  }

  Future<StockItem> updateStockItem(ShopId shopId, String id, Map<String, dynamic> fields) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.put(
      Uri.parse('$baseUrl/inventory/$id'),
      headers: headers,
      body: jsonEncode(fields),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to update stock item');
    }
    return StockItem.fromJson(resJson['data']);
  }

  Future<void> deleteStockItem(ShopId shopId, String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders(shopId);

    final response = await http.delete(Uri.parse('$baseUrl/inventory/$id'), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete stock item');
    }
  }

  // --- Personal Expenses API ---

  Future<List<PersonalExpense>> getPersonalExpenses({String? from, String? to}) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    var url = '$baseUrl/personal';
    final params = <String>[];
    if (from != null) params.add('from=$from');
    if (to != null) params.add('to=$to');
    if (params.isNotEmpty) url += '?${params.join('&')}';

    final response = await http.get(Uri.parse(url), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<PersonalExpense> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(PersonalExpense.fromJson(item));
      }
    }
    return list;
  }

  Future<PersonalExpense> addPersonalExpense(PersonalExpense expense) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.post(
      Uri.parse('$baseUrl/personal'),
      headers: headers,
      body: jsonEncode(expense.toJson()),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to save personal expense');
    }
    return PersonalExpense.fromJson(resJson['data']);
  }

  Future<void> deletePersonalExpense(String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.delete(Uri.parse('$baseUrl/personal/$id'), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete personal expense');
    }
  }

  // --- Debt API ---

  Future<List<Debt>> getDebts() async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.get(Uri.parse('$baseUrl/debts'), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<Debt> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(Debt.fromJson(item));
      }
    }
    return list;
  }

  Future<Debt> addDebt(Debt debt) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.post(
      Uri.parse('$baseUrl/debts'),
      headers: headers,
      body: jsonEncode(debt.toJson()),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to add debt record');
    }
    return Debt.fromJson(resJson['data']);
  }

  Future<Debt> payDebt(String id, double amount, DateTime date, String description, PaymentMethod method) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.post(
      Uri.parse('$baseUrl/debts/$id/pay'),
      headers: headers,
      body: jsonEncode({
        'amount': amount,
        'date': date.toIso8601String(),
        'description': description,
        'paymentMethod': method.name,
      }),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to submit payment');
    }
    return Debt.fromJson(resJson['data']);
  }

  Future<void> deleteDebt(String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.delete(Uri.parse('$baseUrl/debts/$id'), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete debt');
    }
  }

  Future<Debt> deleteDebtPayment(String debtId, String paymentId) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.delete(
      Uri.parse('$baseUrl/debts/$debtId/payments/$paymentId'),
      headers: headers,
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete payment');
    }
    return Debt.fromJson(resJson['data']);
  }

  // --- Staff & Attendance API ---

  Future<List<Staff>> getStaff() async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.get(Uri.parse('$baseUrl/attendance/staff'), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<Staff> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(Staff.fromJson(item));
      }
    }
    return list;
  }

  Future<Staff> addStaff(Staff s) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.post(
      Uri.parse('$baseUrl/attendance/staff'),
      headers: headers,
      body: jsonEncode(s.toJson()),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to create staff');
    }
    return Staff.fromJson(resJson['data']);
  }

  Future<Staff> updateStaff(String id, Map<String, dynamic> fields) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.put(
      Uri.parse('$baseUrl/attendance/staff/$id'),
      headers: headers,
      body: jsonEncode(fields),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to update staff');
    }
    return Staff.fromJson(resJson['data']);
  }

  Future<void> deleteStaff(String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.delete(Uri.parse('$baseUrl/attendance/staff/$id'), headers: headers);
    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete staff');
    }
  }

  Future<List<AttendanceRecord>> getAttendance({String? from, String? to}) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    var url = '$baseUrl/attendance';
    final params = <String>[];
    if (from != null) params.add('from=$from');
    if (to != null) params.add('to=$to');
    if (params.isNotEmpty) url += '?${params.join('&')}';

    final response = await http.get(Uri.parse(url), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<AttendanceRecord> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(AttendanceRecord.fromJson(item));
      }
    }
    return list;
  }

  Future<AttendanceRecord> saveAttendance(String staffId, String date, String status) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.post(
      Uri.parse('$baseUrl/attendance'),
      headers: headers,
      body: jsonEncode({
        'staffId': staffId,
        'date': date,
        'status': status,
      }),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to log attendance');
    }
    return AttendanceRecord.fromJson(resJson['data']);
  }

  Future<List<dynamic>> getSalaryReport(String monthKey) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.get(
      Uri.parse('$baseUrl/attendance/salary?monthKey=$monthKey'),
      headers: headers,
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to retrieve salary report');
    }
    return resJson['data'] ?? [];
  }

  Future<List<SalaryPayment>> getSalaryPayments({String? monthKey}) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    var url = '$baseUrl/attendance/salaries/payments';
    if (monthKey != null) url += '?monthKey=$monthKey';

    final response = await http.get(Uri.parse(url), headers: headers);
    final resJson = jsonDecode(response.body);

    final List<SalaryPayment> list = [];
    if (resJson['data'] != null) {
      for (var item in resJson['data']) {
        list.add(SalaryPayment.fromJson(item));
      }
    }
    return list;
  }

  Future<SalaryPayment> paySalary(String staffId, String staffName, String monthKey, double amount, PaymentMethod method, DateTime date, String note) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.post(
      Uri.parse('$baseUrl/attendance/salaries/pay'),
      headers: headers,
      body: jsonEncode({
        'staffId': staffId,
        'staffName': staffName,
        'monthKey': monthKey,
        'amount': amount,
        'paymentMethod': method.name,
        'paidDate': date.toIso8601String(),
        'note': note,
      }),
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 && response.statusCode != 201 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to pay salary');
    }
    return SalaryPayment.fromJson(resJson['data']);
  }

  Future<void> deleteSalaryPayment(String id) async {
    final baseUrl = await getBaseUrl();
    final headers = await _getHeaders();

    final response = await http.delete(
      Uri.parse('$baseUrl/attendance/salaries/payments/$id'),
      headers: headers,
    );

    final resJson = jsonDecode(response.body);
    if (response.statusCode != 200 || resJson['success'] != true) {
      throw Exception(resJson['message'] ?? 'Failed to delete salary record');
    }
  }
}
