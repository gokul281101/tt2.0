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

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for database reset...');

  // Clear only transaction amount records (Incomes, Expenses, Purchases, and Commitment Payments)
  await Promise.all([
    Income.deleteMany(),
    Expense.deleteMany(),
    Purchase.deleteMany(),
    CommitmentPayment.deleteMany()
  ]);

  // Admin user
  let admin = await User.findOne({ email: 'admin@jsfinance.com' });
  if (!admin) {
    await User.create({ name: 'Admin', email: 'admin@jsfinance.com', password: 'admin123' });
    console.log('✅ Created admin user: admin@jsfinance.com / admin123');
  }
  console.log('✅ Database reset complete!');
  process.exit(0);
}

reset().catch(err => {
  console.error('❌ Error during database reset:', err);
  process.exit(1);
});
