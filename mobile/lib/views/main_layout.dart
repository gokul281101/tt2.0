import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/colors.dart';
import '../models/models.dart';
import '../providers/app_providers.dart';
import 'dashboard/dashboard_view.dart';
import 'finance/finance_view.dart';
import 'stock/stock_view.dart';
import 'commitments/commitments_view.dart';
import 'attendance/attendance_view.dart';
import 'debts/debt_view.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _selectedIndex = 0;

  final List<Widget> _views = [
    const DashboardView(),
    const FinanceView(),
    const CommitmentsView(),
    const StockView(),
    const AttendanceView(),
    const DebtView(),
  ];

  final List<String> _titles = [
    'Dashboard',
    'Finance Ledger',
    'Commitments',
    'Stock & Inventory',
    'Staff Attendance',
    'Debts & Personal',
  ];

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isLargeScreen = MediaQuery.of(context).size.width > 700;

    final appBar = AppBar(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _titles[_selectedIndex],
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          Text(
            auth.email,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
        ],
      ),
      backgroundColor: AppColors.surface,
      elevation: 0,
      scrolledUnderElevation: 0,
      shape: const Border(
        bottom: BorderSide(color: AppColors.border, width: 1),
      ),
      actions: [
        // Shop Selector
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          margin: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.surfaceLight,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<ShopId>(
              value: auth.currentShop,
              dropdownColor: AppColors.surfaceLight,
              icon: const Icon(Icons.arrow_drop_down, color: AppColors.primaryLight),
              style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
              items: const [
                DropdownMenuItem(value: ShopId.shop1, child: Text('Shop 1')),
                DropdownMenuItem(value: ShopId.shop2, child: Text('Shop 2')),
              ],
              onChanged: (ShopId? val) {
                if (val != null) {
                  auth.changeShop(val);
                }
              },
            ),
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          tooltip: 'Sign Out',
          icon: const Icon(Icons.logout, color: AppColors.danger),
          onPressed: () {
            auth.logout();
          },
        ),
        const SizedBox(width: 8),
      ],
    );

    if (isLargeScreen) {
      return Scaffold(
        body: Row(
          children: [
            // Responsive navigation sidebar
            NavigationRail(
              backgroundColor: AppColors.surface,
              selectedIndex: _selectedIndex,
              onDestinationSelected: (int index) {
                setState(() {
                  _selectedIndex = index;
                });
              },
              labelType: NavigationRailLabelType.all,
              selectedLabelTextStyle: const TextStyle(color: AppColors.primaryLight, fontSize: 11, fontWeight: FontWeight.bold),
              unselectedLabelTextStyle: const TextStyle(color: AppColors.textMuted, fontSize: 11),
              selectedIconTheme: const IconThemeData(color: AppColors.primaryLight),
              unselectedIconTheme: const IconThemeData(color: AppColors.textMuted),
              leading: const Padding(
                padding: EdgeInsets.symmetric(vertical: 24.0),
                child: Text('🍹', style: TextStyle(fontSize: 32)),
              ),
              trailing: Expanded(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: IconButton(
                      icon: const Icon(Icons.power_settings_new, color: AppColors.danger),
                      onPressed: () => auth.logout(),
                    ),
                  ),
                ),
              ),
              destinations: const [
                NavigationRailDestination(
                  icon: Icon(Icons.dashboard_outlined),
                  selectedIcon: Icon(Icons.dashboard),
                  label: Text('Dashboard'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.account_balance_wallet_outlined),
                  selectedIcon: Icon(Icons.account_balance_wallet),
                  label: Text('Finance'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.calendar_month_outlined),
                  selectedIcon: Icon(Icons.calendar_month),
                  label: Text('Commitments'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.inventory_2_outlined),
                  selectedIcon: Icon(Icons.inventory_2),
                  label: Text('Stock'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.people_outline),
                  selectedIcon: Icon(Icons.people),
                  label: Text('Staff'),
                ),
                NavigationRailDestination(
                  icon: Icon(Icons.credit_card_outlined),
                  selectedIcon: Icon(Icons.credit_card),
                  label: Text('Ledger'),
                ),
              ],
            ),
            const VerticalDivider(thickness: 1, width: 1, color: AppColors.border),
            Expanded(
              child: Scaffold(
                appBar: appBar,
                body: _views[_selectedIndex],
              ),
            ),
          ],
        ),
      );
    }

    return Scaffold(
      appBar: appBar,
      body: _views[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(
            top: BorderSide(color: AppColors.border, width: 1),
          ),
        ),
        child: BottomNavigationBar(
          backgroundColor: AppColors.surface,
          currentIndex: _selectedIndex,
          onTap: (int index) {
            setState(() {
              _selectedIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppColors.primaryLight,
          unselectedItemColor: AppColors.textMuted,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_outlined),
              activeIcon: Icon(Icons.account_balance_wallet),
              label: 'Finance',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_month_outlined),
              activeIcon: Icon(Icons.calendar_month),
              label: 'Commitments',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.inventory_2_outlined),
              activeIcon: Icon(Icons.inventory_2),
              label: 'Stock',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people_outline),
              activeIcon: Icon(Icons.people),
              label: 'Staff',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.credit_card_outlined),
              activeIcon: Icon(Icons.credit_card),
              label: 'Ledger',
            ),
          ],
        ),
      ),
    );
  }
}
