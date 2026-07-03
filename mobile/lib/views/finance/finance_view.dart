import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/colors.dart';
import '../../models/models.dart';
import '../../providers/app_providers.dart';
import '../../utils/formatters.dart';

class FinanceView extends StatefulWidget {
  const FinanceView({super.key});

  @override
  State<FinanceView> createState() => _FinanceViewState();
}

class _FinanceViewState extends State<FinanceView> {
  DateTime? _filterDate;
  String? _filterMonth; // 'YYYY-MM'
  String? _filterYear;  // 'YYYY'
  String? _filterCategory;

  @override
  void initState() {
    super.initState();
    _loadFinanceData();
  }

  void _loadFinanceData() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    Provider.of<FinanceProvider>(context, listen: false).loadFinanceData(auth.currentShop);
  }

  void _clearFilters() {
    setState(() {
      _filterDate = null;
      _filterMonth = null;
      _filterYear = null;
      _filterCategory = null;
    });
  }

  void _showAddEntryDialog() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final amountController = TextEditingController();
    final descController = TextEditingController();
    final qtyController = TextEditingController();
    final itemController = TextEditingController();

    TransactionType type = TransactionType.income;
    ShopId targetShop = auth.currentShop;
    PaymentMethod method = PaymentMethod.cash;
    String category = 'Fresh Juices';
    PurchaseUnit unit = PurchaseUnit.kg;

    final incomeCategories = ['Fresh Juices', 'Milkshakes', 'Spl Juices', 'Zomato Sales', 'Other Income'];
    final expenseCategories = [
      'Fruits & Vegetables',
      'Packaging & Plastics',
      'Other Supplies',
      'Ice Cream',
      'Dry Fruits',
      'Cleaning Utility',
      'Essence',
      'Salary',
      'Rent',
      'Electricity',
      'Miscellaneous'
    ];

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setStateDialog) {
            final isInventoryCat = expenseCategories.sublist(0, 7).contains(category);

            return AlertDialog(
              title: const Text('New Ledger Entry'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Income vs Expense Segment
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: type == TransactionType.income ? Colors.green[800] : AppColors.surfaceLight,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: () {
                              setStateDialog(() {
                                type = TransactionType.income;
                                category = incomeCategories[0];
                              });
                            },
                            child: const Text('📈 Income'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: type == TransactionType.expense ? Colors.amber[800] : AppColors.surfaceLight,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: () {
                              setStateDialog(() {
                                type = TransactionType.expense;
                                category = expenseCategories[0];
                              });
                            },
                            child: const Text('📉 Expense'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Target Shop Selector (For Income Only)
                    if (type == TransactionType.income) ...[
                      DropdownButtonFormField<ShopId>(
                        value: targetShop,
                        decoration: const InputDecoration(labelText: 'Shop Branch'),
                        dropdownColor: AppColors.surfaceLight,
                        items: const [
                          DropdownMenuItem(value: ShopId.shop1, child: Text('Shop 1 (Theppakulam)')),
                          DropdownMenuItem(value: ShopId.shop2, child: Text('Shop 2 (Anuppanadi)')),
                        ],
                        onChanged: (val) {
                          if (val != null) {
                            setStateDialog(() => targetShop = val);
                          }
                        },
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Payment Method
                    DropdownButtonFormField<PaymentMethod>(
                      value: method,
                      decoration: const InputDecoration(labelText: 'Payment Method'),
                      dropdownColor: AppColors.surfaceLight,
                      items: PaymentMethod.values
                          .map((m) => DropdownMenuItem(value: m, child: Text(m.name.toUpperCase())))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setStateDialog(() => method = val);
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    // Category
                    DropdownButtonFormField<String>(
                      value: category,
                      decoration: const InputDecoration(labelText: 'Category'),
                      dropdownColor: AppColors.surfaceLight,
                      items: (type == TransactionType.income ? incomeCategories : expenseCategories)
                          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setStateDialog(() => category = val);
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    // Total Cost / Amount
                    TextField(
                      controller: amountController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Amount / Total Cost (₹)'),
                    ),
                    const SizedBox(height: 16),

                    // Dynamic Stock Item input (For Inventory Category Expenses)
                    if (type == TransactionType.expense && isInventoryCat) ...[
                      const Text(
                        'Stock Purchase Details',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryLight),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: itemController,
                        decoration: const InputDecoration(labelText: 'Item Name (e.g. Apple)'),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            flex: 2,
                            child: TextField(
                              controller: qtyController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: const InputDecoration(labelText: 'Qty'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            flex: 3,
                            child: DropdownButtonFormField<PurchaseUnit>(
                              value: unit,
                              decoration: const InputDecoration(labelText: 'Unit'),
                              dropdownColor: AppColors.surfaceLight,
                              items: PurchaseUnit.values
                                  .map((u) => DropdownMenuItem(value: u, child: Text(u.name)))
                                  .toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setStateDialog(() => unit = val);
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ] else ...[
                      TextField(
                        controller: descController,
                        decoration: const InputDecoration(labelText: 'Description / Note'),
                      ),
                      const SizedBox(height: 16),
                    ],
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
                    final finance = Provider.of<FinanceProvider>(context, listen: false);

                    if (type == TransactionType.expense && isInventoryCat) {
                      final itemName = itemController.text.trim();
                      final qty = double.tryParse(qtyController.text) ?? 1.0;
                      if (itemName.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter stock item name')));
                        return;
                      }

                      // Create transaction and purchase cascade
                      final txDesc = 'Purchase: $itemName ($qty ${unit.name})';
                      final transaction = Transaction(
                        id: '',
                        type: TransactionType.expense,
                        paymentMethod: method,
                        amount: amt,
                        category: category,
                        description: txDesc,
                        date: DateTime.now(),
                      );

                      // Save purchase links
                      final purchase = Purchase(
                        id: '',
                        itemName: itemName,
                        category: PurchaseCategory.fromString(category),
                        quantity: qty,
                        unit: unit,
                        pricePerUnit: amt / qty,
                        totalPrice: amt,
                        date: DateTime.now(),
                      );

                      await finance.addTransaction(targetShop, transaction);
                      // In the React backend: automatically creates a purchase if category is inventory.
                      // To ensure client sync, reload data:
                      finance.loadFinanceData(auth.currentShop);
                    } else {
                      final description = type == TransactionType.income ? 'Full Day Sales' : (descController.text.isNotEmpty ? descController.text : category);
                      final transaction = Transaction(
                        id: '',
                        type: type,
                        paymentMethod: method,
                        amount: amt,
                        category: category,
                        description: description,
                        date: DateTime.now(),
                      );

                      await finance.addTransaction(targetShop, transaction);
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final finance = context.watch<FinanceProvider>();
    final auth = context.watch<AuthProvider>();

    // Filters implementation
    final filteredTransactions = finance.transactions.where((t) {
      if (_filterCategory != null && t.category != _filterCategory) return false;

      final tDateStr = DateFormat('yyyy-MM-dd').format(t.date);

      if (_filterDate != null) {
        final fDateStr = DateFormat('yyyy-MM-dd').format(_filterDate!);
        if (tDateStr != fDateStr) return false;
      }

      if (_filterMonth != null) {
        final tMonthStr = DateFormat('yyyy-MM').format(t.date);
        if (tMonthStr != _filterMonth) return false;
      }

      if (_filterYear != null) {
        final tYearStr = DateFormat('yyyy').format(t.date);
        if (tYearStr != _filterYear) return false;
      }

      return true;
    }).toList();

    // Stats calculations
    double cashSales = 0;
    double gpaySales = 0;
    double zomatoSales = 0;

    for (var t in filteredTransactions) {
      if (t.type == TransactionType.income) {
        if (t.paymentMethod == PaymentMethod.cash) cashSales += t.amount;
        if (t.paymentMethod == PaymentMethod.gpay) gpaySales += t.amount;
        if (t.paymentMethod == PaymentMethod.zomato) zomatoSales += t.amount;
      }
    }

    final totalShopSales = cashSales + gpaySales + zomatoSales;

    final totalIncome = filteredTransactions
        .where((t) => t.type == TransactionType.income)
        .fold(0.0, (sum, item) => sum + item.amount);

    final totalExpense = filteredTransactions
        .where((t) => t.type == TransactionType.expense)
        .fold(0.0, (sum, item) => sum + item.amount);

    final netBalance = totalIncome - totalExpense;

    // Daily, weekly, monthly calculations (current shop)
    final now = DateTime.now();
    final todayStartStr = DateFormat('yyyy-MM-dd').format(now);
    final startOf7Days = now.subtract(const Duration(days: 7));
    final startOfMonth = DateTime(now.year, now.month, 1);

    final dailySales = finance.transactions
        .where((t) => t.type == TransactionType.income && DateFormat('yyyy-MM-dd').format(t.date) == todayStartStr)
        .fold(0.0, (sum, item) => sum + item.amount);

    final weeklySales = finance.transactions
        .where((t) => t.type == TransactionType.income && t.date.isAfter(startOf7Days))
        .fold(0.0, (sum, item) => sum + item.amount);

    final monthlySales = finance.transactions
        .where((t) => t.type == TransactionType.income && t.date.isAfter(startOfMonth))
        .fold(0.0, (sum, item) => sum + item.amount);

    // Grouping by category
    final Map<String, double> categoryMap = {};
    for (var t in filteredTransactions) {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + t.amount;
    }
    final sortedCategories = categoryMap.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topCategories = sortedCategories.take(8).toList();

    return RefreshIndicator(
      onRefresh: () async {
        _loadFinanceData();
      },
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Filter Panel
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.filter_alt, size: 16, color: AppColors.primaryLight),
                          SizedBox(width: 8),
                          Text('Sales & Income Journal Filters', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddEntryDialog,
                        icon: const Icon(Icons.add, size: 14),
                        label: const Text('Add Entry', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          backgroundColor: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const Divider(color: AppColors.border, height: 24),
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      // Date Filter
                      _buildFilterWrapper(
                        'Date Filter',
                        InkWell(
                          onTap: () async {
                            final chosen = await showDatePicker(
                              context: context,
                              initialDate: _filterDate ?? DateTime.now(),
                              firstDate: DateTime(2024),
                              lastDate: DateTime(2028),
                            );
                            if (chosen != null) {
                              setState(() {
                                _filterDate = chosen;
                                _filterMonth = null;
                                _filterYear = null;
                              });
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _filterDate != null ? DateFormat('dd MMM yyyy').format(_filterDate!) : 'Select Date...',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                const Icon(Icons.calendar_today, size: 12, color: AppColors.textSecondary),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Month Filter
                      _buildFilterWrapper(
                        'Month Filter',
                        InkWell(
                          onTap: () async {
                            final now = DateTime.now();
                            final month = await showDialog<String>(
                              context: context,
                              builder: (ctx) {
                                return SimpleDialog(
                                  title: const Text('Select Month'),
                                  backgroundColor: AppColors.surface,
                                  children: List.generate(12, (index) {
                                    final mKey = '${now.year}-${(index + 1).toString().padLeft(2, '0')}';
                                    final mName = DateFormat('MMMM yyyy').format(DateTime(now.year, index + 1));
                                    return SimpleDialogOption(
                                      onPressed: () => Navigator.pop(ctx, mKey),
                                      child: Text(mName),
                                    );
                                  }),
                                );
                              },
                            );
                            if (month != null) {
                              setState(() {
                                _filterMonth = month;
                                _filterDate = null;
                                _filterYear = null;
                              });
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _filterMonth != null
                                      ? DateFormat('MMMM yyyy').format(DateTime(int.parse(_filterMonth!.split('-')[0]), int.parse(_filterMonth!.split('-')[1])))
                                      : 'Select Month...',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                const Icon(Icons.arrow_drop_down, size: 16, color: AppColors.textSecondary),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // Category Filter
                      _buildFilterWrapper(
                        'Category Filter',
                        DropdownButtonHideUnderline(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: DropdownButton<String>(
                              isExpanded: true,
                              value: _filterCategory,
                              dropdownColor: AppColors.surfaceLight,
                              style: const TextStyle(color: AppColors.textPrimary, fontSize: 12),
                              hint: const Text('Select Category...', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                              items: [
                                'Fresh Juices',
                                'Milkshakes',
                                'Spl Juices',
                                'Fruits & Vegetables',
                                'Packaging & Plastics',
                                'Other Supplies',
                                'Salary',
                                'Rent',
                                'Electricity',
                                'Miscellaneous'
                              ].map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                              onChanged: (val) {
                                setState(() {
                                  _filterCategory = val;
                                });
                              },
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: (_filterDate == null && _filterMonth == null && _filterYear == null && _filterCategory == null)
                        ? null
                        : _clearFilters,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.surfaceLight,
                      foregroundColor: AppColors.textSecondary,
                    ),
                    child: const Text('Reset Filters', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Sales Cards Row
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: width > 750 ? 3 : 1,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.5,
              children: [
                _buildIndicatorCard('Daily Sales', dailySales, Colors.green, Icons.calendar_today),
                _buildIndicatorCard('Weekly Sales', weeklySales, Colors.green, Icons.trending_up),
                _buildIndicatorCard('Monthly Sales', monthlySales, Colors.green, Icons.wallet),
              ],
            ),
            const SizedBox(height: 20),

            // Payment split totals
            const Text(
              'BRANCH SALES PAYMENT DISTRIBUTION',
              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textMuted, letterSpacing: 1.0),
            ),
            const SizedBox(height: 8),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: width > 900 ? 4 : 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.6,
              children: [
                _buildPaymentSplitKpi('Cash Sales', cashSales, Colors.amber[700]!, Icons.money),
                _buildPaymentSplitKpi('GPay Sales', gpaySales, Colors.lightBlue, Icons.smartphone),
                _buildPaymentSplitKpi('Zomato Sales', zomatoSales, Colors.orange, Icons.flatware),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green[800],
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.green[900]!),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Total Shop Sales', style: TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(Formatters.fmt(totalShopSales), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Main Ledger list and Category comparison
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: width > 950 ? 2 : 1,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Ledger Postings (${filteredTransactions.length} entries)',
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 16),
                          if (filteredTransactions.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 32),
                              child: Center(
                                child: Text('No entries matching these parameters.', style: TextStyle(color: AppColors.textMuted)),
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: filteredTransactions.length > 50 ? 50 : filteredTransactions.length,
                              separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                              itemBuilder: (context, index) {
                                final t = filteredTransactions[index];
                                final isIncome = t.type == TransactionType.income;
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  child: Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(6),
                                        decoration: BoxDecoration(
                                          color: (isIncome ? Colors.green : Colors.red).withOpacity(0.12),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(isIncome ? '📈' : '📉', style: const TextStyle(fontSize: 12)),
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
                                              '${t.category} · ${t.paymentMethod.name.toUpperCase()} · ${DateFormat('dd MMM').format(t.date)}',
                                              style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Row(
                                        children: [
                                          Text(
                                            '${isIncome ? '+' : '-'}${Formatters.fmt(t.amount)}',
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                              color: isIncome ? AppColors.success : AppColors.danger,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          IconButton(
                                            icon: const Icon(Icons.delete_outline, size: 14, color: AppColors.textMuted),
                                            onPressed: () {
                                              showDialog(
                                                context: context,
                                                builder: (ctx) => AlertDialog(
                                                  title: const Text('Delete entry'),
                                                  content: const Text('Are you sure you want to delete this ledger entry?'),
                                                  actions: [
                                                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                                    ElevatedButton(
                                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                                      onPressed: () async {
                                                        Navigator.pop(ctx);
                                                        await finance.deleteTransaction(auth.currentShop, t.id, t.type);
                                                        _loadFinanceData();
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
                                  ),
                                );
                              },
                            ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Category Breakdowns panel (Desktop/Tablet layout)
                if (width > 950) ...[
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildCategoryBreakdownCard(topCategories),
                  ),
                ],
              ],
            ),

            // Category Breakdowns panel (Mobile layout)
            if (width <= 950) ...[
              const SizedBox(height: 16),
              _buildCategoryBreakdownCard(topCategories),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFilterWrapper(String label, Widget child) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width > 600 ? 180 : double.infinity),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
          const SizedBox(height: 4),
          child,
        ],
      ),
    );
  }

  Widget _buildIndicatorCard(String title, double val, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(title.toUpperCase(), style: const TextStyle(fontSize: 9, color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Text(Formatters.fmt(val), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentSplitKpi(String title, double val, Color color, IconData icon) {
    return Container(
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
          Row(
            children: [
              Icon(icon, color: color, size: 14),
              const SizedBox(width: 6),
              Text(title, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 6),
          Text(Formatters.fmt(val), style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildCategoryBreakdownCard(List<MapEntry<String, double>> topCategories) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Postings by Category', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (topCategories.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text('No records available', style: TextStyle(color: AppColors.textMuted)),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: topCategories.length,
                itemBuilder: (context, index) {
                  final entry = topCategories[index];
                  final cat = entry.key;
                  final amt = entry.value;
                  final maxAmt = topCategories[0].value;
                  final pct = maxAmt > 0 ? amt / maxAmt : 0.0;

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(cat, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            Text(Formatters.fmtShort(amt), style: const TextStyle(fontSize: 11, color: AppColors.textMuted, fontFamily: 'monospace')),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct,
                            backgroundColor: AppColors.surfaceLight,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryLight),
                            minHeight: 5,
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
    );
  }
}
