const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const Inventory = require('../models/Inventory');
const Commitment = require('../models/Commitment');
const CommitmentPayment = require('../models/CommitmentPayment');

exports.getStats = async (req, res) => {
  try {
    const shop = req.headers['x-shop'] || 'Shop 1';
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Income aggregations
    const [totalIncomeRes, dailyIncomeRes, monthlyIncomeRes] = await Promise.all([
      Income.aggregate([{ $match: { shop } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([{ $match: { shop, date: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Income.aggregate([{ $match: { shop, date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    // Expense aggregations
    const [totalExpenseRes, dailyExpenseRes, monthlyExpenseRes] = await Promise.all([
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Expense.aggregate([{ $match: { date: { $gte: monthStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    const totalIncome = totalIncomeRes[0]?.total || 0;
    const totalExpense = totalExpenseRes[0]?.total || 0;

    // Recent transactions
    const recentIncome = await Income.find({ shop }).sort({ date: -1 }).limit(5).lean();
    const recentExpenses = await Expense.find({}).sort({ date: -1 }).limit(5).lean();
    const recent = [...recentIncome.map(i => ({ ...i, kind: 'income' })), ...recentExpenses.map(e => ({ ...e, kind: 'expense' }))]
      .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    // Low stock or wanted alerts
    const lowStock = await Inventory.find({
      shop,
      $or: [
        { $expr: { $lte: ['$remainingQty', '$minStockLevel'] } },
        { isWanted: true }
      ]
    }).limit(10).lean();

    // Pending commitments this month
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const allCommitments = await Commitment.find({ isActive: true });
    const payments = await CommitmentPayment.find({ monthKey });
    const paidIds = new Set(payments.map(p => p.commitmentId.toString()));
    const pendingCommitments = allCommitments.filter(c => !paidIds.has(c._id.toString()));

    // Last 30 days chart data
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start); end.setDate(start.getDate() + 1);
      const [inc, exp] = await Promise.all([
        Income.aggregate([{ $match: { shop, date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      ]);
      last30.push({ date: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), income: inc[0]?.total || 0, expense: exp[0]?.total || 0 });
    }

    // Last 6 months revenue
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d;
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const [inc, exp] = await Promise.all([
        Income.aggregate([{ $match: { shop, date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      ]);
      last6Months.push({ month: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), income: inc[0]?.total || 0, expense: exp[0]?.total || 0 });
    }

    // Expense by type
    const expenseByType = await Expense.aggregate([
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalIncome, totalExpense,
        balance: totalIncome - totalExpense,
        dailyIncome: dailyIncomeRes[0]?.total || 0,
        monthlyIncome: monthlyIncomeRes[0]?.total || 0,
        dailyExpense: dailyExpenseRes[0]?.total || 0,
        monthlyExpense: monthlyExpenseRes[0]?.total || 0,
        recentTransactions: recent,
        lowStockAlerts: lowStock,
        pendingCommitments,
        charts: { last30Days: last30, last6Months, expenseByType },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
