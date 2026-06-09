import { useMemo } from "react";
import {
  Banknote,
  Smartphone,
  Layers,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Store,
  Flame,
  Trash2,
  HeartHandshake,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type {
  Transaction,
  ShopId,
  PersonalExpense,
  Debt,
  SalaryPayment,
  Commitment,
  CommitmentPayment,
} from "../types";
import { SHOPS } from "../constants";
import { fmt, fmtShort } from "../utils";

interface DashboardViewProps {
  transactions: Record<ShopId, Transaction[]>;
  personalExpenses: PersonalExpense[];
  debts: Debt[];
  salaryPayments: SalaryPayment[];
  commitments: Commitment[];
  commitmentPayments: CommitmentPayment[];
  onNavigateTo: (view: any) => void;
  onSelectShop: (shopId: ShopId) => void;
  onDelete: (id: string, type: any, targetShop: ShopId) => void;
  onAddIncome: () => void;
  onAddExpense: () => void;
  onAddPersonal: () => void;
}

export function DashboardView({
  transactions,
  personalExpenses,
  debts,
  salaryPayments,
  commitments,
  commitmentPayments,
  onNavigateTo,
  onSelectShop,
  onDelete,
  onAddIncome,
  onAddExpense,
  onAddPersonal,
}: DashboardViewProps) {
  // Combine all transactions with shop annotations
  const allTxns = useMemo(() => {
    const list: (Transaction & { shopId: ShopId })[] = [];
    const seen = new Set<string>();
    (Object.keys(transactions) as ShopId[]).forEach((sid) => {
      transactions[sid].forEach((t) => {
        if (t.type === "expense") {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            list.push({ ...t, shopId: sid });
          }
        } else {
          list.push({ ...t, shopId: sid });
        }
      });
    });
    return list.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  // Compute combined totals
  const stats = useMemo(() => {
    // 1. Transactions Income/Expense
    let cashIncome = 0;
    let gpayIncome = 0;
    let zomatoIncome = 0;
    let cashExpense = 0;
    let gpayExpense = 0;
    let zomatoExpense = 0;

    allTxns.forEach((t) => {
      if (t.type === "income") {
        if (t.paymentMethod === "cash") cashIncome += t.amount;
        else if (t.paymentMethod === "gpay") gpayIncome += t.amount;
        else if (t.paymentMethod === "zomato") zomatoIncome += t.amount;
      } else {
        if (t.paymentMethod === "cash") cashExpense += t.amount;
        else if (t.paymentMethod === "gpay") gpayExpense += t.amount;
        else if (t.paymentMethod === "zomato") zomatoExpense += t.amount;
      }
    });

    // 2. Commitments Payments
    let cashCommitments = 0;
    let gpayCommitments = 0;
    let zomatoCommitments = 0;
    let totalCommitments = 0;
    commitmentPayments.forEach((p) => {
      totalCommitments += p.paidAmount;
      if (p.paymentMethod === "cash") cashCommitments += p.paidAmount;
      else if (p.paymentMethod === "gpay") gpayCommitments += p.paidAmount;
      else if (p.paymentMethod === "zomato") zomatoCommitments += p.paidAmount;
    });

    // 3. Personal Expenses
    let cashPersonal = 0;
    let gpayPersonal = 0;
    let zomatoPersonal = 0;
    let totalPersonal = 0;
    personalExpenses.forEach((p) => {
      totalPersonal += p.amount;
      const pm = p.paymentMethod || "cash";
      if (pm === "cash") cashPersonal += p.amount;
      else if (pm === "gpay") gpayPersonal += p.amount;
      else if (pm === "zomato") zomatoPersonal += p.amount;
    });

    // 4. Debt Payments & Outstanding Debt
    let cashDebt = 0;
    let gpayDebt = 0;
    let zomatoDebt = 0;
    let totalDebtPayments = 0;
    let totalDebtOutstanding = 0;
    debts.forEach((d) => {
      totalDebtOutstanding += d.remainingAmount;
      (d.payments || []).forEach((p) => {
        totalDebtPayments += p.amount;
        const pm = p.paymentMethod || "cash";
        if (pm === "cash") cashDebt += p.amount;
        else if (pm === "gpay") gpayDebt += p.amount;
        else if (pm === "zomato") zomatoDebt += p.amount;
      });
    });

    // 5. Salary Payments
    let cashSalary = 0;
    let gpaySalary = 0;
    let zomatoSalary = 0;
    let totalSalary = 0;
    salaryPayments.forEach((p) => {
      totalSalary += p.amount;
      const pm = p.paymentMethod || "cash";
      if (pm === "cash") cashSalary += p.amount;
      else if (pm === "gpay") gpaySalary += p.amount;
      else if (pm === "zomato") zomatoSalary += p.amount;
    });

    // Calculate symmetrical Cash/GPay/Zomato remaining balances
    const cash = cashIncome - cashExpense - cashCommitments - cashPersonal - cashDebt - cashSalary;
    const gpay = gpayIncome - gpayExpense - gpayCommitments - gpayPersonal - gpayDebt - gpaySalary;
    const zomato = zomatoIncome - zomatoExpense - zomatoCommitments - zomatoPersonal - zomatoDebt - zomatoSalary;

    const expensesTotal = cashExpense + gpayExpense + zomatoExpense;
    const totalSalesIncome = cashIncome + gpayIncome + zomatoIncome;
    const balance = cash + gpay + zomato;

    // Net Profit = Overall Sales − (Expenses + Commitments)
    const netProfit = totalSalesIncome - (expensesTotal + totalCommitments);

    // Yesterday closing balances calculation (dates strictly before today)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let yestCashIncome = 0;
    let yestGpayIncome = 0;
    let yestZomatoIncome = 0;
    let yestCashExpense = 0;
    let yestGpayExpense = 0;
    let yestZomatoExpense = 0;

    allTxns.forEach((t) => {
      if (new Date(t.date) < todayStart) {
        if (t.type === "income") {
          if (t.paymentMethod === "cash") yestCashIncome += t.amount;
          else if (t.paymentMethod === "gpay") yestGpayIncome += t.amount;
          else if (t.paymentMethod === "zomato") yestZomatoIncome += t.amount;
        } else {
          if (t.paymentMethod === "cash") yestCashExpense += t.amount;
          else if (t.paymentMethod === "gpay") yestGpayExpense += t.amount;
          else if (t.paymentMethod === "zomato") yestZomatoExpense += t.amount;
        }
      }
    });

    let yestCashCommitments = 0;
    let yestGpayCommitments = 0;
    let yestZomatoCommitments = 0;
    commitmentPayments.forEach((p) => {
      if (new Date(p.paidDate) < todayStart) {
        if (p.paymentMethod === "cash") yestCashCommitments += p.paidAmount;
        else if (p.paymentMethod === "gpay") yestGpayCommitments += p.paidAmount;
        else if (p.paymentMethod === "zomato") yestZomatoCommitments += p.paidAmount;
      }
    });

    let yestCashPersonal = 0;
    let yestGpayPersonal = 0;
    let yestZomatoPersonal = 0;
    personalExpenses.forEach((p) => {
      if (new Date(p.date) < todayStart) {
        const pm = p.paymentMethod || "cash";
        if (pm === "cash") yestCashPersonal += p.amount;
        else if (pm === "gpay") yestGpayPersonal += p.amount;
        else if (pm === "zomato") yestZomatoPersonal += p.amount;
      }
    });

    let yestCashDebt = 0;
    let yestGpayDebt = 0;
    let yestZomatoDebt = 0;
    debts.forEach((d) => {
      (d.payments || []).forEach((p) => {
        if (new Date(p.date) < todayStart) {
          const pm = p.paymentMethod || "cash";
          if (pm === "cash") yestCashDebt += p.amount;
          else if (pm === "gpay") yestGpayDebt += p.amount;
          else if (pm === "zomato") yestZomatoDebt += p.amount;
        }
      });
    });

    let yestCashSalary = 0;
    let yestGpaySalary = 0;
    let yestZomatoSalary = 0;
    salaryPayments.forEach((p) => {
      if (new Date(p.paidDate) < todayStart) {
        const pm = p.paymentMethod || "cash";
        if (pm === "cash") yestCashSalary += p.amount;
        else if (pm === "gpay") yestGpaySalary += p.amount;
        else if (pm === "zomato") yestZomatoSalary += p.amount;
      }
    });

    const yesterdayCash = yestCashIncome - yestCashExpense - yestCashCommitments - yestCashPersonal - yestCashDebt - yestCashSalary;
    const yesterdayGpay = yestGpayIncome - yestGpayExpense - yestGpayCommitments - yestGpayPersonal - yestGpayDebt - yestGpaySalary;
    const yesterdayZomato = yestZomatoIncome - yestZomatoExpense - yestZomatoCommitments - yestZomatoPersonal - yestZomatoDebt - yestZomatoSalary;

    return {
      cash,
      gpay,
      zomato,
      yesterdayCash,
      yesterdayGpay,
      yesterdayZomato,
      expenses: expensesTotal,
      balance,
      netProfit,
      incomeTotal: totalSalesIncome,
    };
  }, [allTxns, personalExpenses, debts, salaryPayments, commitmentPayments]);

  // Shop-wise breakdown
  const shopPerformance = useMemo(() => {
    return (Object.keys(SHOPS) as ShopId[]).map((sid) => {
      let income = 0;
      let expense = 0;
      (transactions[sid] || []).forEach((t) => {
        if (t.type === "income") income += t.amount;
        else expense += t.amount;
      });
      return {
        name: SHOPS[sid].name.split("—")[1]?.trim() || SHOPS[sid].name,
        shortName: SHOPS[sid].name.split("—")[0]?.trim() || "Shop",
        income,
        expense,
        profit: income - expense,
        color: SHOPS[sid].color,
        shopId: sid,
      };
    });
  }, [transactions]);

  // Payment method breakdown for Pie Chart
  const paymentChartData = useMemo(() => {
    return [
      { name: "Cash Total", value: Math.max(0, stats.cash), color: "#b45309" },
      { name: "GPay Total", value: Math.max(0, stats.gpay), color: "#0ea5e9" },
      { name: "Zomato Total", value: Math.max(0, stats.zomato), color: "#ea580c" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const recentList = useMemo(() => allTxns.slice(0, 8), [allTxns]);

  return (
    <div className="space-y-6">
      {/* Upper Section Header (No green box) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-5 border-b border-border">
        <div className="max-w-xl space-y-1.5">
          <span className="bg-primary/10 text-primary text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-primary/20">
            Unified Executive Dashboard
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Trending Thamila Combined Analytics</h2>
          <p className="text-muted-foreground text-xs">
            Reviewing combined results, revenue streams, and expense reports across both <strong>Theppakulam</strong> and <strong>Anuppanadi</strong> shop branches.
            <button
              onClick={() => onNavigateTo("reports")}
              className="inline-flex items-center gap-0.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-500 hover:underline transition-colors ml-1.5 cursor-pointer"
            >
              Detailed Reports <ArrowRight size={12} />
            </button>
          </p>
        </div>

        {/* Quick Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-shrink-0">
          <button
            onClick={onAddIncome}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-600 active:scale-[0.97] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            📈 Add Shop Income
          </button>
          <button
            onClick={onAddExpense}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-white bg-amber-700 hover:bg-amber-600 active:scale-[0.97] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            📉 Add Shop Expense
          </button>
          <button
            onClick={onAddPersonal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-extrabold text-white bg-purple-700 hover:bg-purple-600 active:scale-[0.97] shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            💜 Add Quick Personal
          </button>
        </div>
      </div>

      {/* KPI Cards — order: Cash, GPay, Zomato, Expenses, Net Profit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

        {/* Total Cash */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Cash</span>
            <div className="flex flex-col items-end">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Banknote size={15} />
              </div>
              <span className="text-[9px] font-bold mt-1 text-muted-foreground whitespace-nowrap">
                Yest: {fmt(stats.yesterdayCash)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black font-[DM_Mono,monospace] text-amber-700">
              {fmt(stats.cash)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Hand-cash total balance</p>
          </div>
        </div>

        {/* Total GPay */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total GPay</span>
            <div className="flex flex-col items-end">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Smartphone size={15} />
              </div>
              <span className="text-[9px] font-bold mt-1 text-muted-foreground whitespace-nowrap">
                Yest: {fmt(stats.yesterdayGpay)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black font-[DM_Mono,monospace] text-sky-700">
              {fmt(stats.gpay)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Direct digital bank total</p>
          </div>
        </div>

        {/* Total Zomato */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Zomato</span>
            <div className="flex flex-col items-end">
              <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Flame size={15} />
              </div>
              <span className="text-[9px] font-bold mt-1 text-muted-foreground whitespace-nowrap">
                Yest: {fmt(stats.yesterdayZomato)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-black font-[DM_Mono,monospace] text-orange-600">
              {fmt(stats.zomato)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Zomato platform sales</p>
          </div>
        </div>

        {/* Total Balance */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Balance</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet size={15} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black font-[DM_Mono,monospace] text-emerald-700">
              {fmt(stats.balance)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Combined digital & cash balance</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expenses</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown size={15} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black font-[DM_Mono,monospace] text-red-600">
              {fmt(stats.expenses)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Aggregated expenditure</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Profit</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black font-[DM_Mono,monospace] ${
              stats.netProfit >= 0 ? "text-emerald-700" : "text-red-600"
            }`}>
              {fmt(stats.netProfit)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Overall Sales − (Expenses + Commitments)</p>
          </div>
        </div>

      </div>

      {/* Main performance graphs and sales splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Side: Branch Performance */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Store size={15} className="text-emerald-700" />
            Branch Performance Comparison
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {shopPerformance.map((shop) => (
              <div
                key={shop.name}
                onClick={() => {
                  onSelectShop(shop.shopId);
                  onNavigateTo("sales");
                }}
                className="cursor-pointer border border-border/80 rounded-2xl p-4 bg-muted/20 hover:bg-muted/40 hover:border-emerald-600/30 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shop.color }} />
                    {shop.shortName}
                  </span>
                  <span className="text-[10px] bg-card px-2 py-0.5 border rounded-full text-muted-foreground">
                    Journal
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Sales Revenue</p>
                  <p className="text-lg font-black font-[DM_Mono,monospace]" style={{ color: shop.color }}>
                    {fmt(shop.income)}
                  </p>
                </div>
                <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-2 flex justify-between">
                  <span>Branch Gross Sales</span>
                  <span className="font-bold text-green-700">+{fmtShort(shop.income)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="h-64 pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} width={45} />
                <Tooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar name="Sales Revenue" dataKey="income" fill="#1a7a3c" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Cash vs GPay vs Zomato split */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 flex flex-col">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Layers size={15} className="text-emerald-700" />
            Revenue Payment Split
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribution of gross cash receipts vs electronic GPay receipts vs Zomato orders.
          </p>

          <div className="flex-1 flex flex-col justify-center items-center py-4">
            {paymentChartData.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10">No sales transactions found</p>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full space-y-2 mt-4">
                  {paymentChartData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs border-b border-border/50 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="font-semibold text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-bold font-[DM_Mono,monospace]">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Ledger logs */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">Combined Branch Activity Ledger</h3>
          <button
            onClick={() => onNavigateTo("sales")}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline underline-offset-2 transition-all"
          >
            Go to Sales Journal
          </button>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {recentList.length === 0 && (
            <p className="text-center text-muted-foreground text-xs py-8">
              No transactions recorded in database.
            </p>
          )}
          {recentList.map((t) => {
            const sh = SHOPS[t.shopId];
            return (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all text-xs group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm`}
                    style={{ backgroundColor: sh.color + "15" }}
                  >
                    {t.type === "income" ? "📈" : "📉"}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{t.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground text-[10px]">
                      <span className="font-bold px-1 rounded bg-muted text-muted-foreground">{sh.name.split("—")[0].trim()}</span>
                      <span>·</span>
                      <span>{t.category}</span>
                      <span>·</span>
                      <span className="capitalize">{t.paymentMethod}</span>
                      <span>·</span>
                      <span>
                        {t.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-black font-[DM_Mono,monospace] text-right ${
                      t.type === "income" ? "text-green-700" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {fmt(t.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete this ${t.type === "income" ? "income" : "expense"} entry?`)) {
                        onDelete(t.id, t.type, t.shopId);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-red-50 opacity-70 hover:opacity-100 transition-opacity"
                    title="Delete Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
