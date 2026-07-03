import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../constants/colors.dart';
import '../../models/models.dart';
import '../../providers/app_providers.dart';
import '../../utils/formatters.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  bool _isInit = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadData();
      });
      _isInit = false;
    }
  }

  Future<void> _loadData() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final monthKey = DateFormat('yyyy-MM').format(DateTime.now());

    await Future.wait([
      Provider.of<FinanceProvider>(context, listen: false).loadAllShopsFinanceData(auth.currentShop),
      Provider.of<FinanceProvider>(context, listen: false).loadCommitments(auth.currentShop, monthKey),
      Provider.of<DebtProvider>(context, listen: false).loadDebtData(),
      Provider.of<AttendanceProvider>(context, listen: false).loadStaffData(),
      Provider.of<AttendanceProvider>(context, listen: false).loadAllSalaryPayments(),
    ]);
  }

  // Quick Action Forms
  void _showAddTransactionDialog(TransactionType type) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final amountController = TextEditingController();
    final descController = TextEditingController();
    String category = type == TransactionType.income ? 'Fresh Juices' : 'Miscellaneous';
    PaymentMethod method = PaymentMethod.cash;

    final incomeCategories = ['Fresh Juices', 'Milkshakes', 'Spl Juices', 'Zomato Sales', 'Other Income'];
    final expenseCategories = ['Fruits & Vegetables', 'Packaging & Plastics', 'Other Supplies', 'Salary', 'Rent', 'Electricity', 'Miscellaneous'];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(type == TransactionType.income ? 'Add Shop Income' : 'Add Shop Expense'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₹)'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: (type == TransactionType.income ? incomeCategories : expenseCategories)
                    .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) category = val;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<PaymentMethod>(
                value: method,
                decoration: const InputDecoration(labelText: 'Payment Method'),
                items: PaymentMethod.values
                    .map((m) => DropdownMenuItem(value: m, child: Text(m.name.toUpperCase())))
                    .toList(),
                onChanged: (val) {
                  if (val != null) method = val;
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'Description / Note'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(amountController.text) ?? 0.0;
              if (amt <= 0) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid amount')));
                return;
              }
              Navigator.pop(ctx);

              final newTx = Transaction(
                id: '',
                type: type,
                paymentMethod: method,
                amount: amt,
                category: category,
                description: descController.text.isNotEmpty ? descController.text : category,
                date: DateTime.now(),
              );

              await Provider.of<FinanceProvider>(context, listen: false).addTransaction(auth.currentShop, newTx);
              _loadData(); // Reload unified dashboard data
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showAddPersonalDialog() {
    final amountController = TextEditingController();
    final descController = TextEditingController();
    String category = 'Personal Use';
    PaymentMethod method = PaymentMethod.cash;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Quick Personal Expense'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: amountController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Amount (₹)'),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: 'Category'),
                items: const [
                  DropdownMenuItem(value: 'Home', child: Text('Home')),
                  DropdownMenuItem(value: 'Personal Use', child: Text('Personal Use')),
                ],
                onChanged: (val) {
                  if (val != null) category = val;
                },
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<PaymentMethod>(
                value: method,
                decoration: const InputDecoration(labelText: 'Payment Method'),
                items: PaymentMethod.values
                    .map((m) => DropdownMenuItem(value: m, child: Text(m.name.toUpperCase())))
                    .toList(),
                onChanged: (val) {
                  if (val != null) method = val;
                },
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'Description / Note'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(amountController.text) ?? 0.0;
              if (amt <= 0) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid amount')));
                return;
              }
              Navigator.pop(ctx);

              final newExp = PersonalExpense(
                id: '',
                amount: amt,
                category: category,
                description: descController.text.isNotEmpty ? descController.text : 'Personal Expense',
                date: DateTime.now(),
                paymentMethod: method,
              );

              await Provider.of<DebtProvider>(context, listen: false).addPersonalExpense(newExp);
              _loadData(); // Refresh metrics
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();
    final auth = context.watch<AuthProvider>();
    final debtProv = context.watch<DebtProvider>();
    final attendanceProv = context.watch<AttendanceProvider>();

    if (finance.isLoading && finance.allTransactions[ShopId.shop1]!.isEmpty) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }

    // Math engine (mimicking DashboardView.tsx)
    // 1. Gather all transactions and annotate with shopId
    final List<Transaction> allTxns = [];
    final Set<String> seenExpenseIds = {};

    void processTransactions(ShopId sid, List<Transaction> list) {
      for (var t in list) {
        if (t.type == TransactionType.expense) {
          if (!seenExpenseIds.contains(t.id)) {
            seenExpenseIds.add(t.id);
            allTxns.add(t);
          }
        } else {
          allTxns.add(t);
        }
      }
    }

    processTransactions(ShopId.shop1, finance.allTransactions[ShopId.shop1] ?? []);
    processTransactions(ShopId.shop2, finance.allTransactions[ShopId.shop2] ?? []);

    allTxns.sort((a, b) => b.date.compareTo(a.date));

    // Combined Totals Calculations
    double cashIncome = 0;
    double gpayIncome = 0;
    double zomatoIncome = 0;
    double cashExpense = 0;
    double gpayExpense = 0;
    double zomatoExpense = 0;

    for (var t in allTxns) {
      if (t.type == TransactionType.income) {
        if (t.paymentMethod == PaymentMethod.cash) cashIncome += t.amount;
        if (t.paymentMethod == PaymentMethod.gpay) gpayIncome += t.amount;
        if (t.paymentMethod == PaymentMethod.zomato) zomatoIncome += t.amount;
      } else {
        if (t.paymentMethod == PaymentMethod.cash) cashExpense += t.amount;
        if (t.paymentMethod == PaymentMethod.gpay) gpayExpense += t.amount;
        if (t.paymentMethod == PaymentMethod.zomato) zomatoExpense += t.amount;
      }
    }

    double cashCommitments = 0;
    double gpayCommitments = 0;
    double zomatoCommitments = 0;
    double totalCommitments = 0;

    for (var p in finance.allCommitmentPayments) {
      totalCommitments += p.paidAmount;
      if (p.partialPayments.isNotEmpty) {
        for (var pp in p.partialPayments) {
          if (pp.paymentMethod == PaymentMethod.cash) cashCommitments += pp.amount;
          if (pp.paymentMethod == PaymentMethod.gpay) gpayCommitments += pp.amount;
          if (pp.paymentMethod == PaymentMethod.zomato) zomatoCommitments += pp.amount;
        }
      } else {
        if (p.paymentMethod == PaymentMethod.cash) cashCommitments += p.paidAmount;
        if (p.paymentMethod == PaymentMethod.gpay) gpayCommitments += p.paidAmount;
        if (p.paymentMethod == PaymentMethod.zomato) zomatoCommitments += p.paidAmount;
      }
    }

    double cashPersonal = 0;
    double gpayPersonal = 0;
    double zomatoPersonal = 0;
    double totalPersonal = 0;

    for (var p in debtProv.personalExpenses) {
      totalPersonal += p.amount;
      if (p.paymentMethod == PaymentMethod.cash) cashPersonal += p.amount;
      if (p.paymentMethod == PaymentMethod.gpay) gpayPersonal += p.amount;
      if (p.paymentMethod == PaymentMethod.zomato) zomatoPersonal += p.amount;
    }

    double cashDebt = 0;
    double gpayDebt = 0;
    double zomatoDebt = 0;
    double totalDebtPayments = 0;
    double totalDebtOutstanding = 0;

    for (var d in debtProv.debts) {
      totalDebtOutstanding += d.remainingAmount;
      for (var p in d.payments) {
        totalDebtPayments += p.amount;
        if (p.paymentMethod == PaymentMethod.cash) cashDebt += p.amount;
        if (p.paymentMethod == PaymentMethod.gpay) gpayDebt += p.amount;
        if (p.paymentMethod == PaymentMethod.zomato) zomatoDebt += p.amount;
      }
    }

    double cashSalary = 0;
    double gpaySalary = 0;
    double zomatoSalary = 0;
    double totalSalary = 0;

    for (var p in attendanceProv.salaryPayments) {
      totalSalary += p.amount;
      if (p.paymentMethod == PaymentMethod.cash) cashSalary += p.amount;
      if (p.paymentMethod == PaymentMethod.gpay) gpaySalary += p.amount;
      if (p.paymentMethod == PaymentMethod.zomato) zomatoSalary += p.amount;
    }

    // Remaining balances
    final cashBalance = cashIncome - cashExpense - cashCommitments - cashPersonal - cashDebt - cashSalary;
    final gpayBalance = gpayIncome - gpayExpense - gpayCommitments - gpayPersonal - gpayDebt - gpaySalary;
    final zomatoBalance = zomatoIncome - zomatoExpense - zomatoCommitments - zomatoPersonal - zomatoDebt - zomatoSalary;

    final totalSalesIncome = cashIncome + gpayIncome + zomatoIncome;
    final shopExpenses = cashExpense + gpayExpense + zomatoExpense;
    final combinedBalance = cashBalance + gpayBalance + zomatoBalance;
    final totalExpenses = shopExpenses + totalCommitments + totalSalary;
    final netProfit = totalSalesIncome - totalExpenses;

    // Yesterday closing calculations (before today's midnight)
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);

    double yestCashIncome = 0;
    double yestGpayIncome = 0;
    double yestZomatoIncome = 0;
    double yestCashExpense = 0;
    double yestGpayExpense = 0;
    double yestZomatoExpense = 0;

    for (var t in allTxns) {
      if (t.date.isBefore(todayStart)) {
        if (t.type == TransactionType.income) {
          if (t.paymentMethod == PaymentMethod.cash) yestCashIncome += t.amount;
          if (t.paymentMethod == PaymentMethod.gpay) yestGpayIncome += t.amount;
          if (t.paymentMethod == PaymentMethod.zomato) yestZomatoIncome += t.amount;
        } else {
          if (t.paymentMethod == PaymentMethod.cash) yestCashExpense += t.amount;
          if (t.paymentMethod == PaymentMethod.gpay) yestGpayExpense += t.amount;
          if (t.paymentMethod == PaymentMethod.zomato) yestZomatoExpense += t.amount;
        }
      }
    }

    double yestCashCommitments = 0;
    double yestGpayCommitments = 0;
    double yestZomatoCommitments = 0;

    for (var p in finance.allCommitmentPayments) {
      if (p.partialPayments.isNotEmpty) {
        for (var pp in p.partialPayments) {
          if (pp.paidDate.isBefore(todayStart)) {
            if (pp.paymentMethod == PaymentMethod.cash) yestCashCommitments += pp.amount;
            if (pp.paymentMethod == PaymentMethod.gpay) yestGpayCommitments += pp.amount;
            if (pp.paymentMethod == PaymentMethod.zomato) yestZomatoCommitments += pp.amount;
          }
        }
      } else {
        if (p.paidDate.isBefore(todayStart)) {
          if (p.paymentMethod == PaymentMethod.cash) yestCashCommitments += p.paidAmount;
          if (p.paymentMethod == PaymentMethod.gpay) yestGpayCommitments += p.paidAmount;
          if (p.paymentMethod == PaymentMethod.zomato) yestZomatoCommitments += p.paidAmount;
        }
      }
    }

    double yestCashPersonal = 0;
    double yestGpayPersonal = 0;
    double yestZomatoPersonal = 0;

    for (var p in debtProv.personalExpenses) {
      if (p.date.isBefore(todayStart)) {
        if (p.paymentMethod == PaymentMethod.cash) yestCashPersonal += p.amount;
        if (p.paymentMethod == PaymentMethod.gpay) yestGpayPersonal += p.amount;
        if (p.paymentMethod == PaymentMethod.zomato) yestZomatoPersonal += p.amount;
      }
    }

    double yestCashDebt = 0;
    double yestGpayDebt = 0;
    double yestZomatoDebt = 0;

    for (var d in debtProv.debts) {
      for (var p in d.payments) {
        if (p.date.isBefore(todayStart)) {
          if (p.paymentMethod == PaymentMethod.cash) yestCashDebt += p.amount;
          if (p.paymentMethod == PaymentMethod.gpay) yestGpayDebt += p.amount;
          if (p.paymentMethod == PaymentMethod.zomato) yestZomatoDebt += p.amount;
        }
      }
    }

    double yestCashSalary = 0;
    double yestGpaySalary = 0;
    double yestZomatoSalary = 0;

    for (var p in attendanceProv.salaryPayments) {
      if (p.paidDate.isBefore(todayStart)) {
        if (p.paymentMethod == PaymentMethod.cash) yestCashSalary += p.amount;
        if (p.paymentMethod == PaymentMethod.gpay) yestGpaySalary += p.amount;
        if (p.paymentMethod == PaymentMethod.zomato) yestZomatoSalary += p.amount;
      }
    }

    final yesterdayCashBalance = yestCashIncome - yestCashExpense - yestCashCommitments - yestCashPersonal - yestCashDebt - yestCashSalary;
    final yesterdayGpayBalance = yestGpayIncome - yestGpayExpense - yestGpayCommitments - yestGpayPersonal - yestGpayDebt - yestGpaySalary;
    final yesterdayZomatoBalance = yestZomatoIncome - yestZomatoExpense - yestZomatoCommitments - yestZomatoPersonal - yestZomatoDebt - yestZomatoSalary;

    // Branch Performance Comparisons
    double getShopIncome(ShopId sid) {
      return (finance.allTransactions[sid] ?? [])
          .where((t) => t.type == TransactionType.income)
          .fold(0.0, (sum, item) => sum + item.amount);
    }
    double getShopExpense(ShopId sid) {
      return (finance.allTransactions[sid] ?? [])
          .where((t) => t.type == TransactionType.expense)
          .fold(0.0, (sum, item) => sum + item.amount);
    }

    final shop1Income = getShopIncome(ShopId.shop1);
    final shop2Income = getShopIncome(ShopId.shop2);
    final shop1Expense = getShopExpense(ShopId.shop1);
    final shop2Expense = getShopExpense(ShopId.shop2);

    final recentTransactions = allTxns.take(8).toList();

    final width = MediaQuery.of(context).size.width;
    final isWidescreen = width > 900;
    final kpiCount = width > 1100 ? 6 : (width > 750 ? 3 : 2);

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Unified Executive Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                gradient: LinearGradient(
                  colors: [AppColors.surface, AppColors.surfaceLight.withOpacity(0.5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                    ),
                    child: const Text(
                      'UNIFIED EXECUTIVE DASHBOARD',
                      style: TextStyle(
                        fontSize: 9,
                        color: AppColors.primaryLight,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    'Combined Analytics Dashboard',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Reviewing combined results, revenue streams, and expense reports across both Theppakulam and Anuppanadi shop branches.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Quick Actions Buttons
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ElevatedButton.icon(
                  onPressed: () => _showAddTransactionDialog(TransactionType.income),
                  icon: const Text('📈', style: TextStyle(fontSize: 14)),
                  label: const Text('Add Shop Income', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981).withOpacity(0.2),
                    foregroundColor: const Color(0xFF34D399),
                    side: const BorderSide(color: Color(0xFF059669), width: 1),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: () => _showAddTransactionDialog(TransactionType.expense),
                  icon: const Text('📉', style: TextStyle(fontSize: 14)),
                  label: const Text('Add Shop Expense', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
                    foregroundColor: const Color(0xFFFBBF24),
                    side: const BorderSide(color: Color(0xFFD97706), width: 1),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _showAddPersonalDialog,
                  icon: const Text('💜', style: TextStyle(fontSize: 14)),
                  label: const Text('Add Quick Personal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary.withOpacity(0.2),
                    foregroundColor: AppColors.primaryLight,
                    side: const BorderSide(color: AppColors.primary, width: 1),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // KPI Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: kpiCount,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.4,
              children: [
                _buildKpiCard('Total Cash', cashBalance, Colors.amber, 'Hand-cash balance', yesterdayCashBalance),
                _buildKpiCard('Total GPay', gpayBalance, Colors.lightBlue, 'Direct digital bank', yesterdayGpayBalance),
                _buildKpiCard('Total Zomato', zomatoBalance, Colors.orange, 'Zomato platform sales', yesterdayZomatoBalance),
                _buildKpiCard('Total Balance', combinedBalance, Colors.green, 'Combined cash & bank', null),
                _buildKpiCard('Total Expenses', totalExpenses, Colors.red, 'Aggregated expenditure', null),
                _buildKpiCard('Net Profit', netProfit, netProfit >= 0 ? Colors.green : Colors.red, 'Overall sales - costs', null),
              ],
            ),
            const SizedBox(height: 24),

            // Responsive Comparison Charts
            if (isWidescreen)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: _buildBranchComparisonCard(shop1Income, shop2Income, shop1Expense, shop2Expense),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildPaymentSplitCard(cashBalance, gpayBalance, zomatoBalance),
                  ),
                ],
              )
            else ...[
              _buildBranchComparisonCard(shop1Income, shop2Income, shop1Expense, shop2Expense),
              const SizedBox(height: 16),
              _buildPaymentSplitCard(cashBalance, gpayBalance, zomatoBalance),
            ],
            const SizedBox(height: 24),

            // Recent activity ledger
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Combined Branch Activity Ledger',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 16),
                    if (recentTransactions.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Center(
                          child: Text('No transactions recorded in database.', style: TextStyle(color: AppColors.textMuted)),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: recentTransactions.length,
                        separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                        itemBuilder: (context, index) {
                          final t = recentTransactions[index];
                          final isIncome = t.type == TransactionType.income;
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: (isIncome ? Colors.green : Colors.red).withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(isIncome ? '📈' : '📉', style: const TextStyle(fontSize: 14)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        t.description,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        '${t.category} · ${t.paymentMethod.name.toUpperCase()} · ${DateFormat('dd MMM yyyy').format(t.date)}',
                                        style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  '${isIncome ? '+' : '-'}${Formatters.fmt(t.amount)}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: isIncome ? AppColors.success : AppColors.danger,
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String title, double val, Color color, String subtitle, double? yestVal) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (yestVal != null)
                Text(
                  'Yest: ${Formatters.fmtShort(yestVal)}',
                  style: const TextStyle(fontSize: 8, color: AppColors.textMuted, fontWeight: FontWeight.bold),
                ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                Formatters.fmt(val),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 9, color: AppColors.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBranchComparisonCard(double shop1Inc, double shop2Inc, double shop1Exp, double shop2Exp) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Branch Performance Comparison',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF10B981))),
                            const SizedBox(width: 8),
                            const Text('Theppakulam', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          Formatters.fmt(shop1Inc),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF10B981)),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(width: 8, height: 8, decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF8B5CF6))),
                            const SizedBox(width: 8),
                            const Text('Anuppanadi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          Formatters.fmt(shop2Inc),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF8B5CF6)),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  barGroups: [
                    BarChartGroupData(
                      x: 0,
                      barRods: [
                        BarChartRodData(toY: shop1Inc, color: const Color(0xFF10B981), width: 20, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
                      ],
                    ),
                    BarChartGroupData(
                      x: 1,
                      barRods: [
                        BarChartRodData(toY: shop2Inc, color: const Color(0xFF8B5CF6), width: 20, borderRadius: const BorderRadius.vertical(top: Radius.circular(4))),
                      ],
                    ),
                  ],
                  titlesData: FlTitlesData(
                    show: true,
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (val, _) {
                          if (val == 0) return const Text('Theppakulam', style: TextStyle(fontSize: 10, color: AppColors.textSecondary));
                          if (val == 1) return const Text('Anuppanadi', style: TextStyle(fontSize: 10, color: AppColors.textSecondary));
                          return const Text('');
                        },
                      ),
                    ),
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 45,
                        getTitlesWidget: (val, _) => Text(Formatters.fmtShort(val), style: const TextStyle(fontSize: 8, fontFamily: 'monospace', color: AppColors.textMuted)),
                      ),
                    ),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  gridData: const FlGridData(show: false),
                  borderData: FlBorderData(show: false),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentSplitCard(double cash, double gpay, double zomato) {
    final cashVal = cash > 0 ? cash : 0.0;
    final gpayVal = gpay > 0 ? gpay : 0.0;
    final zomatoVal = zomato > 0 ? zomato : 0.0;
    final total = cashVal + gpayVal + zomatoVal;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Revenue Payment Split',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (total == 0)
              const SizedBox(
                height: 220,
                child: Center(
                  child: Text('No active revenue split.', style: TextStyle(color: AppColors.textMuted)),
                ),
              )
            else ...[
              SizedBox(
                height: 130,
                child: PieChart(
                  PieChartData(
                    sectionsSpace: 4,
                    centerSpaceRadius: 35,
                    sections: [
                      if (cashVal > 0) PieChartSectionData(color: Colors.amber[700]!, value: cashVal, title: '', radius: 15),
                      if (gpayVal > 0) PieChartSectionData(color: Colors.lightBlue, value: gpayVal, title: '', radius: 15),
                      if (zomatoVal > 0) PieChartSectionData(color: Colors.orange, value: zomatoVal, title: '', radius: 15),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              _buildPaymentLegendRow('Cash', cashVal, Colors.amber[700]!),
              _buildPaymentLegendRow('GPay', gpayVal, Colors.lightBlue),
              _buildPaymentLegendRow('Zomato', zomatoVal, Colors.orange),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentLegendRow(String label, double val, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(shape: BoxShape.circle, color: color)),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            ],
          ),
          Text(Formatters.fmt(val), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}
