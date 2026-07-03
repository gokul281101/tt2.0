const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Warning: Could not set custom DNS servers:', e.message);
}

dotenv.config();

const TransactionSchema = new mongoose.Schema({
  amount: Number,
  paymentMethod: String,
  type: String,
  category: String,
  description: String,
  date: Date
});

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB successfully.\n");

  const Expense = mongoose.model('Expense', TransactionSchema, 'expenses');
  const expenses = await Expense.find({});

  const keywords = ["rent", "chat", "mobile", "loan", "kasu", "due"];
  console.log("Expense entries that match commitment keywords:");
  expenses.forEach(e => {
    const desc = (e.description || '').toLowerCase();
    const cat = (e.category || '').toLowerCase();
    const match = keywords.some(k => desc.includes(k) || cat.includes(k));
    if (match) {
      console.log(`  - Date: ${e.date.toISOString().split('T')[0]}, Cat: "${e.category}", Desc: "${e.description}", Amount: ₹${e.amount}, Method: ${e.paymentMethod}`);
    }
  });

  await mongoose.disconnect();
}

main().catch(err => console.error(err));
