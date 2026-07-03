const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Income = require('./models/Income');
const Expense = require('./models/Expense');
const CommitmentPayment = require('./models/CommitmentPayment');
const PersonalExpense = require('./models/PersonalExpense');
const Debt = require('./models/Debt');
const SalaryPayment = require('./models/SalaryPayment');

async function checkDb() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.');

  const allIncomes = await Income.find({});
  const allExpenses = await Expense.find({});
  const allCommitmentPayments = await CommitmentPayment.find({});
  const allPersonalExpenses = await PersonalExpense.find({});
  const allDebts = await Debt.find({});
  const allSalaries = await SalaryPayment.find({});

  console.log(`Incomes count: ${allIncomes.length}`);
  console.log(`Expenses count: ${allExpenses.length}`);
  console.log(`Commitment payments count: ${allCommitmentPayments.length}`);
  console.log(`Personal expenses count: ${allPersonalExpenses.length}`);
  console.log(`Debts count: ${allDebts.length}`);
  console.log(`Salary payments count: ${allSalaries.length}`);

  let cashIncome = 0, gpayIncome = 0, zomatoIncome = 0;
  for (const t of allIncomes) {
    if (t.paymentMethod === 'cash') cashIncome += t.amount;
    if (t.paymentMethod === 'gpay') gpayIncome += t.amount;
    if (t.paymentMethod === 'zomato') zomatoIncome += t.amount;
  }

  let cashExpense = 0, gpayExpense = 0, zomatoExpense = 0;
  for (const t of allExpenses) {
    if (t.paymentMethod === 'cash') cashExpense += t.amount;
    if (t.paymentMethod === 'gpay') gpayExpense += t.amount;
    if (t.paymentMethod === 'zomato') zomatoExpense += t.amount;
  }

  let cashCommitments = 0, gpayCommitments = 0, zomatoCommitments = 0;
  for (const p of allCommitmentPayments) {
    if (p.paymentMethod === 'cash') cashCommitments += p.paidAmount;
    if (p.paymentMethod === 'gpay') gpayCommitments += p.paidAmount;
    if (p.paymentMethod === 'zomato') zomatoCommitments += p.paidAmount;
  }

  let cashPersonal = 0, gpayPersonal = 0, zomatoPersonal = 0;
  for (const p of allPersonalExpenses) {
    const method = p.paymentMethod || 'cash';
    if (method === 'cash') cashPersonal += p.amount;
    if (method === 'gpay') gpayPersonal += p.amount;
    if (method === 'zomato') zomatoPersonal += p.amount;
  }

  let cashDebt = 0, gpayDebt = 0, zomatoDebt = 0;
  for (const d of allDebts) {
    for (const p of d.payments || []) {
      const method = p.paymentMethod || 'cash';
      if (method === 'cash') cashDebt += p.amount;
      if (method === 'gpay') gpayDebt += p.amount;
      if (method === 'zomato') zomatoDebt += p.amount;
    }
  }

  let cashSalary = 0, gpaySalary = 0, zomatoSalary = 0;
  for (const p of allSalaries) {
    const method = p.paymentMethod || 'cash';
    if (method === 'cash') cashSalary += p.amount;
    if (method === 'gpay') gpaySalary += p.amount;
    if (method === 'zomato') zomatoSalary += p.amount;
  }

  console.log('\n--- CALCULATIONS ---');
  console.log('Income:');
  console.log(`  Cash: ${cashIncome}`);
  console.log(`  GPay: ${gpayIncome}`);
  console.log(`  Zomato: ${zomatoIncome}`);

  console.log('Expense:');
  console.log(`  Cash: ${cashExpense}`);
  console.log(`  GPay: ${gpayExpense}`);
  console.log(`  Zomato: ${zomatoExpense}`);

  console.log('Commitments:');
  console.log(`  Cash: ${cashCommitments}`);
  console.log(`  GPay: ${gpayCommitments}`);
  console.log(`  Zomato: ${zomatoCommitments}`);

  console.log('Personal:');
  console.log(`  Cash: ${cashPersonal}`);
  console.log(`  GPay: ${gpayPersonal}`);
  console.log(`  Zomato: ${zomatoPersonal}`);

  console.log('Debt Payments:');
  console.log(`  Cash: ${cashDebt}`);
  console.log(`  GPay: ${gpayDebt}`);
  console.log(`  Zomato: ${zomatoDebt}`);

  console.log('Salary Payments:');
  console.log(`  Cash: ${cashSalary}`);
  console.log(`  GPay: ${gpaySalary}`);
  console.log(`  Zomato: ${zomatoSalary}`);

  const cash = cashIncome - cashExpense - cashCommitments - cashPersonal - cashDebt - cashSalary;
  const gpay = gpayIncome - gpayExpense - gpayCommitments - gpayPersonal - gpayDebt - gpaySalary;
  const zomato = zomatoIncome - zomatoExpense - zomatoCommitments - zomatoPersonal - zomatoDebt - zomatoSalary;

  console.log('\nFinal balances:');
  console.log(`  Cash: ${cash}`);
  console.log(`  GPay: ${gpay}`);
  console.log(`  Zomato: ${zomato}`);

  await mongoose.disconnect();
}

checkDb().catch(console.error);
