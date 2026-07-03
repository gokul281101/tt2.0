import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/colors.dart';
import '../../models/models.dart';
import '../../providers/app_providers.dart';
import '../../utils/formatters.dart';

class DebtView extends StatefulWidget {
  const DebtView({super.key});

  @override
  State<DebtView> createState() => _DebtViewState();
}

class _DebtViewState extends State<DebtView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isInit = true;
  String? _expandedDebtId;

  // Personal filter period
  String _filterPeriod = 'all'; // 'all', '90d', '30d', 'this_month'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadDebtData();
      });
      _isInit = false;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadDebtData() {
    Provider.of<DebtProvider>(context, listen: false).loadDebtData();
  }

  void _showAddDebtDialog() {
    final debt = Provider.of<DebtProvider>(context, listen: false);
    final nameController = TextEditingController();
    final creditorController = TextEditingController();
    final amtController = TextEditingController();
    DateTime dueDate = DateTime.now().add(const Duration(days: 30));

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('Add Liability / Loan'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Debt / Loan Name'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: creditorController,
                  decoration: const InputDecoration(labelText: 'Creditor Name'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amtController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Original Amount (₹)'),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final chosen = await showDatePicker(
                      context: context,
                      initialDate: dueDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setStateDialog(() => dueDate = chosen);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Due Date: ${DateFormat('dd MMM yyyy').format(dueDate)}', style: const TextStyle(fontSize: 12)),
                        const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                final creditor = creditorController.text.trim();
                final amt = double.tryParse(amtController.text) ?? 0.0;
                if (name.isEmpty || creditor.isEmpty || amt <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid fields')));
                  return;
                }
                Navigator.pop(ctx);
                await debt.addDebt(Debt(
                  id: '',
                  debtName: name,
                  creditorName: creditor,
                  originalAmount: amt,
                  remainingAmount: amt,
                  dueDate: dueDate,
                  payments: [],
                  status: 'pending',
                ));
              },
              child: const Text('Save Record'),
            ),
          ],
        ),
      ),
    );
  }

  void _showPayDebtDialog(Debt targetDebt) {
    final debtProv = Provider.of<DebtProvider>(context, listen: false);
    final amtController = TextEditingController(text: targetDebt.remainingAmount.toString());
    final descController = TextEditingController(text: 'Partial Payment');
    DateTime payDate = DateTime.now();
    PaymentMethod method = PaymentMethod.gpay;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: Text('Log Repayment: ${targetDebt.debtName}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: amtController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Repayment Amount (₹)'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Repayment Note'),
                ),
                const SizedBox(height: 16),
                const Text('Payment Method', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: PaymentMethod.values.map((m) {
                    final isSelected = method == m;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: isSelected ? AppColors.primary : AppColors.surfaceLight,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          onPressed: () => setStateDialog(() => method = m),
                          child: Text(m.name.toUpperCase(), style: const TextStyle(fontSize: 10)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final chosen = await showDatePicker(
                      context: context,
                      initialDate: payDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setStateDialog(() => payDate = chosen);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Paid Date: ${DateFormat('dd MMM yyyy').format(payDate)}', style: const TextStyle(fontSize: 12)),
                        const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(amtController.text) ?? 0.0;
                if (amt <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid amount')));
                  return;
                }
                Navigator.pop(ctx);
                await debtProv.payDebt(targetDebt.id, amt, payDate, descController.text, method);
              },
              child: const Text('Submit Payment'),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddPersonalDialog() {
    final debtProv = Provider.of<DebtProvider>(context, listen: false);
    final amtController = TextEditingController();
    final descController = TextEditingController();
    String category = 'Home';
    PaymentMethod method = PaymentMethod.cash;
    DateTime date = DateTime.now();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('Log Personal Expense'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: category == 'Home' ? AppColors.accent : AppColors.surfaceLight,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => setStateDialog(() => category = 'Home'),
                        child: const Text('🏠 Home & Family'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: category == 'Personal Use' ? AppColors.primary : AppColors.surfaceLight,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () => setStateDialog(() => category = 'Personal Use'),
                        child: const Text('👤 Personal Use'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<PaymentMethod>(
                  value: method,
                  decoration: const InputDecoration(labelText: 'Payment Method'),
                  dropdownColor: AppColors.surfaceLight,
                  items: PaymentMethod.values
                      .map((m) => DropdownMenuItem(value: m, child: Text(m.name.toUpperCase())))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setStateDialog(() => method = val);
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amtController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Amount (₹)'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: descController,
                  decoration: const InputDecoration(labelText: 'Description / Note'),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final chosen = await showDatePicker(
                      context: context,
                      initialDate: date,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setStateDialog(() => date = chosen);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Date: ${DateFormat('dd MMM yyyy').format(date)}', style: const TextStyle(fontSize: 12)),
                        const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(amtController.text) ?? 0.0;
                final desc = descController.text.trim();
                if (amt <= 0 || desc.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid fields')));
                  return;
                }
                Navigator.pop(ctx);
                await debtProv.addPersonalExpense(PersonalExpense(
                  id: '',
                  amount: amt,
                  category: category,
                  description: desc,
                  date: date,
                  paymentMethod: method,
                ));
              },
              child: const Text('Save Record'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final debtProv = context.watch<DebtProvider>();

    // Debts stats
    double totalOutstanding = 0;
    double totalSettled = 0;
    double originalTotal = 0;

    for (var d in debtProv.debts) {
      originalTotal += d.originalAmount;
      totalOutstanding += d.remainingAmount;
      totalSettled += (d.originalAmount - d.remainingAmount);
    }

    // Personal expenses filters
    final now = DateTime.now();
    final filteredExpenses = debtProv.personalExpenses.where((e) {
      if (_filterPeriod == 'this_month') {
        return e.date.month == now.month && e.date.year == now.year;
      }
      if (_filterPeriod == '30d') {
        final cutoff = now.subtract(const Duration(days: 30));
        return e.date.isAfter(cutoff);
      }
      if (_filterPeriod == '90d') {
        final cutoff = now.subtract(const Duration(days: 90));
        return e.date.isAfter(cutoff);
      }
      return true; // 'all'
    }).toList();

    double personalHome = 0;
    double personalSelf = 0;
    for (var e in filteredExpenses) {
      if (e.category == 'Home') {
        personalHome += e.amount;
      } else {
        personalSelf += e.amount;
      }
    }
    final personalTotal = personalHome + personalSelf;

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(48),
        child: Container(
          color: AppColors.surface,
          child: TabBar(
            controller: _tabController,
            indicatorColor: AppColors.primaryLight,
            labelColor: AppColors.primaryLight,
            unselectedLabelColor: AppColors.textMuted,
            indicatorSize: TabBarIndicatorSize.tab,
            tabs: const [
              Tab(text: 'Liabilities & Loans'),
              Tab(text: 'Personal Ledger'),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: LIABILITIES & LOANS
          RefreshIndicator(
            onRefresh: () async {
              _loadDebtData();
            },
            color: AppColors.primary,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                // Info header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Accounts Payable', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          SizedBox(height: 4),
                          Text('Track bank loans and credit vendor bills', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddDebtDialog,
                        icon: const Icon(Icons.add, size: 14),
                        label: const Text('Add Debt', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 16)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // KPI Stats cards
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: MediaQuery.of(context).size.width > 700 ? 3 : 1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 2.8,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Outstanding Balance', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(Formatters.fmt(totalOutstanding), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.danger)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Repaid So Far', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(Formatters.fmt(totalSettled), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.success)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Original Loan Sum', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(Formatters.fmt(originalTotal), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryLight)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Loan Items List
                if (debtProv.debts.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 48.0),
                    child: Center(child: Text('No liabilities registered in database. Great!', style: TextStyle(color: AppColors.textMuted))),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: debtProv.debts.length,
                    itemBuilder: (context, index) {
                      final d = debtProv.debts[index];
                      final isPaid = d.status == 'paid';
                      final isExpanded = _expandedDebtId == d.id;

                      final pct = d.originalAmount > 0 ? (d.remainingAmount / d.originalAmount).clamp(0.0, 1.0) : 0.0;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Container(
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isPaid ? AppColors.success.withOpacity(0.3) : AppColors.border,
                            ),
                          ),
                          child: Column(
                            children: [
                              ListTile(
                                leading: Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                                  child: const Icon(Icons.handshake_outlined, color: AppColors.primaryLight, size: 16),
                                ),
                                title: Text(d.debtName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                subtitle: Text('Creditor: ${d.creditorName}', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text('Remaining: ${Formatters.fmt(d.remainingAmount)}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isPaid ? AppColors.success : AppColors.danger)),
                                        Text('Due: ${DateFormat('dd MMM yyyy').format(d.dueDate)}', style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
                                      ],
                                    ),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.danger),
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (ctx) => AlertDialog(
                                            title: const Text('Delete Debt'),
                                            content: const Text('Are you sure you want to delete this debt record?'),
                                            actions: [
                                              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                              ElevatedButton(
                                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                                onPressed: () async {
                                                  Navigator.pop(ctx);
                                                  await debtProv.deleteDebt(d.id);
                                                  _loadDebtData();
                                                },
                                                child: const Text('Delete'),
                                              ),
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ],
                                ),
                              ),

                              // Progress bar representing settled fraction
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                child: Column(
                                  children: [
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: LinearProgressIndicator(
                                        value: 1.0 - pct,
                                        backgroundColor: AppColors.surfaceLight,
                                        valueColor: AlwaysStoppedAnimation<Color>(isPaid ? AppColors.success : AppColors.warning),
                                        minHeight: 4,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                  ],
                                ),
                              ),

                              // Action Row
                              Padding(
                                padding: const EdgeInsets.only(left: 16.0, right: 16.0, bottom: 12.0, top: 4.0),
                                child: Row(
                                  children: [
                                    if (!isPaid)
                                      Expanded(
                                        child: ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppColors.surfaceLight,
                                            foregroundColor: AppColors.textSecondary,
                                            elevation: 0,
                                            side: const BorderSide(color: AppColors.border),
                                            padding: const EdgeInsets.symmetric(vertical: 8),
                                          ),
                                          onPressed: () => _showPayDebtDialog(d),
                                          child: const Text('Pay Installment', style: TextStyle(fontSize: 11)),
                                        ),
                                      )
                                    else
                                      Expanded(
                                        child: Container(
                                          alignment: Alignment.center,
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          decoration: BoxDecoration(color: AppColors.success.withOpacity(0.08), borderRadius: BorderRadius.circular(10)),
                                          child: const Text('Fully Settled ✓', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 11)),
                                        ),
                                      ),
                                    if (d.payments.isNotEmpty) ...[
                                      const SizedBox(width: 8),
                                      InkWell(
                                        onTap: () {
                                          setState(() {
                                            _expandedDebtId = isExpanded ? null : d.id;
                                          });
                                        },
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                          decoration: BoxDecoration(borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                                          child: Row(
                                            children: [
                                              Icon(isExpanded ? Icons.expand_less : Icons.expand_more, size: 14, color: AppColors.textSecondary),
                                              const SizedBox(width: 4),
                                              Text('${d.payments.length} logs', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),

                              // Payment logs breakdown
                              if (isExpanded)
                                Container(
                                  decoration: const BoxDecoration(color: AppColors.surfaceLight, borderRadius: BorderRadius.vertical(bottom: Radius.circular(16))),
                                  padding: const EdgeInsets.all(12),
                                  child: ListView.separated(
                                    shrinkWrap: true,
                                    physics: const NeverScrollableScrollPhysics(),
                                    itemCount: d.payments.length,
                                    separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 12),
                                    itemBuilder: (context, idx) {
                                      final p = d.payments[idx];
                                      return Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(DateFormat('dd MMM yyyy').format(p.date), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                              Text(p.description, style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
                                            ],
                                          ),
                                          Row(
                                            children: [
                                              Text(
                                                '${p.paymentMethod.name.toUpperCase()} · -${Formatters.fmt(p.amount)}',
                                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.danger),
                                              ),
                                              const SizedBox(width: 8),
                                              IconButton(
                                                icon: const Icon(Icons.close, size: 12, color: AppColors.danger),
                                                onPressed: () async {
                                                  await debtProv.deleteDebtPayment(d.id, p.id);
                                                  _loadDebtData();
                                                },
                                              ),
                                            ],
                                          ),
                                        ],
                                      );
                                    },
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),

          // TAB 2: PERSONAL LEDGER
          RefreshIndicator(
            onRefresh: () async {
              _loadDebtData();
            },
            color: AppColors.primary,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                // Info header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Personal Ledger', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          SizedBox(height: 4),
                          Text('Household spendings (Non-business)', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddPersonalDialog,
                        icon: const Icon(Icons.add, size: 14),
                        label: const Text('Add Spend', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent, padding: const EdgeInsets.symmetric(horizontal: 16)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Period Filter presets
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildPresetChip('all', 'All Time'),
                      const SizedBox(width: 8),
                      _buildPresetChip('90d', 'Last 90 Days'),
                      const SizedBox(width: 8),
                      _buildPresetChip('30d', 'Last 30 Days'),
                      const SizedBox(width: 8),
                      _buildPresetChip('this_month', 'This Month'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Personal KPI cards
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: MediaQuery.of(context).size.width > 700 ? 3 : 1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 2.8,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Total Outgoings', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(Formatters.fmt(personalTotal), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.accent)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Home & Family Spend', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(Formatters.fmt(personalHome), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blue)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('Leisure & Personal Spend', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text(Formatters.fmt(personalSelf), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.purple)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Personal ledger list
                if (filteredExpenses.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 48.0),
                    child: Center(child: Text('No personal expenses logged in this period.', style: TextStyle(color: AppColors.textMuted))),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: filteredExpenses.length,
                    separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                    itemBuilder: (context, index) {
                      final e = filteredExpenses[index];
                      final isHome = e.category == 'Home';
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: (isHome ? Colors.blue : Colors.purple).withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(isHome ? Icons.home_outlined : Icons.person_outline, color: isHome ? Colors.blue : Colors.purple, size: 16),
                        ),
                        title: Text(e.description, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Text(
                          '${e.category} · ${e.paymentMethod.name.toUpperCase()} · ${DateFormat('dd MMM yyyy').format(e.date)}',
                          style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(Formatters.fmt(e.amount), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.accent)),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.danger),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: const Text('Delete Personal Expense'),
                                    content: const Text('Are you sure you want to delete this personal expense posting?'),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                      ElevatedButton(
                                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                        onPressed: () async {
                                          Navigator.pop(ctx);
                                          await debtProv.deletePersonalExpense(e.id);
                                          _loadDebtData();
                                        },
                                        child: const Text('Delete'),
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPresetChip(String key, String label) {
    final isSelected = _filterPeriod == key;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: AppColors.primary.withOpacity(0.2),
      backgroundColor: AppColors.surface,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _filterPeriod = key;
          });
        }
      },
    );
  }
}
