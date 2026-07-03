import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/colors.dart';
import '../../models/models.dart';
import '../../providers/app_providers.dart';
import '../../utils/formatters.dart';

class CommitmentsView extends StatefulWidget {
  const CommitmentsView({super.key});

  @override
  State<CommitmentsView> createState() => _CommitmentsViewState();
}

class _CommitmentsViewState extends State<CommitmentsView> {
  String _selectedMonthKey = '';
  bool _isInit = true;
  String? _expandedCommitmentId;

  // Selected payment form states
  PaymentMethod _payMethod = PaymentMethod.cash;
  final _payAmountController = TextEditingController();
  final _payNoteController = TextEditingController();
  DateTime _payDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _selectedMonthKey = DateFormat('yyyy-MM').format(DateTime.now());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadCommitmentData();
      });
      _isInit = false;
    }
  }

  void _loadCommitmentData() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    Provider.of<FinanceProvider>(context, listen: false).loadCommitments(auth.currentShop, _selectedMonthKey);
  }

  String _getMonthLabel(String key) {
    try {
      final parts = key.split('-');
      final d = DateTime(int.parse(parts[0]), int.parse(parts[1]));
      return DateFormat('MMM yyyy').format(d);
    } catch (_) {
      return key;
    }
  }

  void _showAddCommitmentDialog() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final nameController = TextEditingController();
    final amtController = TextEditingController();
    final dueDayController = TextEditingController(text: '1');
    String emoji = '🏪';
    final emojis = ["🏪", "⚡", "👨‍💼", "📋", "💧", "📶", "🔥", "🛡️", "🏦", "🚗", "📦", "🔧"];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('New Monthly Commitment'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Select Icon', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: emojis.map((e) {
                    final isSelected = emoji == e;
                    return InkWell(
                      onTap: () => setStateDialog(() => emoji = e),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary.withOpacity(0.15) : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
                        ),
                        child: Text(e, style: const TextStyle(fontSize: 18)),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Commitment Name (e.g. Shop Rent)'),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: amtController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Amount (₹)'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: dueDayController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Due Day (1-31)'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                final amt = double.tryParse(amtController.text) ?? 0.0;
                final due = int.tryParse(dueDayController.text) ?? 1;
                if (name.isEmpty || amt <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter name and valid amount')));
                  return;
                }
                Navigator.pop(ctx);

                final newCommitment = Commitment(
                  id: '',
                  name: name,
                  emoji: emoji,
                  amount: amt,
                  dueDay: due,
                  color: '#8B5CF6',
                );

                await Provider.of<FinanceProvider>(context, listen: false).addCommitment(auth.currentShop, newCommitment);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _showPayCommitmentDialog(Commitment commitment, double remainingAmount) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _payAmountController.text = remainingAmount.toString();
    _payNoteController.text = '';
    _payDate = DateTime.now();
    _payMethod = PaymentMethod.cash;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: Text('Add Payment: ${commitment.name}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (remainingAmount < commitment.amount) ...[
                  Text(
                    'Remaining amount to clear: ${Formatters.fmt(remainingAmount)}',
                    style: const TextStyle(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                ],
                const Text('Payment Method', style: TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: PaymentMethod.values.map((method) {
                    final isSelected = _payMethod == method;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            elevation: 0,
                            backgroundColor: isSelected ? AppColors.primary : AppColors.surfaceLight,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                          ),
                          onPressed: () => setStateDialog(() => _payMethod = method),
                          child: Text(method.name.toUpperCase(), style: const TextStyle(fontSize: 11)),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _payAmountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Amount Paid (₹)'),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final chosen = await showDatePicker(
                      context: context,
                      initialDate: _payDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setStateDialog(() => _payDate = chosen);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceLight,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Paid Date: ${DateFormat('dd MMM yyyy').format(_payDate)}', style: const TextStyle(fontSize: 12)),
                        const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _payNoteController,
                  decoration: const InputDecoration(labelText: 'Note (optional)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(_payAmountController.text) ?? 0.0;
                if (amt <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid payment amount')));
                  return;
                }
                Navigator.pop(ctx);

                await Provider.of<FinanceProvider>(context, listen: false).payCommitment(
                  auth.currentShop,
                  commitment.id,
                  _selectedMonthKey,
                  amt,
                  _payMethod,
                  _payDate,
                  _payNoteController.text,
                );
              },
              child: const Text('Save Payment'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();
    final auth = context.watch<AuthProvider>();

    // Calculate month keys for the selector (current and previous 5)
    final now = DateTime.now();
    final List<String> months = [];
    for (int i = 0; i < 6; i++) {
      final d = DateTime(now.year, now.month - i, 1);
      months.add(DateFormat('yyyy-MM').format(d));
    }

    final paymentsInMonth = finance.commitmentPayments;

    // Create a mapping of commitmentId to the payment entry
    final Map<String, CommitmentPayment> paymentMap = {};
    for (var p in paymentsInMonth) {
      paymentMap[p.commitmentId] = p;
    }

    final totalCommitted = finance.commitments.fold(0.0, (sum, c) => sum + c.amount);
    final totalPaid = paymentsInMonth.fold(0.0, (sum, p) => sum + p.paidAmount);
    final totalPending = totalCommitted - totalPaid > 0 ? totalCommitted - totalPaid : 0.0;

    return RefreshIndicator(
      onRefresh: () async {
        _loadCommitmentData();
      },
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Month selector & add button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                DropdownButtonHideUnderline(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButton<String>(
                      value: _selectedMonthKey,
                      dropdownColor: AppColors.surface,
                      style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                      items: months.map((mKey) {
                        return DropdownMenuItem(value: mKey, child: Text(_getMonthLabel(mKey)));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedMonthKey = val;
                          });
                          _loadCommitmentData();
                        }
                      },
                    ),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _showAddCommitmentDialog,
                  icon: const Icon(Icons.add, size: 14),
                  label: const Text('Add Commitment', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Summary cards
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
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Total Committed', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(Formatters.fmt(totalCommitted), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text('${finance.commitments.length} recurring items', style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Paid This Month', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(Formatters.fmt(totalPaid), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.success)),
                      Text('${paymentsInMonth.length} started payments', style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: totalPending > 0 ? AppColors.danger.withOpacity(0.08) : AppColors.success.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: totalPending > 0 ? AppColors.danger.withOpacity(0.2) : AppColors.success.withOpacity(0.2)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Remaining Balance', style: TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(
                        Formatters.fmt(totalPending),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: totalPending > 0 ? AppColors.danger : AppColors.success,
                        ),
                      ),
                      Text(totalPending > 0 ? 'Due to settle' : 'Cleared for month', style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // List of commitments
            if (finance.commitments.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 64.0),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.inventory_outlined, size: 36, color: AppColors.textMuted),
                      SizedBox(height: 12),
                      Text('No commitments configured.', style: TextStyle(color: AppColors.textMuted)),
                    ],
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: finance.commitments.length,
                itemBuilder: (context, index) {
                  final c = finance.commitments[index];
                  final payment = paymentMap[c.id];
                  final paidAmt = payment?.paidAmount ?? 0.0;
                  final isFullyPaid = paidAmt >= c.amount;
                  final isPartial = paidAmt > 0 && !isFullyPaid;
                  final isExpanded = _expandedCommitmentId == c.id;

                  final pct = c.amount > 0 ? (paidAmt / c.amount).clamp(0.0, 1.0) : 0.0;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isFullyPaid
                              ? AppColors.success.withOpacity(0.3)
                              : (isPartial ? AppColors.warning.withOpacity(0.3) : AppColors.border),
                        ),
                      ),
                      child: Column(
                        children: [
                          ListTile(
                            leading: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(c.emoji, style: const TextStyle(fontSize: 18)),
                            ),
                            title: Text(c.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            subtitle: Text('Due: ${c.dueDay} of month', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(Formatters.fmt(c.amount), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                    if (paidAmt > 0)
                                      Text(
                                        'Paid: ${Formatters.fmt(paidAmt)}',
                                        style: TextStyle(fontSize: 10, color: isFullyPaid ? AppColors.success : AppColors.warning, fontWeight: FontWeight.bold),
                                      ),
                                  ],
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.danger),
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: const Text('Delete Commitment'),
                                        content: const Text('Are you sure you want to delete this recurring commitment?'),
                                        actions: [
                                          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                            onPressed: () async {
                                              Navigator.pop(ctx);
                                              await finance.deleteCommitment(auth.currentShop, c.id);
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

                          // Progress Bar
                          if (paidAmt > 0)
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0),
                              child: Column(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: LinearProgressIndicator(
                                      value: pct,
                                      backgroundColor: AppColors.surfaceLight,
                                      valueColor: AlwaysStoppedAnimation<Color>(isFullyPaid ? AppColors.success : AppColors.warning),
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
                                if (!isFullyPaid)
                                  Expanded(
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: isPartial ? AppColors.warning.withOpacity(0.12) : AppColors.surfaceLight,
                                        foregroundColor: isPartial ? AppColors.warning : AppColors.textSecondary,
                                        elevation: 0,
                                        side: BorderSide(color: isPartial ? AppColors.warning : AppColors.border),
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                      ),
                                      onPressed: () => _showPayCommitmentDialog(c, c.amount - paidAmt),
                                      child: Text(isPartial ? '+ Add Installment' : 'Pay Commitment', style: const TextStyle(fontSize: 11)),
                                    ),
                                  )
                                else
                                  Expanded(
                                    child: Container(
                                      alignment: Alignment.center,
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      decoration: BoxDecoration(
                                        color: AppColors.success.withOpacity(0.08),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Text('Cleared ✓', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 11)),
                                    ),
                                  ),
                                if (payment != null && payment.partialPayments.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  InkWell(
                                    onTap: () {
                                      setState(() {
                                        _expandedCommitmentId = isExpanded ? null : c.id;
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(color: AppColors.border),
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(isExpanded ? Icons.expand_less : Icons.expand_more, size: 14, color: AppColors.textSecondary),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${payment.partialPayments.length} logs',
                                            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Partial installments breakdown log
                          if (isExpanded && payment != null)
                            Container(
                              decoration: const BoxDecoration(
                                color: AppColors.surfaceLight,
                                borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                              ),
                              padding: const EdgeInsets.all(12),
                              child: ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: payment.partialPayments.length,
                                separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 12),
                                itemBuilder: (context, idx) {
                                  final pp = payment.partialPayments[idx];
                                  return Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            DateFormat('dd MMM yyyy').format(pp.paidDate),
                                            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                          if (pp.note.isNotEmpty)
                                            Text(pp.note, style: const TextStyle(fontSize: 9, color: AppColors.textMuted)),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          Text(
                                            '${pp.paymentMethod.name.toUpperCase()} · ${Formatters.fmt(pp.amount)}',
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.success),
                                          ),
                                          const SizedBox(width: 8),
                                          IconButton(
                                            icon: const Icon(Icons.close, size: 12, color: AppColors.danger),
                                            onPressed: () {
                                              showDialog(
                                                context: context,
                                                builder: (ctx) => AlertDialog(
                                                  title: const Text('Delete installment'),
                                                  content: const Text('Are you sure you want to delete this payment installment?'),
                                                  actions: [
                                                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                                    ElevatedButton(
                                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                                      onPressed: () async {
                                                        Navigator.pop(ctx);
                                                        await finance.deleteCommitmentPartialPayment(auth.currentShop, c.id, pp.id, _selectedMonthKey);
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
    );
  }
}
