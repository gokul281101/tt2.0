import { useMemo, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
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
  Purchase,
} from "../types";
import { SHOPS } from "../constants";
import { fmt, fmtShort, mkFromDate, mkLabel } from "../utils";

interface DashboardViewProps {
  transactions: Record<ShopId, Transaction[]>;
  personalExpenses: PersonalExpense[];
  debts: Debt[];
  salaryPayments: SalaryPayment[];
  commitments: Commitment[];
  commitmentPayments: CommitmentPayment[];
  purchases: Record<ShopId, Purchase[]>;
  selectedMonth: string;
  onMonthChange: (mk: string) => void;
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
  purchases,
  selectedMonth,
  onMonthChange,
  onNavigateTo,
  onSelectShop,
  onDelete,
  onAddIncome,
  onAddExpense,
  onAddPersonal,
}: DashboardViewProps) {
  const currentMonthKey = useMemo(() => mkFromDate(new Date()), []);
  const filterMonthKey = selectedMonth;

  function shiftMonth(delta: number) {
    const [y, m] = filterMonthKey.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    onMonthChange(mkFromDate(d));
  }

  const isCurrentMonth = filterMonthKey === currentMonthKey;
  const filterMonthLabel = mkLabel(filterMonthKey);
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
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const isInSelectedMonth = (d: any) => {
      if (!d) return false;
      const dateObj = d instanceof Date ? d : new Date(d);
      return mkFromDate(dateObj) === filterMonthKey;
    };

    const isBeforeToday = (d: any) => {
      if (!d) return false;
      const dateObj = d instanceof Date ? d : new Date(d);
      return dateObj < todayStart;
    };

    // 1. Transactions Income/Expense for Selected Month
    const monthlyTxns = allTxns.filter((t) => isInSelectedMonth(t.date));

    const monthlyIncome = monthlyTxns.reduce(
      (sum, t) => (t.type === "income" ? sum + t.amount : sum),
      0
    );
    const cashIncome = monthlyTxns.reduce(
      (sum, t) => (t.type === "income" && t.paymentMethod === "cash" ? sum + t.amount : sum),
      0
    );
    const gpayIncome = monthlyTxns.reduce(
      (sum, t) => (t.type === "income" && t.paymentMethod === "gpay" ? sum + t.amount : sum),
      0
    );
    const zomatoIncome = monthlyTxns.reduce(
      (sum, t) => (t.type === "income" && t.paymentMethod === "zomato" ? sum + t.amount : sum),
      0
    );

    // Monthly expense transactions (which ALREADY include all purchases)
    const cashExpense = monthlyTxns.reduce(
      (sum, t) => (t.type === "expense" && t.paymentMethod === "cash" ? sum + t.amount : sum),
      0
    );
    const gpayExpense = monthlyTxns.reduce(
      (sum, t) => (t.type === "expense" && t.paymentMethod === "gpay" ? sum + t.amount : sum),
      0
    );
    const zomatoExpense = monthlyTxns.reduce(
      (sum, t) => (t.type === "expense" && t.paymentMethod === "zomato" ? sum + t.amount : sum),
      0
    );

    // Combine all purchases across shops
    const allPurchasesList: Purchase[] = [];
    (Object.keys(purchases) as ShopId[]).forEach((sid) => {
      (purchases[sid] || []).forEach((p) => {
        allPurchasesList.push(p);
      });
    });

    const monthlyPurchases = allPurchasesList.filter((p) => isInSelectedMonth(p.date));
    const totalPurchases = monthlyPurchases.reduce((sum, p) => sum + p.totalPrice, 0);

    // Extract purchase expense IDs to prevent double counting in Net Profit ONLY
    const purchaseExpenseIds = new Set<string>();
    monthlyPurchases.forEach((p) => {
      if (p.expenseId) {
        purchaseExpenseIds.add(p.expenseId);
      }
    });

    // Monthly Expenses (which already automatically includes all purchases)
    const monthlyExpenses = monthlyTxns.reduce(
      (sum, t) => (t.type === "expense" ? sum + t.amount : sum),
      0
    );

    // 2. Commitments Payments
    const cashCommitments = commitmentPayments.reduce((sum, p) => {
      if (p.monthKey !== filterMonthKey) return sum;
      if (p.partialPayments && p.partialPayments.length > 0) {
        return sum + p.partialPayments.reduce((s, pp) => pp.paymentMethod === "cash" ? s + pp.amount : s, 0);
      }
      return p.paymentMethod === "cash" ? sum + p.paidAmount : sum;
    }, 0);
    const gpayCommitments = commitmentPayments.reduce((sum, p) => {
      if (p.monthKey !== filterMonthKey) return sum;
      if (p.partialPayments && p.partialPayments.length > 0) {
        return sum + p.partialPayments.reduce((s, pp) => pp.paymentMethod === "gpay" ? s + pp.amount : s, 0);
      }
      return p.paymentMethod === "gpay" ? sum + p.paidAmount : sum;
    }, 0);
    const zomatoCommitments = commitmentPayments.reduce((sum, p) => {
      if (p.monthKey !== filterMonthKey) return sum;
      if (p.partialPayments && p.partialPayments.length > 0) {
        return sum + p.partialPayments.reduce((s, pp) => pp.paymentMethod === "zomato" ? s + pp.amount : s, 0);
      }
      return p.paymentMethod === "zomato" ? sum + p.paidAmount : sum;
    }, 0);
    const totalCommitments = commitmentPayments.reduce((sum, p) => p.monthKey === filterMonthKey ? sum + p.paidAmount : sum, 0);

    // 3. Personal Expenses
    const cashPersonal = personalExpenses.reduce((sum, p) => isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "cash" ? sum + p.amount : sum, 0);
    const gpayPersonal = personalExpenses.reduce((sum, p) => isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "gpay" ? sum + p.amount : sum, 0);
    const zomatoPersonal = personalExpenses.reduce((sum, p) => isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "zomato" ? sum + p.amount : sum, 0);

    // 4. Debt Payments
    const cashDebt = debts.reduce((sum, d) => sum + (d.payments || []).reduce((s, p) => isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "cash" ? s + p.amount : s, 0), 0);
    const gpayDebt = debts.reduce((sum, d) => sum + (d.payments || []).reduce((s, p) => isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "gpay" ? s + p.amount : s, 0), 0);
    const zomatoDebt = debts.reduce((sum, d) => sum + (d.payments || []).reduce((s, p) => isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "zomato" ? s + p.amount : s, 0), 0);

    // 5. Salary Payments
    const cashSalary = salaryPayments.reduce((sum, p) => p.monthKey === filterMonthKey && (p.paymentMethod || "cash") === "cash" ? sum + p.amount : sum, 0);
    const gpaySalary = salaryPayments.reduce((sum, p) => p.monthKey === filterMonthKey && (p.paymentMethod || "cash") === "gpay" ? sum + p.amount : sum, 0);
    const zomatoSalary = salaryPayments.reduce((sum, p) => p.monthKey === filterMonthKey && (p.paymentMethod || "cash") === "zomato" ? sum + p.amount : sum, 0);
    const totalSalary = salaryPayments.reduce((sum, p) => p.monthKey === filterMonthKey ? sum + p.amount : sum, 0);

    // Symmetrical Cash/GPay/Zomato remaining balances
    const cash = cashIncome - cashExpense - cashCommitments - cashPersonal - cashDebt - cashSalary;
    const gpay = gpayIncome - gpayExpense - gpayCommitments - gpayPersonal - gpayDebt - gpaySalary;
    const zomatoVal = zomatoIncome - zomatoExpense - zomatoCommitments - zomatoPersonal - zomatoDebt - zomatoSalary;
    const zomato = zomatoVal === 0 ? 0 : zomatoVal;

    // Use: const totalExpenses = monthlyExpenses;
    const totalExpenses = monthlyExpenses;

    const balance = cash + gpay + zomato;

    // Net Profit = Overall Sales − (Shop Expenses + Commitments + Salaries)
    const netProfit = monthlyIncome - totalExpenses - totalCommitments - totalSalary;

    // Yesterday calculations restricted to the selected month and dates before today
    const yestCashIncome = monthlyTxns.reduce(
      (sum, t) =>
        t.type === "income" && t.paymentMethod === "cash" && isBeforeToday(t.date)
          ? sum + t.amount
          : sum,
      0
    );
    const yestGpayIncome = monthlyTxns.reduce(
      (sum, t) =>
        t.type === "income" && t.paymentMethod === "gpay" && isBeforeToday(t.date)
          ? sum + t.amount
          : sum,
      0
    );
    const yestZomatoIncome = monthlyTxns.reduce(
      (sum, t) =>
        t.type === "income" && t.paymentMethod === "zomato" && isBeforeToday(t.date)
          ? sum + t.amount
          : sum,
      0
    );

    const yestCashExpense = monthlyTxns.reduce(
      (sum, t) =>
        t.type === "expense" && t.paymentMethod === "cash" && isBeforeToday(t.date)
          ? sum + t.amount
          : sum,
      0
    );
    const yestGpayExpense = monthlyTxns.reduce(
      (sum, t) =>
        t.type === "expense" && t.paymentMethod === "gpay" && isBeforeToday(t.date)
          ? sum + t.amount
          : sum,
      0
    );
    const yestZomatoExpense = monthlyTxns.reduce(
      (sum, t) =>
        t.type === "expense" && t.paymentMethod === "zomato" && isBeforeToday(t.date)
          ? sum + t.amount
          : sum,
      0
    );

    const yestCashCommitments = commitmentPayments.reduce((sum, p) => {
      if (p.monthKey !== filterMonthKey) return sum;
      if (p.partialPayments && p.partialPayments.length > 0) {
        return (
          sum +
          p.partialPayments.reduce(
            (s, pp) =>
              pp.paymentMethod === "cash" && isBeforeToday(pp.paidDate) ? s + pp.amount : s,
            0
          )
        );
      }
      return p.paymentMethod === "cash" && isBeforeToday(p.paidDate) ? sum + p.paidAmount : sum;
    }, 0);

    const yestGpayCommitments = commitmentPayments.reduce((sum, p) => {
      if (p.monthKey !== filterMonthKey) return sum;
      if (p.partialPayments && p.partialPayments.length > 0) {
        return (
          sum +
          p.partialPayments.reduce(
            (s, pp) =>
              pp.paymentMethod === "gpay" && isBeforeToday(pp.paidDate) ? s + pp.amount : s,
            0
          )
        );
      }
      return p.paymentMethod === "gpay" && isBeforeToday(p.paidDate) ? sum + p.paidAmount : sum;
    }, 0);

    const yestZomatoCommitments = commitmentPayments.reduce((sum, p) => {
      if (p.monthKey !== filterMonthKey) return sum;
      if (p.partialPayments && p.partialPayments.length > 0) {
        return (
          sum +
          p.partialPayments.reduce(
            (s, pp) =>
              pp.paymentMethod === "zomato" && isBeforeToday(pp.paidDate) ? s + pp.amount : s,
            0
          )
        );
      }
      return p.paymentMethod === "zomato" && isBeforeToday(p.paidDate) ? sum + p.paidAmount : sum;
    }, 0);

    const yestCashPersonal = personalExpenses.reduce(
      (sum, p) =>
        isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "cash" && isBeforeToday(p.date)
          ? sum + p.amount
          : sum,
      0
    );
    const yestGpayPersonal = personalExpenses.reduce(
      (sum, p) =>
        isInSelectedMonth(p.date) && (p.paymentMethod || "cash") === "gpay" && isBeforeToday(p.date)
          ? sum + p.amount
          : sum,
      0
    );
    const yestZomatoPersonal = personalExpenses.reduce(
      (sum, p) =>
        isInSelectedMonth(p.date) &&
          (p.paymentMethod || "cash") === "zomato" &&
          isBeforeToday(p.date)
          ? sum + p.amount
          : sum,
      0
    );

    const yestCashDebt = debts.reduce(
      (sum, d) =>
        sum +
        (d.payments || []).reduce(
          (s, p) =>
            isInSelectedMonth(p.date) &&
              (p.paymentMethod || "cash") === "cash" &&
              isBeforeToday(p.date)
              ? s + p.amount
              : s,
          0
        ),
      0
    );
    const yestGpayDebt = debts.reduce(
      (sum, d) =>
        sum +
        (d.payments || []).reduce(
          (s, p) =>
            isInSelectedMonth(p.date) &&
              (p.paymentMethod || "cash") === "gpay" &&
              isBeforeToday(p.date)
              ? s + p.amount
              : s,
          0
        ),
      0
    );
    const yestZomatoDebt = debts.reduce(
      (sum, d) =>
        sum +
        (d.payments || []).reduce(
          (s, p) =>
            isInSelectedMonth(p.date) &&
              (p.paymentMethod || "cash") === "zomato" &&
              isBeforeToday(p.date)
              ? s + p.amount
              : s,
          0
        ),
      0
    );

    const yestCashSalary = salaryPayments.reduce(
      (sum, p) =>
        p.monthKey === filterMonthKey &&
          (p.paymentMethod || "cash") === "cash" &&
          isBeforeToday(p.paidDate)
          ? sum + p.amount
          : sum,
      0
    );
    const yestGpaySalary = salaryPayments.reduce(
      (sum, p) =>
        p.monthKey === filterMonthKey &&
          (p.paymentMethod || "cash") === "gpay" &&
          isBeforeToday(p.paidDate)
          ? sum + p.amount
          : sum,
      0
    );
    const yestZomatoSalary = salaryPayments.reduce(
      (sum, p) =>
        p.monthKey === filterMonthKey &&
          (p.paymentMethod || "cash") === "zomato" &&
          isBeforeToday(p.paidDate)
          ? sum + p.amount
          : sum,
      0
    );

    const yesterdayCash =
      yestCashIncome -
      yestCashExpense -
      yestCashCommitments -
      yestCashPersonal -
      yestCashDebt -
      yestCashSalary;
    const yesterdayGpay =
      yestGpayIncome -
      yestGpayExpense -
      yestGpayCommitments -
      yestGpayPersonal -
      yestGpayDebt -
      yestGpaySalary;
    const yesterdayZomatoVal =
      yestZomatoIncome -
      yestZomatoExpense -
      yestZomatoCommitments -
      yestZomatoPersonal -
      yestZomatoDebt -
      yestZomatoSalary;
    const yesterdayZomato = yesterdayZomatoVal === 0 ? 0 : yesterdayZomatoVal;

    return {
      cash,
      gpay,
      zomato,
      yesterdayCash,
      yesterdayGpay,
      yesterdayZomato,
      expenses: totalExpenses,
      balance,
      netProfit,
      incomeTotal: monthlyIncome,
    };
  }, [allTxns, personalExpenses, debts, salaryPayments, commitmentPayments, purchases, filterMonthKey]);

  // Shop-wise breakdown for selected month
  const shopPerformance = useMemo(() => {
    const isInSelectedMonth = (d: any) => {
      if (!d) return false;
      const dateObj = d instanceof Date ? d : new Date(d);
      return mkFromDate(dateObj) === filterMonthKey;
    };

    return (Object.keys(SHOPS) as ShopId[]).map((sid) => {
      let income = 0;
      let expense = 0;
      (transactions[sid] || []).forEach((t) => {
        if (isInSelectedMonth(t.date)) {
          if (t.type === "income") income += t.amount;
          else expense += t.amount;
        }
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
  }, [transactions, filterMonthKey]);

  // Payment method breakdown for Pie Chart
  const paymentChartData = useMemo(() => {
    return [
      { name: "Cash Total", value: Math.max(0, stats.cash), color: "#b45309" },
      { name: "GPay Total", value: Math.max(0, stats.gpay), color: "#0ea5e9" },
      { name: "Zomato Total", value: Math.max(0, stats.zomato), color: "#ea580c" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const recentList = useMemo(() => {
    const isInSelectedMonth = (d: any) => {
      if (!d) return false;
      const dateObj = d instanceof Date ? d : new Date(d);
      return mkFromDate(dateObj) === filterMonthKey;
    };
    return allTxns.filter((t) => isInSelectedMonth(t.date)).slice(0, 8);
  }, [allTxns, filterMonthKey]);

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

      {/* Month Switcher */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-3 shadow-sm max-w-xs mx-auto">
        <button
          onClick={() => shiftMonth(-1)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{filterMonthLabel}</p>
          {!isCurrentMonth && (
            <button
              onClick={() => setFilterMonthKey(currentMonthKey)}
              className="text-[10px] text-primary font-semibold hover:underline mt-0.5"
            >
              Back to current month
            </button>
          )}
        </div>
        <button
          onClick={() => shiftMonth(1)}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Next month"
        >
          <ChevronRight size={16} />
        </button>
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
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
              }`}>
              <TrendingUp size={15} />
            </div>
          </div>
          <div>
            <p className={`text-2xl font-black font-[DM_Mono,monospace] ${stats.netProfit >= 0 ? "text-emerald-700" : "text-red-600"
              }`}>
              {fmt(stats.netProfit)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">Overall Sales − (Shop Expenses + Commitments + Salaries)</p>
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
                    className={`font-black font-[DM_Mono,monospace] text-right ${t.type === "income" ? "text-green-700" : "text-red-600"
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
