import { useState, useMemo } from "react";
import {
  Plus,
  X,
  ChevronDown,
  Banknote,
  Smartphone,
  Flame,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Trash2,
  ShoppingCart,
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
} from "recharts";
import type {
  ShopId,
  Transaction,
  Period,
  TransactionType,
  PaymentMethod,
  PurchaseCategory,
  PurchaseUnit,
} from "../types";
import {
  SHOPS,
  PERIOD_LABELS,
  EXPENSE_CATEGORIES,
  CATEGORY_COLORS,
  PURCHASE_ITEMS,
  ALL_ITEMS_FLAT,
} from "../constants";
import { fmt, fmtShort } from "../utils";

interface FinanceViewProps {
  shopId: ShopId;
  transactions: Transaction[];
  onAdd: (
    t: Transaction,
    targetShop: ShopId,
    purchasePayloads?: {
      itemName: string;
      category: any;
      quantity: number;
      unit: any;
      price: number;
      date: Date;
    }[]
  ) => void;
  onDelete: (id: string, type: TransactionType, targetShop: ShopId) => void;
}

export function FinanceView({ shopId, transactions, onAdd, onDelete }: FinanceViewProps) {
  const shop = SHOPS[shopId];
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<TransactionType>("income");
  const [formShop, setFormShop] = useState<ShopId>(shopId);
  const [formPayment, setFormPayment] = useState<PaymentMethod>("cash");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  // Date Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState(""); // YYYY-MM
  const [filterYear, setFilterYear] = useState(""); // YYYY

  // Dynamic Item/Purchase state
  const [formItem, setFormItem] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formUnit, setFormUnit] = useState<PurchaseUnit>("kg");
  const [formItemPrice, setFormItemPrice] = useState("");

  // Local cart state for multi-item bulk purchases
  const [cart, setCart] = useState<{
    itemName: string;
    category: string;
    quantity: number;
    unit: PurchaseUnit;
    price: number;
  }[]>([]);

  const catItems = PURCHASE_ITEMS[formCategory as PurchaseCategory] || [];
  const isInventoryCategory = !!PURCHASE_ITEMS[formCategory as PurchaseCategory];

  // Derived amount based on cart total for bulk purchases
  const derivedCartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price, 0);
  }, [cart]);

  function handleItemSelect(name: string) {
    const item = ALL_ITEMS_FLAT.find((i) => i.name === name);
    if (item) {
      setFormUnit(item.unit);
    }
    setFormItem(name);
  }

  function handleAddToCart() {
    if (!formItem || !formQty || !formItemPrice) return;
    const qty = parseFloat(formQty);
    const prc = parseFloat(formItemPrice);
    if (isNaN(qty) || qty <= 0 || isNaN(prc) || prc <= 0) return;

    setCart((prev) => [
      ...prev,
      {
        itemName: formItem,
        category: formCategory,
        quantity: qty,
        unit: formUnit,
        price: prc,
      },
    ]);
    setFormItem("");
    setFormQty("");
    setFormItemPrice("");
  }

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  // Filter logic: date, month, year
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const tDate = new Date(t.date);
      const year = tDate.getFullYear().toString();
      const monthKey = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, "0")}`;
      const dateStr = tDate.toISOString().split("T")[0];

      if (filterDate && dateStr !== filterDate) return false;
      if (filterMonth && monthKey !== filterMonth) return false;
      if (filterYear && year !== filterYear) return false;

      return true;
    });
  }, [transactions, filterDate, filterMonth, filterYear]);

  // Sales totals (gross income for each payment method)
  const salesTotals = useMemo(() => {
    let cash = 0;
    let gpay = 0;
    let zomato = 0;

    filtered.forEach((t) => {
      if (t.type === "income") {
        if (t.paymentMethod === "cash") cash += t.amount;
        else if (t.paymentMethod === "gpay") gpay += t.amount;
        else if (t.paymentMethod === "zomato") zomato += t.amount;
      }
    });

    return { cash, gpay, zomato, total: cash + gpay + zomato };
  }, [filtered]);

  // Combined calculations for cards
  const totalIncome = useMemo(
    () => filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [filtered]
  );
  const totalExpense = useMemo(
    () => filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [filtered]
  );
  const netBalance = totalIncome - totalExpense;

  // Shop specific totals
  // 1. Daily Sales (sales on currently selected date, or today if no filter)
  const dailySales = useMemo(() => {
    const target = filterDate || new Date().toISOString().split("T")[0];
    return transactions
      .filter((t) => t.type === "income" && t.date.toISOString().split("T")[0] === target)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions, filterDate]);

  // 2. Weekly Sales (sales in the past 7 days)
  const weeklySales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return transactions
      .filter((t) => t.type === "income" && t.date >= cutoff)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  // 3. Monthly Sales (sales in the current month)
  const monthlySales = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return transactions
      .filter((t) => t.type === "income" && t.date >= startOfMonth)
      .reduce((s, t) => s + t.amount, 0);
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += t.amount;
    });
    return Object.entries(map)
      .map(([cat, amt]) => ({ cat, amt }))
      .sort((a, b) => b.amt - a.amt)
      .slice(0, 8);
  }, [filtered]);

  const visibleTxns = useMemo(() => filtered.slice(0, 50), [filtered]);

  function addTransaction() {
    let amount = 0;
    let category = "";
    let description = "";
    let purchasePayloads = undefined;

    if (formType === "expense" && isInventoryCategory) {
      if (cart.length === 0) return;
      amount = derivedCartTotal;
      category = formCategory || "Miscellaneous";
      description = "Bulk Purchase: " + cart.map(i => `${i.itemName} (${i.quantity} ${i.unit})`).join(", ");
      purchasePayloads = cart.map(i => ({
        itemName: i.itemName,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        price: i.price,
        date: new Date(formDate),
      }));
    } else {
      if (!formAmount) return;
      amount = Math.abs(parseFloat(formAmount));
      category = formType === "income" ? "Full Day Income" : formCategory || "Miscellaneous";
      description = formType === "income" ? "Full Day Sales" : formDesc || "Shop Expense";
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: formType,
      paymentMethod: formPayment,
      amount,
      category,
      description,
      date: new Date(formDate),
    };

    onAdd(transaction, formShop, purchasePayloads);

    setFormAmount("");
    setFormCategory("");
    setFormDesc("");
    setFormItem("");
    setFormQty("");
    setFormItemPrice("");
    setCart([]);
    setFormDate(new Date().toISOString().split("T")[0]);
    setShowForm(false);
  }

  function clearFilters() {
    setFilterDate("");
    setFilterMonth("");
    setFilterYear("");
  }

  return (
    <div className="space-y-6">
      {/* Upper Filter Panel */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-emerald-700" />
            <h2 className="text-sm font-bold text-foreground">Sales & Income Journal Filters</h2>
          </div>
            <button
              onClick={() => {
                setFormType("income");
                setFormShop(shopId);
                setFormCategory("Full Day Income");
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all shadow-sm bg-emerald-700 cursor-pointer"
            >
              <Plus size={13} /> Add Entry
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Date Filter</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setFilterMonth("");
                setFilterYear("");
              }}
              className="w-full bg-input-background rounded-xl px-3 py-2 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Month Filter</label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setFilterDate("");
                setFilterYear("");
              }}
              className="w-full bg-input-background rounded-xl px-3 py-2 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Year Filter</label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setFilterDate("");
                setFilterMonth("");
              }}
              className="w-full bg-input-background rounded-xl px-3 py-2 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select Year...</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!filterDate && !filterMonth && !filterYear}
              className="w-full py-2 bg-muted text-muted-foreground border rounded-xl text-xs font-bold hover:bg-muted/85 disabled:opacity-40 transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Daily, Weekly, Monthly Shop Sales totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Daily Sales ({filterDate || "Today"})</p>
            <p className="text-xl font-black text-emerald-800 font-[DM_Mono,monospace]">
              {fmt(dailySales)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Weekly Sales (Past 7 Days)</p>
            <p className="text-xl font-black text-emerald-800 font-[DM_Mono,monospace]">
              {fmt(weeklySales)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Monthly Sales (Current Month)</p>
            <p className="text-xl font-black text-emerald-800 font-[DM_Mono,monospace]">
              {fmt(monthlySales)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Split row for standard payment analysis */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Branch Sales Payment Distribution
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Banknote size={14} className="text-amber-700" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">Cash Sales</span>
            </div>
            <p className="text-xl font-black font-[DM_Mono,monospace] text-amber-700">
              {fmt(salesTotals.cash)}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                <Smartphone size={14} className="text-sky-700" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">GPay Sales</span>
            </div>
            <p className="text-xl font-black font-[DM_Mono,monospace] text-sky-700">
              {fmt(salesTotals.gpay)}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <Flame size={14} className="text-orange-600" />
              </div>
              <span className="text-xs font-bold text-muted-foreground">Zomato Sales</span>
            </div>
            <p className="text-xl font-black font-[DM_Mono,monospace] text-orange-600">
              {fmt(salesTotals.zomato)}
            </p>
          </div>

          <div
            className="rounded-2xl p-5 border shadow-sm text-white flex flex-col justify-between"
            style={{ backgroundColor: shop.color }}
          >
            <span className="text-xs font-bold opacity-80">Total Shop Sales</span>
            <p className="text-xl font-black font-[DM_Mono,monospace] mt-2">
              {fmt(salesTotals.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Ledger list and analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold">Ledger Postings ({filtered.length} entries)</h2>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {visibleTxns.length === 0 && (
              <p className="text-center text-muted-foreground text-xs py-8">
                No entries match the filter parameters.
              </p>
            )}
            {visibleTxns.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 text-xs group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: (CATEGORY_COLORS[t.category] || "#94a3b8") + "18",
                    }}
                  >
                    {t.type === "income" ? "📈" : "📉"}
                  </div>
                  <div>
                    <p className="font-bold">{t.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{t.category}</span>
                      <span>·</span>
                      <span
                        className={`font-semibold ${
                          t.paymentMethod === "cash"
                            ? "text-amber-600"
                            : t.paymentMethod === "gpay"
                            ? "text-sky-600"
                            : "text-orange-600"
                        }`}
                      >
                        {t.paymentMethod.toUpperCase()}
                      </span>
                      <span>·</span>
                      <span>
                        {t.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`font-black font-[DM_Mono,monospace] ${
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
                        onDelete(t.id, t.type, shopId);
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-red-50 opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses and categories */}
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold">Postings by Category</h2>
          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground text-xs py-8">No records available</p>
            ) : (
              categoryBreakdown.map(({ cat, amt }) => {
                const max = categoryBreakdown[0]?.amt || 1;
                const color = CATEGORY_COLORS[cat] || "#94a3b8";
                return (
                  <div key={cat} className="flex items-center gap-2 text-xs">
                    <span className="font-semibold w-24 truncate">{cat}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round((amt / max) * 100)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className="font-bold font-[DM_Mono,monospace] text-muted-foreground w-12 text-right">
                      {fmtShort(amt)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  New Ledger Entry
                </h3>
                <p className="text-xs text-muted-foreground">
                  Register daily branch sales or global shared expenses
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setShowForm(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addTransaction();
              }}
              className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
            >
              {/* Entry Type Selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Entry Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("income");
                      setFormShop(shopId);
                      setFormCategory("Full Day Income");
                    }}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      formType === "income"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    📈 Income (Sales)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType("expense");
                      setFormCategory("");
                    }}
                    className={`flex-1 py-3.5 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                      formType === "expense"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    📉 Expense (Shared)
                  </button>
                </div>
              </div>
              {/* Shop Selection - Only for Income (Sales) */}
              {formType === "income" && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Shop Branch</label>
                  <div className="relative">
                    <select
                      value={formShop}
                      onChange={(e) => setFormShop(e.target.value as ShopId)}
                      className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-bold border border-border focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                    >
                      {(Object.keys(SHOPS) as ShopId[]).map((sid) => (
                        <option key={sid} value={sid}>
                          {SHOPS[sid].name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {/* Payment Method Selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPayment("cash")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border ${
                      formPayment === "cash"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPayment("gpay")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border ${
                      formPayment === "gpay"
                        ? "bg-sky-50 text-sky-700 border-sky-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Smartphone size={14} /> GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormPayment("zomato")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border ${
                      formPayment === "zomato"
                        ? "bg-orange-50 text-orange-600 border-orange-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Flame size={14} /> Zomato
                  </button>
                </div>
              </div>

              {/* Category selector for Expense first */}
              {formType === "expense" && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                  <div className="relative">
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        setFormItem("");
                        setFormQty("");
                        setFormItemPrice("");
                        setCart([]);
                      }}
                      className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                    >
                      <option value="">Select category…</option>
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                  </div>
                </div>
              )}

              {/* Amount Input - ONLY shown for Income or Non-Inventory Expenses */}
              {(formType === "income" || (formType === "expense" && !isInventoryCategory)) && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}

              {/* Non-Inventory Description */}
              {formType === "expense" && !isInventoryCategory && (
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop utility payment"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}

              {/* Multi-Item Purchase Builder Cart (shown for Inventory Expenses) */}
              {formType === "expense" && isInventoryCategory && (
                <>
                  <div className="border border-border/60 rounded-xl p-3 bg-muted/10 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Add Stock Item to Cart
                    </p>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Select Item</label>
                      <div className="relative">
                        <select
                          value={formItem}
                          onChange={(e) => handleItemSelect(e.target.value)}
                          className="w-full bg-input-background rounded-lg px-3 py-2 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                        >
                          <option value="">Select item…</option>
                          {catItems.map((i) => (
                            <option key={i.name} value={i.name}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Quantity</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={formQty}
                          onChange={(e) => setFormQty(e.target.value)}
                          className="w-full bg-input-background rounded-lg px-3 py-2 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Unit</label>
                        <div className="relative">
                          <select
                            value={formUnit}
                            onChange={(e) => setFormUnit(e.target.value as PurchaseUnit)}
                            className="w-full bg-input-background rounded-lg px-2 py-2 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring appearance-none"
                          >
                            {(["kg", "pcs", "packets", "liters", "dozen", "boxes"] as PurchaseUnit[]).map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={10}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground mb-1 block">Item Total Price (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formItemPrice}
                        onChange={(e) => setFormItemPrice(e.target.value)}
                        className="w-full bg-input-background rounded-lg px-3 py-2 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!formItem || !formQty || parseFloat(formQty) <= 0 || !formItemPrice || parseFloat(formItemPrice) <= 0}
                      className="w-full py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart size={13} /> Add Stock Item
                    </button>
                  </div>

                  {/* Cart List */}
                  {cart.length > 0 && (
                    <div className="border border-border rounded-xl overflow-hidden bg-muted/10 text-xs">
                      <div className="bg-muted/50 px-3 py-1.5 font-bold text-[10px] uppercase tracking-wider text-muted-foreground flex justify-between">
                        <span>Cart Invoice List ({cart.length})</span>
                        <span>Price</span>
                      </div>
                      <div className="divide-y divide-border max-h-36 overflow-y-auto">
                        {cart.map((item, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex-1 min-w-0 pr-2">
                              <p className="font-bold truncate text-foreground">{item.itemName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {item.quantity} {item.unit} @ ₹{fmt(Math.round((item.price / item.quantity) * 100) / 100)}/{item.unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-black font-[DM_Mono,monospace] text-amber-700">₹{fmt(item.price)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFromCart(idx)}
                                className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-red-50 transition-all"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Display computed bulk price total */}
                  {cart.length > 0 && (
                    <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-xl p-3 flex justify-between items-center text-emerald-950">
                      <span className="text-xs font-bold uppercase tracking-wider">Computed Invoice Total</span>
                      <span className="text-lg font-black font-[DM_Mono,monospace] text-emerald-800">
                        ₹{fmt(derivedCartTotal)}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Date Input */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={
                  formType === "expense" && isInventoryCategory
                    ? cart.length === 0
                    : !formAmount || parseFloat(formAmount) <= 0
                }
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white disabled:opacity-40 hover:opacity-90 transition-all"
                style={{ backgroundColor: formType === "income" ? SHOPS[formShop].color : "#d97706" }}
              >
                Save {formType === "income" ? "Sales Record" : "Expense Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
