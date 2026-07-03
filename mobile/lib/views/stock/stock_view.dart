import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../constants/colors.dart';
import '../../models/models.dart';
import '../../providers/app_providers.dart';

class StockView extends StatefulWidget {
  const StockView({super.key});

  @override
  State<StockView> createState() => _StockViewState();
}

class _StockViewState extends State<StockView> {
  String _searchQuery = '';
  PurchaseCategory? _filterCategory;
  bool _isInit = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_isInit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadStockData();
      });
      _isInit = false;
    }
  }

  void _loadStockData() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    Provider.of<InventoryProvider>(context, listen: false).loadStock(auth.currentShop);
  }

  // Stock status matching React logic
  String _getStockStatusLabel(StockItem item) {
    if (item.currentQty <= 0) return 'Out';
    if (item.currentQty < item.minThreshold) return 'Low';
    return 'In Stock';
  }

  Color _getStockStatusColor(StockItem item) {
    if (item.currentQty <= 0) return AppColors.danger;
    if (item.currentQty < item.minThreshold) return AppColors.warning;
    return AppColors.success;
  }

  void _showAddStockDialog() {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final nameController = TextEditingController();
    final qtyController = TextEditingController();
    final minController = TextEditingController();
    PurchaseCategory category = PurchaseCategory.fruitsAndVegetables;
    PurchaseUnit unit = PurchaseUnit.kg;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('Add Stock Item'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<PurchaseCategory>(
                  value: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  dropdownColor: AppColors.surfaceLight,
                  items: PurchaseCategory.values
                      .map((c) => DropdownMenuItem(value: c, child: Text(c.displayName)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setStateDialog(() => category = val);
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Item Name'),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: qtyController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Current Qty'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: DropdownButtonFormField<PurchaseUnit>(
                        value: unit,
                        decoration: const InputDecoration(labelText: 'Unit'),
                        dropdownColor: AppColors.surfaceLight,
                        items: PurchaseUnit.values
                            .map((u) => DropdownMenuItem(value: u, child: Text(u.name)))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setStateDialog(() => unit = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: minController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Min Threshold (Alert Level)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final name = nameController.text.trim();
                final qty = double.tryParse(qtyController.text) ?? 0.0;
                final minVal = double.tryParse(minController.text) ?? 0.0;
                if (name.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter item name')));
                  return;
                }
                Navigator.pop(ctx);

                final newItem = StockItem(
                  id: '',
                  name: name,
                  category: category,
                  currentQty: qty,
                  unit: unit,
                  minThreshold: minVal,
                  wanted: false,
                );

                await Provider.of<InventoryProvider>(context, listen: false).addStockItem(auth.currentShop, newItem);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _showEditStockDialog(StockItem item) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final nameController = TextEditingController(text: item.name);
    final qtyController = TextEditingController(text: item.currentQty.toString());
    final minController = TextEditingController(text: item.minThreshold.toString());
    PurchaseCategory category = item.category;
    PurchaseUnit unit = item.unit;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('Edit Stock Item'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<PurchaseCategory>(
                  value: category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  dropdownColor: AppColors.surfaceLight,
                  items: PurchaseCategory.values
                      .map((c) => DropdownMenuItem(value: c, child: Text(c.displayName)))
                      .toList(),
                  onChanged: (val) {
                    if (val != null) setStateDialog(() => category = val);
                  },
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: const InputDecoration(labelText: 'Item Name'),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        controller: qtyController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Current Qty'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: DropdownButtonFormField<PurchaseUnit>(
                        value: unit,
                        decoration: const InputDecoration(labelText: 'Unit'),
                        dropdownColor: AppColors.surfaceLight,
                        items: PurchaseUnit.values
                            .map((u) => DropdownMenuItem(value: u, child: Text(u.name)))
                            .toList(),
                        onChanged: (val) {
                          if (val != null) setStateDialog(() => unit = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: minController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Min Threshold'),
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
                final name = nameController.text.trim();
                final qty = double.tryParse(qtyController.text) ?? 0.0;
                final minVal = double.tryParse(minController.text) ?? 0.0;
                if (name.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter item name')));
                  return;
                }
                Navigator.pop(ctx);

                await Provider.of<InventoryProvider>(context, listen: false).updateStockItem(
                  auth.currentShop,
                  item.id,
                  {
                    'productName': name,
                    'category': category.displayName,
                    'availableQty': qty,
                    'unit': unit.displayName,
                    'minStockLevel': minVal,
                  },
                );
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final inventory = context.watch<InventoryProvider>();
    final auth = context.watch<AuthProvider>();

    final outItemsCount = inventory.stock.where((s) => s.currentQty <= 0).length;
    final lowItemsCount = inventory.stock.where((s) => s.currentQty > 0 && s.currentQty < s.minThreshold).length;

    // Filters
    final filteredStock = inventory.stock.where((s) {
      if (_filterCategory != null && s.category != _filterCategory) return false;
      if (_searchQuery.isNotEmpty && !s.name.toLowerCase().contains(_searchQuery.toLowerCase())) return false;
      return true;
    }).toList();

    // Grouping by Category
    final Map<PurchaseCategory, List<StockItem>> groupedStock = {};
    for (var item in filteredStock) {
      groupedStock[item.category] = (groupedStock[item.category] ?? [])..add(item);
    }

    final wantedItems = inventory.stock.where((s) => s.wanted).toList();

    final width = MediaQuery.of(context).size.width;
    final isWidescreen = width > 900;

    return RefreshIndicator(
      onRefresh: () async {
        _loadStockData();
      },
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Status warning cards
            if (outItemsCount > 0 || lowItemsCount > 0) ...[
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  if (outItemsCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.danger.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline, size: 14, color: AppColors.danger),
                          const SizedBox(width: 6),
                          Text('$outItemsCount items OUT of stock', style: const TextStyle(fontSize: 11, color: AppColors.danger, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  if (lowItemsCount > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.warning.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.warning_amber_outlined, size: 14, color: AppColors.warning),
                          const SizedBox(width: 6),
                          Text('$lowItemsCount items LOW on stock', style: const TextStyle(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
            ],

            // Add Item button & search
            Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: const InputDecoration(
                      hintText: 'Search stock items...',
                      prefixIcon: Icon(Icons.search, color: AppColors.textSecondary),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: _showAddStockDialog,
                  icon: const Icon(Icons.add, size: 16),
                  label: const Text('Add Item', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Category filter chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('All'),
                    selected: _filterCategory == null,
                    selectedColor: AppColors.primary.withOpacity(0.2),
                    backgroundColor: AppColors.surface,
                    onSelected: (selected) {
                      if (selected) setState(() => _filterCategory = null);
                    },
                  ),
                  const SizedBox(width: 8),
                  ...PurchaseCategory.values.map((cat) {
                    return Padding(
                      padding: const EdgeInsets.only(right: 8.0),
                      child: ChoiceChip(
                        label: Text(cat.displayName.split(' ')[0]),
                        selected: _filterCategory == cat,
                        selectedColor: AppColors.primary.withOpacity(0.2),
                        backgroundColor: AppColors.surface,
                        onSelected: (selected) {
                          setState(() {
                            _filterCategory = selected ? cat : null;
                          });
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Split widescreen layout
            if (isWidescreen)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 2,
                    child: _buildStockGridList(groupedStock, auth.currentShop),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildWantedSidebar(wantedItems, auth.currentShop),
                  ),
                ],
              )
            else ...[
              _buildStockGridList(groupedStock, auth.currentShop),
              const SizedBox(height: 20),
              _buildWantedSidebar(wantedItems, auth.currentShop),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStockGridList(Map<PurchaseCategory, List<StockItem>> groupedStock, ShopId shopId) {
    final inventory = Provider.of<InventoryProvider>(context, listen: false);

    if (groupedStock.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 48),
        child: Center(
          child: Column(
            children: [
              Icon(Icons.inventory_2_outlined, size: 36, color: AppColors.textMuted),
              SizedBox(height: 12),
              Text('No stock items match search criteria.', style: TextStyle(color: AppColors.textMuted)),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: groupedStock.length,
      itemBuilder: (context, catIndex) {
        final cat = groupedStock.keys.elementAt(catIndex);
        final items = groupedStock[cat]!;

        return Padding(
          padding: const EdgeInsets.only(bottom: 16.0),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Theme(
              data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
              child: ExpansionTile(
                initiallyExpanded: true,
                title: Row(
                  children: [
                    const Icon(Icons.folder_open, size: 14, color: AppColors.primaryLight),
                    const SizedBox(width: 8),
                    Text(
                      cat.displayName.toUpperCase(),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                    ),
                  ],
                ),
                children: [
                  const Divider(color: AppColors.border, height: 1),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      final statusColor = _getStockStatusColor(item);
                      final statusLabel = _getStockStatusLabel(item);

                      return ListTile(
                        leading: CircleAvatar(
                          radius: 5,
                          backgroundColor: statusColor,
                        ),
                        title: Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        subtitle: Row(
                          children: [
                            InkWell(
                              onTap: () {
                                final textController = TextEditingController(text: item.currentQty.toString());
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: Text('Update Quantity (${item.name})'),
                                    content: TextField(
                                      controller: textController,
                                      keyboardType: TextInputType.number,
                                      autofocus: true,
                                      decoration: InputDecoration(suffixText: item.unit.name),
                                    ),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                      ElevatedButton(
                                        onPressed: () async {
                                          final newQty = double.tryParse(textController.text) ?? item.currentQty;
                                          Navigator.pop(ctx);
                                          await inventory.updateStockItem(shopId, item.id, {'availableQty': newQty});
                                        },
                                        child: const Text('Update'),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              child: Text(
                                '${item.currentQty} ${item.unit.name}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontFamily: 'monospace',
                                  fontWeight: FontWeight.bold,
                                  color: statusColor,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                statusLabel,
                                style: TextStyle(fontSize: 9, color: statusColor, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text('min ${item.minThreshold}', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                          ],
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: Icon(
                                item.wanted ? Icons.star : Icons.star_border,
                                color: item.wanted ? Colors.amber : AppColors.textMuted,
                                size: 18,
                              ),
                              onPressed: () async {
                                await inventory.updateStockItem(shopId, item.id, {'isWanted': !item.wanted});
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined, size: 16, color: AppColors.textSecondary),
                              onPressed: () => _showEditStockDialog(item),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 16, color: AppColors.danger),
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (ctx) => AlertDialog(
                                    title: const Text('Delete Stock Item'),
                                    content: const Text('Are you sure you want to delete this item?'),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                      ElevatedButton(
                                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
                                        onPressed: () async {
                                          Navigator.pop(ctx);
                                          await inventory.deleteStockItem(shopId, item.id);
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
        );
      },
    );
  }

  Widget _buildWantedSidebar(List<StockItem> wantedItems, ShopId shopId) {
    final inventory = Provider.of<InventoryProvider>(context, listen: false);

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 16),
                    const SizedBox(width: 8),
                    const Text('Wanted List', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    if (wantedItems.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: Colors.amber.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                        child: Text(wantedItems.length.toString(), style: const TextStyle(fontSize: 10, color: Colors.amber, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
                if (wantedItems.isNotEmpty)
                  TextButton(
                    onPressed: () async {
                      // Batch clear wanted list
                      for (var item in wantedItems) {
                        await inventory.updateStockItem(shopId, item.id, {'isWanted': false});
                      }
                    },
                    child: const Text('Clear All', style: TextStyle(fontSize: 11, color: AppColors.danger)),
                  ),
              ],
            ),
          ),
          const Divider(color: AppColors.border, height: 1),
          if (wantedItems.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48.0, horizontal: 16),
              child: Column(
                children: [
                  Icon(Icons.star_border, size: 32, color: AppColors.textMuted),
                  SizedBox(height: 12),
                  Text('No items marked as wanted.', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  SizedBox(height: 4),
                  Text('Tap the star icon on any stock item to list it here.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: wantedItems.length,
              separatorBuilder: (_, __) => const Divider(color: AppColors.border, height: 1),
              itemBuilder: (context, index) {
                final item = wantedItems[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                CircleAvatar(radius: 3, backgroundColor: _getStockStatusColor(item)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    item.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.star, color: Colors.amber, size: 16),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () async {
                              await inventory.updateStockItem(shopId, item.id, {'isWanted': false});
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Text('Need: ', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                          InkWell(
                            onTap: () {
                              final textController = TextEditingController(text: item.wantedQty.toString());
                              showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: Text('Edit Target Needed Qty (${item.name})'),
                                  content: TextField(
                                    controller: textController,
                                    keyboardType: TextInputType.number,
                                    autofocus: true,
                                    decoration: InputDecoration(suffixText: item.unit.name),
                                  ),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                    ElevatedButton(
                                      onPressed: () async {
                                        final targetVal = double.tryParse(textController.text) ?? item.wantedQty;
                                        Navigator.pop(ctx);
                                        await inventory.updateStockItem(shopId, item.id, {'wantedQty': targetVal});
                                      },
                                      child: const Text('Save'),
                                    ),
                                  ],
                                ),
                              );
                            },
                            child: Text(
                              '${item.wantedQty} ${item.unit.name}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.primaryLight,
                                fontWeight: FontWeight.bold,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      TextField(
                        controller: TextEditingController(text: item.wantedNote),
                        decoration: const InputDecoration(
                          hintText: 'Add buying note...',
                          contentPadding: EdgeInsets.symmetric(vertical: 4),
                          fillColor: Colors.transparent,
                          focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.primary)),
                          enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.border)),
                        ),
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                        onSubmitted: (noteVal) async {
                          await inventory.updateStockItem(shopId, item.id, {'wantedNote': noteVal});
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
