import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/models.dart';

void main() {
  group('Data Models JSON mapping tests', () {
    test('Transaction mapping', () {
      final json = {
        '_id': 'tx123',
        'type': 'income',
        'paymentMethod': 'gpay',
        'amount': 550,
        'category': 'Fresh Juices',
        'description': 'Customer payment',
        'date': '2026-06-12T10:00:00.000Z',
      };

      final tx = Transaction.fromJson(json);

      expect(tx.id, 'tx123');
      expect(tx.type, TransactionType.income);
      expect(tx.paymentMethod, PaymentMethod.gpay);
      expect(tx.amount, 550.0);
      expect(tx.category, 'Fresh Juices');
      expect(tx.description, 'Customer payment');
      expect(tx.date, DateTime.parse('2026-06-12T10:00:00.000Z'));

      final outJson = tx.toJson();
      expect(outJson['type'], 'income');
      expect(outJson['amount'], 550.0);
    });

    test('Purchase mapping', () {
      final json = {
        '_id': 'p987',
        'productName': 'Apple',
        'category': 'Fruits & Vegetables',
        'quantity': 10.5,
        'unit': 'kg',
        'pricePerUnit': 120,
        'totalAmount': 1260,
        'purchaseDate': '2026-06-12T08:00:00.000Z',
      };

      final purchase = Purchase.fromJson(json);

      expect(purchase.id, 'p987');
      expect(purchase.itemName, 'Apple');
      expect(purchase.category, PurchaseCategory.fruitsAndVegetables);
      expect(purchase.quantity, 10.5);
      expect(purchase.unit, PurchaseUnit.kg);
      expect(purchase.pricePerUnit, 120.0);
      expect(purchase.totalPrice, 1260.0);

      final outJson = purchase.toJson();
      expect(outJson['productName'], 'Apple');
      expect(outJson['totalAmount'], 1260.0);
    });

    test('StockItem mapping', () {
      final json = {
        '_id': 's111',
        'productName': 'Mango',
        'category': 'Fruits & Vegetables',
        'availableQty': 4.0,
        'unit': 'kg',
        'minStockLevel': 10.0,
        'isWanted': true,
      };

      final item = StockItem.fromJson(json);

      expect(item.id, 's111');
      expect(item.name, 'Mango');
      expect(item.category, PurchaseCategory.fruitsAndVegetables);
      expect(item.currentQty, 4.0);
      expect(item.minThreshold, 10.0);
      expect(item.wanted, true);
    });
  });
}
