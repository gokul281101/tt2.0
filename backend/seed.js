const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');
const Income = require('./models/Income');
const Expense = require('./models/Expense');
const Commitment = require('./models/Commitment');
const CommitmentPayment = require('./models/CommitmentPayment');
const Purchase = require('./models/Purchase');
const Inventory = require('./models/Inventory');
const PersonalExpense = require('./models/PersonalExpense');
const Debt = require('./models/Debt');
const Staff = require('./models/Staff');
const Attendance = require('./models/Attendance');
const SalaryPayment = require('./models/SalaryPayment');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing collections
  await Promise.all([
    User.deleteMany(),
    Income.deleteMany(),
    Expense.deleteMany(),
    Commitment.deleteMany(),
    CommitmentPayment.deleteMany(),
    Purchase.deleteMany(),
    Inventory.deleteMany(),
    PersonalExpense.deleteMany(),
    Debt.deleteMany(),
    Staff.deleteMany(),
    Attendance.deleteMany(),
    SalaryPayment.deleteMany()
  ]);

  // Admin user
  await User.create({ name: 'Admin', email: 'admin@jsfinance.com', password: 'admin123' });
  console.log('✅ Admin user: admin@jsfinance.com / admin123');

  const shops = ['Shop 1', 'Shop 2'];
  const methods = ['cash', 'gpay', 'zomato'];

  // Seed data for both shops
  for (const shop of shops) {
    console.log(`Seeding data for ${shop}...`);

    // 1. Incomes
    const incomes = [];
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      for (let j = 0; j < 3; j++) {
        const method = methods[j];
        const baseAmount = shop === 'Shop 1' ? 8000 : 6500;
        const randomAmount = Math.floor(Math.random() * 4000) - 1500;
        const amount = Math.max(2000, baseAmount + randomAmount);

        incomes.push({
          amount,
          paymentMethod: method,
          category: 'Full Day Income',
          shop,
          description: `${shop} - Full Day Sales (${method.toUpperCase()})`,
          date: d
        });
      }
    }
    await Income.insertMany(incomes);

    // 2. Expenses
    const expenseTypes = ['Rent & Shop Utilities', 'Staff Wages', 'Packaging Materials', 'Marketing', 'Fresh Fruit Purchase', 'Miscellaneous'];
    const expenses = [];
    for (let i = 15; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 2));
      const type = expenseTypes[i % expenseTypes.length];
      const baseAmount = shop === 'Shop 1' ? 1200 : 900;
      const amount = baseAmount + (Math.floor(Math.random() * 10) * 100);

      expenses.push({
        amount,
        type,
        shop: 'Global',
        description: `${type} payment`,
        date: d
      });
    }
    await Expense.insertMany(expenses);

    // 3. Commitments
    const shopRent = shop === 'Shop 1' ? 25000 : 18000;
    const staffSalary = shop === 'Shop 1' ? 18000 : 14000;
    await Commitment.insertMany([
      { name: 'Shop Rent', emoji: '🏪', amount: shopRent, dueDay: 1, color: '#7c3aed', shop },
      { name: 'Electricity Bill', emoji: '⚡', amount: 3500, dueDay: 10, color: '#f59e0b', shop },
      { name: 'Staff Salary', emoji: '👨‍💼', amount: staffSalary, dueDay: 1, color: '#0ea5e9', shop },
      { name: 'Water & Maintenance', emoji: '💧', amount: 1500, dueDay: 15, color: '#06b6d4', shop },
      { name: 'Internet Router', emoji: '📶', amount: 999, dueDay: 20, color: '#6366f1', shop },
    ]);

    // 4. Purchases
    const products = ['Watermelon', 'Mango', 'Orange', 'Carrot', 'Ginger', 'Mint', 'Sugar', 'Plastic Cups', 'Straws'];
    const purchaseRecords = [];
    for (let i = 10; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - (i * 3));
      const p = products[i % products.length];
      const qty = Math.floor(Math.random() * 20) + 10;
      const ppu = Math.floor(Math.random() * 30) + 20;
      
      purchaseRecords.push({
        productName: p,
        quantity: qty,
        unit: 'kg',
        pricePerUnit: ppu,
        totalAmount: qty * ppu,
        vendorName: 'Local Farmers Market',
        shop,
        purchaseDate: d
      });
    }
    await Purchase.insertMany(purchaseRecords);

    // 5. Inventory (Stock list items for each shop)
    await Inventory.insertMany([
      { productName: 'Watermelon', unit: 'kg', availableQty: 60, purchasedQty: 60, usedQty: 35, remainingQty: 25, minStockLevel: 15, shop },
      { productName: 'Mango', unit: 'kg', availableQty: 40, purchasedQty: 40, usedQty: 38, remainingQty: 2, minStockLevel: 8, shop, isWanted: true },
      { productName: 'Orange', unit: 'kg', availableQty: 50, purchasedQty: 50, usedQty: 46, remainingQty: 4, minStockLevel: 10, shop },
      { productName: 'Ginger', unit: 'kg', availableQty: 12, purchasedQty: 12, usedQty: 10, remainingQty: 2, minStockLevel: 4, shop },
      { productName: 'Sugar', unit: 'kg', availableQty: 30, purchasedQty: 30, usedQty: 18, remainingQty: 12, minStockLevel: 6, shop },
      { productName: 'Plastic Cups', unit: 'packets', availableQty: 25, purchasedQty: 25, usedQty: 22, remainingQty: 3, minStockLevel: 8, shop, isWanted: true },
      { productName: 'Straws', unit: 'packets', availableQty: 20, purchasedQty: 20, usedQty: 10, remainingQty: 10, minStockLevel: 6, shop },
    ]);
  }

  // 6. Personal Expenses
  console.log('Seeding Personal Expenses...');
  await PersonalExpense.insertMany([
    { amount: 1500, category: 'Home', description: 'Groceries and provisions', date: new Date(Date.now() - 3600000 * 24 * 3), paymentMethod: 'cash' },
    { amount: 500, category: 'Personal Use', description: 'Haircut and grooming', date: new Date(Date.now() - 3600000 * 24 * 5), paymentMethod: 'cash' },
    { amount: 4500, category: 'Home', description: 'Electric oven for kitchen', date: new Date(Date.now() - 3600000 * 24 * 10), paymentMethod: 'gpay' },
    { amount: 1200, category: 'Personal Use', description: 'Movie night & dinner', date: new Date(Date.now() - 3600000 * 24 * 12), paymentMethod: 'gpay' },
  ]);

  // 7. Debts
  console.log('Seeding Debts...');
  const debt1 = await Debt.create({
    debtName: 'Shop Expansion Loan',
    creditorName: 'HDFC Business Bank',
    originalAmount: 150000,
    remainingAmount: 150000,
    dueDate: new Date(Date.now() + 3600000 * 24 * 90),
    payments: []
  });

  const debt2 = await Debt.create({
    debtName: 'Fruit Vendor Credit',
    creditorName: 'Venkatesh Fruit Traders',
    originalAmount: 25000,
    remainingAmount: 25000,
    dueDate: new Date(Date.now() + 3600000 * 24 * 15),
    payments: []
  });

  // Make some partial payments
  debt1.payments.push({ amount: 30000, date: new Date(Date.now() - 3600000 * 24 * 20), description: 'Initial installment', paymentMethod: 'gpay' });
  debt1.remainingAmount = 120000;
  await debt1.save();

  debt2.payments.push({ amount: 5000, date: new Date(Date.now() - 3600000 * 24 * 5), description: 'Weekly clearing', paymentMethod: 'cash' });
  debt2.payments.push({ amount: 8000, date: new Date(Date.now() - 3600000 * 24 * 2), description: 'Batch payment', paymentMethod: 'gpay' });
  debt2.remainingAmount = 12000;
  await debt2.save();

  // 8. Staff & Attendance
  console.log('Seeding Staff and Attendance records...');
  const staff1 = await Staff.create({
    name: 'Karthik Raja',
    dailyWage: 750,
    wageHistory: [
      { dailyWage: 650, effectiveDate: new Date(0) },
      { dailyWage: 750, effectiveDate: new Date(Date.now() - 3600000 * 24 * 5) }
    ]
  });
  const staff2 = await Staff.create({ name: 'Manoj Kumar', dailyWage: 550 });
  const staff3 = await Staff.create({ name: 'Srinivasan', dailyWage: 600 });

  // Seed attendance for the last 20 days
  const attendanceRecords = [];
  for (let i = 20; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    // Karthik Raja (present most of the time)
    attendanceRecords.push({ staffId: staff1._id, date: d, status: i % 10 === 0 ? 'absent' : 'present' });
    // Manoj Kumar
    attendanceRecords.push({ staffId: staff2._id, date: d, status: i % 7 === 0 ? 'absent' : 'present' });
    // Srinivasan
    attendanceRecords.push({ staffId: staff3._id, date: d, status: i % 5 === 0 ? 'absent' : 'present' });
  }
  await Attendance.insertMany(attendanceRecords);

  // 9. Seed Salary Payments
  console.log('Seeding Salary Payments...');
  const lastMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth()).padStart(2, "0")}`; // e.g. 2026-05
  await SalaryPayment.create({
    staffId: staff1._id,
    staffName: staff1.name,
    monthKey: lastMonthKey,
    amount: 18 * staff1.dailyWage, // 18 days present
    paymentMethod: 'gpay',
    paidDate: new Date(Date.now() - 3600000 * 24 * 1), // yesterday
    note: 'May salary disbursed'
  });

  console.log('✅ Database seeded successfully with all multi-shop financial records!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
