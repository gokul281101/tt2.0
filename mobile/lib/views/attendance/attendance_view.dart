import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../constants/colors.dart';
import '../../models/models.dart';
import '../../providers/app_providers.dart';
import '../../utils/formatters.dart';

class AttendanceView extends StatefulWidget {
  const AttendanceView({super.key});

  @override
  State<AttendanceView> createState() => _AttendanceViewState();
}

class _AttendanceViewState extends State<AttendanceView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTime _activeDate = DateTime.now();
  String _activeMonthKey = '';
  bool _isInit = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _activeMonthKey = DateFormat('yyyy-MM').format(DateTime.now());
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadAttendanceData();
      });
      _isInit = false;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _loadAttendanceData() {
    final startOfMonth = DateTime(_activeDate.year, _activeDate.month, 1);
    final endOfMonth = DateTime(_activeDate.year, _activeDate.month + 1, 0);

    final fromStr = DateFormat('yyyy-MM-dd').format(startOfMonth);
    final toStr = DateFormat('yyyy-MM-dd').format(endOfMonth);

    Provider.of<AttendanceProvider>(context, listen: false).loadStaffData();
    Provider.of<AttendanceProvider>(context, listen: false).loadAttendance(from: fromStr, to: toStr);
    Provider.of<AttendanceProvider>(context, listen: false).loadSalaryReport(_activeMonthKey);
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

  void _showAddStaffDialog() {
    final nameController = TextEditingController();
    final wageController = TextEditingController();
    final attendance = Provider.of<AttendanceProvider>(context, listen: false);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Register Employee'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Full Name'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: wageController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Daily Wage (₹)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final name = nameController.text.trim();
              final wage = double.tryParse(wageController.text) ?? 0.0;
              if (name.isEmpty || wage <= 0) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid details')));
                return;
              }
              Navigator.pop(ctx);
              await attendance.addStaff(Staff(id: '', name: name, dailyWage: wage, wageHistory: []));
              _loadAttendanceData();
            },
            child: const Text('Register'),
          ),
        ],
      ),
    );
  }

  void _showDisburseSalaryDialog(String staffId, String name, double calculatedSalary) {
    final attendance = Provider.of<AttendanceProvider>(context, listen: false);
    final amountController = TextEditingController(text: calculatedSalary.toString());
    final noteController = TextEditingController();
    DateTime paidDate = DateTime.now();
    PaymentMethod method = PaymentMethod.gpay;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: Text('Disburse Salary: $name'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Salary Amount (₹)'),
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
                      initialDate: paidDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setStateDialog(() => paidDate = chosen);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(color: AppColors.surfaceLight, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Date: ${DateFormat('dd MMM yyyy').format(paidDate)}', style: const TextStyle(fontSize: 12)),
                        const Icon(Icons.calendar_today, size: 14, color: AppColors.textSecondary),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: noteController,
                  decoration: const InputDecoration(labelText: 'Note (optional)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final amt = double.tryParse(amountController.text) ?? 0.0;
                if (amt <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter valid amount')));
                  return;
                }
                Navigator.pop(ctx);
                await attendance.paySalary(staffId, name, _activeMonthKey, amt, method, paidDate, noteController.text);
                _loadAttendanceData();
              },
              child: const Text('Disburse'),
            ),
          ],
        ),
      ),
    );
  }

  void _showWageHistoryDialog(Staff staff) {
    final attendance = Provider.of<AttendanceProvider>(context, listen: false);
    final wageController = TextEditingController();
    DateTime effectiveDate = DateTime.now();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: Text('Wage History: ${staff.name}'),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView(
              shrinkWrap: true,
              children: [
                Text('Current Base rate: ${Formatters.fmt(staff.dailyWage)}/day', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const Divider(color: AppColors.border, height: 20),
                const Text('WAGE RATE INCREASES', style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                if (staff.wageHistory.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: Text('No wage history adjustments recorded.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                  )
                else
                  ...staff.wageHistory.map((h) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text('New wage rate: ${Formatters.fmt(h.dailyWage)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        subtitle: Text('Effective Date: ${h.effectiveDate}', style: const TextStyle(fontSize: 10)),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, size: 14, color: AppColors.danger),
                          onPressed: () async {
                            final updatedHistory = staff.wageHistory.where((x) => x.effectiveDate != h.effectiveDate).toList();
                            Navigator.pop(ctx);
                            await attendance.updateStaff(staff.id, {
                              'wageHistory': updatedHistory.map((x) => {'dailyWage': x.dailyWage, 'effectiveDate': x.effectiveDate}).toList()
                            });
                            _loadAttendanceData();
                          },
                        ),
                      )),
                const Divider(color: AppColors.border, height: 20),
                const Text('ADJUST WAGE RATE', style: TextStyle(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(
                  controller: wageController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'New daily wage rate (₹)'),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () async {
                    final chosen = await showDatePicker(
                      context: context,
                      initialDate: effectiveDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setStateDialog(() => effectiveDate = chosen);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(color: AppColors.surfaceLight, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Effective: ${DateFormat('yyyy-MM-dd').format(effectiveDate)}', style: const TextStyle(fontSize: 12)),
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
                final newWage = double.tryParse(wageController.text) ?? 0.0;
                if (newWage <= 0) return;
                Navigator.pop(ctx);

                // Add to history
                final history = staff.wageHistory.map((x) => {'dailyWage': x.dailyWage, 'effectiveDate': x.effectiveDate}).toList();
                history.add({
                  'dailyWage': newWage,
                  'effectiveDate': DateFormat('yyyy-MM-dd').format(effectiveDate),
                });

                await attendance.updateStaff(staff.id, {
                  'dailyWage': newWage,
                  'wageHistory': history,
                });
                _loadAttendanceData();
              },
              child: const Text('Apply Rate'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final attendanceProv = context.watch<AttendanceProvider>();
    final width = MediaQuery.of(context).size.width;

    // Daily roster status maps
    final Map<String, String> dailyStatusMap = {};
    final activeDateStr = DateFormat('yyyy-MM-dd').format(_activeDate);
    for (var r in attendanceProv.attendance) {
      final rDateStr = DateFormat('yyyy-MM-dd').format(r.date);
      if (rDateStr == activeDateStr) {
        dailyStatusMap[r.staffId] = r.status;
      }
    }

    final totalActiveStaff = attendanceProv.staff.length;
    final totalWages = attendanceProv.salaryReport.fold(0.0, (sum, r) => sum + (r['calculatedSalary'] as num).toDouble());

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
              Tab(text: 'Daily Roll Call'),
              Tab(text: 'Salaries & Payouts'),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: DAILY ROLL CALL
          RefreshIndicator(
            onRefresh: () async {
              _loadAttendanceData();
            },
            color: AppColors.primary,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                // Banner info
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Daily Roll Call', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('$totalActiveStaff active employees registered', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: _showAddStaffDialog,
                        icon: const Icon(Icons.add, size: 14),
                        label: const Text('Add Staff', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 16)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Date Picker
                InkWell(
                  onTap: () async {
                    final chosen = await showDatePicker(
                      context: context,
                      initialDate: _activeDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2028),
                    );
                    if (chosen != null) {
                      setState(() {
                        _activeDate = chosen;
                      });
                      _loadAttendanceData();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Roster Date: ${DateFormat('dd MMMM yyyy').format(_activeDate)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        const Icon(Icons.calendar_month, color: AppColors.primaryLight, size: 16),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // List of staff for checking
                if (attendanceProv.staff.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 48.0),
                    child: Center(child: Text('No employees registered. Add staff above!', style: TextStyle(color: AppColors.textMuted))),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: attendanceProv.staff.length,
                    itemBuilder: (context, index) {
                      final s = attendanceProv.staff[index];
                      final status = dailyStatusMap[s.id] ?? 'none';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: Container(
                          padding: const EdgeInsets.all(12),
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
                                  Text(s.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  InkWell(
                                    onTap: () => _showWageHistoryDialog(s),
                                    child: Text(
                                      '${Formatters.fmt(s.dailyWage)}/day',
                                      style: const TextStyle(fontSize: 11, color: AppColors.primaryLight, fontWeight: FontWeight.bold, decoration: TextDecoration.underline),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  _buildAttendanceStatusBtn(s.id, 'present', 'Present', status == 'present', Colors.green),
                                  const SizedBox(width: 8),
                                  _buildAttendanceStatusBtn(s.id, 'half-day', 'Half Day', status == 'half-day', Colors.amber),
                                  const SizedBox(width: 8),
                                  _buildAttendanceStatusBtn(s.id, 'absent', 'Absent', status == 'absent', Colors.red),
                                ],
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

          // TAB 2: SALARIES & PAYOUTS
          RefreshIndicator(
            onRefresh: () async {
              _loadAttendanceData();
            },
            color: AppColors.primary,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              children: [
                // Month selector & metrics
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    InkWell(
                      onTap: () async {
                        final chosen = await showDatePicker(
                          context: context,
                          initialDate: DateFormat('yyyy-MM').parse(_activeMonthKey),
                          firstDate: DateTime(2024),
                          lastDate: DateTime(2028),
                        );
                        if (chosen != null) {
                          setState(() {
                            _activeMonthKey = DateFormat('yyyy-MM').format(chosen);
                          });
                          _loadAttendanceData();
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                        child: Row(
                          children: [
                            Text('Roster Month: ${_getMonthLabel(_activeMonthKey)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(width: 6),
                            const Icon(Icons.arrow_drop_down, size: 14, color: AppColors.primaryLight),
                          ],
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                      child: Text('Total Wages: ${Formatters.fmt(totalWages)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.success)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Calculations Table
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('Calculated Salaries', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        if (attendanceProv.salaryReport.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24.0),
                            child: Center(child: Text('No details available.', style: TextStyle(color: AppColors.textMuted))),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: attendanceProv.salaryReport.length,
                            separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                            itemBuilder: (context, idx) {
                              final item = attendanceProv.salaryReport[idx];
                              final staff = item['staff'] as Staff;
                              final present = item['presentDays'] as int;
                              final half = item['halfDays'] as int;
                              final absent = item['absentDays'] as int;
                              final calculatedSalary = (item['calculatedSalary'] as num).toDouble();

                              final isPaid = attendanceProv.salaryPayments.any((p) => p.staffId == staff.id && p.monthKey == _activeMonthKey);

                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 8.0),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(staff.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                          const SizedBox(height: 2),
                                          Text(
                                            'P: $present · H: $half · A: $absent · rate: ${Formatters.fmt(staff.dailyWage)}/day',
                                            style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Text(Formatters.fmt(calculatedSalary), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.success)),
                                        const SizedBox(height: 4),
                                        if (isPaid)
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(color: AppColors.success.withOpacity(0.12), borderRadius: BorderRadius.circular(4)),
                                            child: const Text('Paid ✓', style: TextStyle(fontSize: 9, color: AppColors.success, fontWeight: FontWeight.bold)),
                                          )
                                        else
                                          ElevatedButton(
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppColors.primary,
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              minimumSize: Size.zero,
                                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                            ),
                                            onPressed: calculatedSalary <= 0 ? null : () => _showDisburseSalaryDialog(staff.id, staff.name, calculatedSalary),
                                            child: const Text('Disburse', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
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
                const SizedBox(height: 16),

                // Payout History Logs
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const Text('Salary Payout Log', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        if (attendanceProv.salaryPayments.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24.0),
                            child: Center(child: Text('No payouts logged for this month.', style: TextStyle(color: AppColors.textMuted))),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: attendanceProv.salaryPayments.length,
                            separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                            itemBuilder: (context, idx) {
                              final p = attendanceProv.salaryPayments[idx];
                              return ListTile(
                                contentPadding: EdgeInsets.zero,
                                title: Text(p.staffName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                subtitle: Text(
                                  'Date: ${DateFormat('dd MMM').format(p.paidDate)} · Method: ${p.paymentMethod.name.toUpperCase()} · ${p.note}',
                                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(Formatters.fmt(p.amount), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.success)),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.danger),
                                      onPressed: () {
                                        showDialog(
                                          context: context,
                                          builder: (ctx) => AlertDialog(
                                            title: const Text('Delete Log'),
                                            content: const Text('Are you sure you want to delete this payout ledger log?'),
                                            actions: [
                                              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                              ElevatedButton(
                                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                                onPressed: () async {
                                                  Navigator.pop(ctx);
                                                  await attendanceProv.deleteSalaryPayment(p.id);
                                                  _loadAttendanceData();
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
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceStatusBtn(String staffId, String statusType, String label, bool isSelected, Color color) {
    final attendance = Provider.of<AttendanceProvider>(context, listen: false);
    return Expanded(
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          backgroundColor: isSelected ? color.withOpacity(0.12) : Colors.transparent,
          side: BorderSide(color: isSelected ? color : AppColors.border, width: 1.2),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(vertical: 8),
        ),
        onPressed: () async {
          final dateStr = DateFormat('yyyy-MM-dd').format(_activeDate);
          await attendance.saveAttendance(staffId, dateStr, statusType);
          _loadAttendanceData(); // Reload stats mapping
        },
        child: Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: isSelected ? color : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
