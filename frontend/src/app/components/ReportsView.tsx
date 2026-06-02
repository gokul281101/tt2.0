import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { ChartColumnDecreasing, Store, Landmark, Percent, Layers, ShieldCheck, Users } from "lucide-react";
import type { Transaction, Purchase, Debt, ShopId } from "../types";
import { SHOPS } from "../constants";
import { fmt, fmtShort } from "../utils";

interface ReportsViewProps {
  transactions: Record<ShopId, Transaction[]>;
  purchases: Record<ShopId, Purchase[]>;
  debts: Debt[];
  salaryReport: { staffName: string; calculatedSalary: number }[];
}

export function ReportsView({ transactions, purchases, debts, salaryReport }: ReportsViewProps) {
  const [period, setPeriod] = useState<"30d" | "90d" | "all">("30d");

  // Merge all transactions
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
    return list;
  }, [transactions]);

  // Merge all purchases
  const allPurchases = useMemo(() => {
    const list: Purchase[] = [];
    (Object.keys(purchases) as ShopId[]).forEach((sid) => {
      purchases[sid].forEach((p) => {
        list.push(p);
      });
    });
    return list;
  }, [purchases]);

  // 1. Income vs Expenses Chart data (grouped daily/weekly)
  const incomeVsExpenseData = useMemo(() => {
    const days = period === "30d" ? 30 : 90;
    const now = new Date();
    const map: Record<string, { income: number; expense: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[key] = { income: 0, expense: 0 };
    }

    allTxns.forEach((t) => {
      const key = t.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (map[key]) {
        if (t.type === "income") map[key].income += t.amount;
        else map[key].expense += t.amount;
      }
    });

    const entries = Object.entries(map).map(([label, v]) => ({ label, ...v }));

    // Group by week if 90d to prevent clutter
    if (period === "90d") {
      const grouped: Record<string, { income: number; expense: number }> = {};
      entries.forEach((e, i) => {
        const w = `Wk ${Math.floor(i / 7) + 1}`;
        if (!grouped[w]) grouped[w] = { income: 0, expense: 0 };
        grouped[w].income += e.income;
        grouped[w].expense += e.expense;
      });
      return Object.entries(grouped).map(([label, v]) => ({ label, ...v }));
    }

    return entries;
  }, [allTxns, period]);

  // 2. Shop-wise Performance Comparison
  const shopPerformanceData = useMemo(() => {
    return (Object.keys(SHOPS) as ShopId[]).map((sid) => {
      let income = 0;
      (transactions[sid] || []).forEach((t) => {
        if (t.type === "income") income += t.amount;
      });
      return {
        name: SHOPS[sid].name.split("—")[1]?.trim() || SHOPS[sid].name,
        income,
      };
    });
  }, [transactions]);

  // 3. Cash vs GPay vs Zomato Distribution
  const paymentMethodData = useMemo(() => {
    let cash = 0;
    let gpay = 0;
    let zomato = 0;

    allTxns.forEach((t) => {
      if (t.type === "income") {
        if (t.paymentMethod === "cash") cash += t.amount;
        else if (t.paymentMethod === "gpay") gpay += t.amount;
        else if (t.paymentMethod === "zomato") zomato += t.amount;
      }
    });

    return [
      { name: "Cash Total", value: cash, color: "#1a7a3c" },
      { name: "GPay Total", value: gpay, color: "#0ea5e9" },
      { name: "Zomato Total", value: zomato, color: "#ea580c" },
    ].filter((d) => d.value > 0);
  }, [allTxns]);

  // 4. Monthly Profit trend (last 6 months approximation)
  const monthlyProfitData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const list = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yearStr = d.getFullYear().toString().slice(2);
      const label = `${months[mIdx]} '${yearStr}`;

      let income = 0;
      let expense = 0;

      allTxns.forEach((t) => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === mIdx && tDate.getFullYear() === d.getFullYear()) {
          if (t.type === "income") income += t.amount;
          else expense += t.amount;
        }
      });

      list.push({
        label,
        income,
        expense,
        profit: income - expense,
      });
    }

    return list;
  }, [allTxns]);

  // 5. Purchase Analytics (Highest Spending Categories and frequent items)
  const purchaseAnalytics = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const itemFreq: Record<string, { count: number; spent: number }> = {};

    allPurchases.forEach((p) => {
      categoryTotals[p.category] = (categoryTotals[p.category] || 0) + p.totalPrice;
      
      if (!itemFreq[p.itemName]) itemFreq[p.itemName] = { count: 0, spent: 0 };
      itemFreq[p.itemName].count += 1;
      itemFreq[p.itemName].spent += p.totalPrice;
    });

    const categories = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    const items = Object.entries(itemFreq)
      .map(([name, v]) => ({ name, timesBought: v.count, amountSpent: v.spent }))
      .sort((a, b) => b.amountSpent - a.amountSpent)
      .slice(0, 5);

    return { categories, items };
  }, [allPurchases]);

  // 6. Debt Analytics (Creditors & Remaining Debt status)
  const debtAnalyticsData = useMemo(() => {
    return debts.map((d) => ({
      name: d.debtName,
      original: d.originalAmount,
      remaining: d.remainingAmount,
      settled: d.originalAmount - d.remainingAmount,
    }));
  }, [debts]);

  // 7. Staff Salary Wages distribution
  const staffSalaryData = useMemo(() => {
    return salaryReport.map((s) => ({
      name: s.staffName,
      salary: s.calculatedSalary,
    }));
  }, [salaryReport]);

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="space-y-1">
          <span className="bg-emerald-600/40 text-emerald-300 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/20">
            Analytic Engine
          </span>
          <h2 className="text-xl font-bold tracking-tight">Business Reports & Analytics</h2>
          <p className="text-emerald-100/70 text-xs max-w-md">
            Review detailed business statements, cash distributions, branch comparisons, and outgoings breakdown.
          </p>
        </div>
        <div className="flex gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-1 text-xs">
          {(["30d", "90d", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === p ? "bg-white text-emerald-900 shadow-sm" : "text-emerald-100 hover:text-white"
              }`}
            >
              {p === "30d" ? "Last 30 Days" : p === "90d" ? "Last 90 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {/* Renders charts in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Income vs Expenses */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ChartColumnDecreasing size={14} className="text-emerald-700" />
            Income vs Expenses Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar name="Income" dataKey="income" fill="#1a7a3c" radius={[4, 4, 0, 0]} />
                <Bar name="Expense" dataKey="expense" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Shop-wise Performance */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Store size={14} className="text-emerald-700" />
            Branch Sales Revenue Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar name="Sales Revenue" dataKey="income" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Cash vs GPay vs Zomato Split */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-700" />
            Revenue Payment Method Split
          </h3>
          <div className="h-64 flex flex-col justify-center items-center">
            {paymentMethodData.length === 0 ? (
              <p className="text-xs text-muted-foreground">No income transactions found.</p>
            ) : (
              <div className="h-full w-full flex items-center justify-around flex-wrap">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {paymentMethodData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="font-semibold text-muted-foreground">{d.name}:</span>
                      <span className="font-bold">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Monthly Profit Trend */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Landmark size={14} className="text-emerald-700" />
            Monthly Net Profit Trend (Area)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProfitData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a7a3c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1a7a3c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v: any) => fmt(v)} />
                <Area type="monotone" name="Monthly Profit" dataKey="profit" stroke="#1a7a3c" fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Purchase Analytics (Category breakdown) */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Percent size={14} className="text-emerald-700" />
            Highest Spending Purchase Categories
          </h3>
          <div className="h-64">
            {purchaseAnalytics.categories.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-20">No purchase records registered</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseAnalytics.categories} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={fmtShort} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Bar name="Spent Amount" dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 6: Debt Liabilities Analytics */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-700" />
            Outstanding Debt Progress (original vs remaining)
          </h3>
          <div className="h-64">
            {debtAnalyticsData.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-20">No loan records registered</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={debtAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar name="Settled" dataKey="settled" fill="#10b981" stackId="a" />
                  <Bar name="Remaining Debt" dataKey="remaining" fill="#dc2626" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 7: Staff Salary Wages Comparative Chart */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 md:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users size={14} className="text-emerald-700" />
            Employee Wages comparative report
          </h3>
          <div className="h-64">
            {staffSalaryData.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-20">No employee wage statements found.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffSalaryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={fmtShort} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} width={45} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Bar name="Calculated Wage" dataKey="salary" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
