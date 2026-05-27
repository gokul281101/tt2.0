import { useState, useMemo } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Plus, X, ChevronDown,
  Banknote, Smartphone, Store, ShoppingCart, LayoutDashboard,
  Package, Leaf, ChevronRight, Calendar, Hash, Weight,
  ClipboardList, CheckCircle2, AlertCircle, Pencil, Trash2, History,
  LogOut, Key,
} from "lucide-react";
import Login from "./components/Login";
import ChangePasswordModal from "./components/ChangePasswordModal";


// ─── Types ───────────────────────────────────────────────────────────────────
type TransactionType = "income" | "expense";
type PaymentMethod = "cash" | "gpay";
type ShopId = "shop1" | "shop2";
type Period = "7d" | "30d" | "90d" | "all";
type MainView = "finance" | "purchases" | "commitments";
type PurchaseCategory = "Fruits & Vegetables" | "Packaging & Plastics" | "Other Supplies";
type PurchaseUnit = "kg" | "pcs" | "packets" | "liters" | "dozen" | "boxes";

interface Transaction {
  id: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface Purchase {
  id: string;
  itemName: string;
  category: PurchaseCategory;
  quantity: number;
  unit: PurchaseUnit;
  pricePerUnit: number;
  totalPrice: number;
  date: Date;
}

interface Commitment {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  dueDay: number;
  color: string;
}

interface CommitmentPayment {
  id: string;
  commitmentId: string;
  monthKey: string;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paidDate: Date;
  note: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const SHOPS: Record<ShopId, { name: string; color: string; emoji: string }> = {
  shop1: { name: "Shop 1 — Koramangala", color: "#1a7a3c", emoji: "🥤" },
  shop2: { name: "Shop 2 — Indiranagar", color: "#0ea5e9", emoji: "🍹" },
};

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 Days", "30d": "Last 30 Days", "90d": "Last 90 Days", all: "All Time",
};

const PURCHASE_ITEMS: Record<PurchaseCategory, { name: string; unit: PurchaseUnit; basePrice: number }[]> = {
  "Fruits & Vegetables": [
    { name: "Watermelon", unit: "kg", basePrice: 18 },
    { name: "Mango", unit: "kg", basePrice: 90 },
    { name: "Orange", unit: "kg", basePrice: 55 },
    { name: "Carrot", unit: "kg", basePrice: 35 },
    { name: "Ginger", unit: "kg", basePrice: 120 },
    { name: "Lemon", unit: "kg", basePrice: 80 },
    { name: "Pineapple", unit: "kg", basePrice: 45 },
    { name: "Spinach", unit: "kg", basePrice: 30 },
    { name: "Beetroot", unit: "kg", basePrice: 40 },
    { name: "Cucumber", unit: "kg", basePrice: 25 },
    { name: "Coconut", unit: "pcs", basePrice: 30 },
    { name: "Mint", unit: "kg", basePrice: 60 },
  ],
  "Packaging & Plastics": [
    { name: "Plastic Cups 250ml", unit: "packets", basePrice: 120 },
    { name: "Plastic Cups 500ml", unit: "packets", basePrice: 160 },
    { name: "Paper Straws", unit: "packets", basePrice: 90 },
    { name: "Eco Bottles", unit: "pcs", basePrice: 8 },
    { name: "Carry Bags", unit: "packets", basePrice: 70 },
    { name: "Tissue Paper", unit: "packets", basePrice: 45 },
    { name: "Sealing Rolls", unit: "pcs", basePrice: 200 },
  ],
  "Other Supplies": [
    { name: "Sugar", unit: "kg", basePrice: 42 },
    { name: "Black Salt", unit: "kg", basePrice: 65 },
    { name: "Honey", unit: "kg", basePrice: 350 },
    { name: "Ice", unit: "kg", basePrice: 10 },
    { name: "Protein Powder", unit: "kg", basePrice: 900 },
  ],
};

const ALL_ITEMS_FLAT = Object.entries(PURCHASE_ITEMS).flatMap(([cat, items]) =>
  items.map((i) => ({ ...i, category: cat as PurchaseCategory }))
);

const CATEGORY_ICONS: Record<PurchaseCategory, typeof Leaf> = {
  "Fruits & Vegetables": Leaf,
  "Packaging & Plastics": Package,
  "Other Supplies": ShoppingCart,
};

const CATEGORY_COLORS_BG: Record<PurchaseCategory, string> = {
  "Fruits & Vegetables": "#dcfce7",
  "Packaging & Plastics": "#dbeafe",
  "Other Supplies": "#fef3c7",
};
const CATEGORY_COLORS_TEXT: Record<PurchaseCategory, string> = {
  "Fruits & Vegetables": "#166534",
  "Packaging & Plastics": "#1e40af",
  "Other Supplies": "#92400e",
};

const INCOME_CATEGORIES = ["Fresh Juices", "Smoothies", "Shots & Boosters", "Combo Meals", "Catering", "Online Orders"];
const EXPENSE_CATEGORIES = ["Fruits & Produce", "Equipment", "Rent", "Utilities", "Staff Wages", "Packaging", "Marketing", "Miscellaneous"];

const CATEGORY_COLORS: Record<string, string> = {
  "Fresh Juices": "#1a7a3c", Smoothies: "#34d399", "Shots & Boosters": "#a3e635",
  "Combo Meals": "#fbbf24", Catering: "#f97316", "Online Orders": "#60a5fa",
  "Fruits & Produce": "#ef4444", Equipment: "#8b5cf6", Rent: "#ec4899",
  Utilities: "#f59e0b", "Staff Wages": "#0ea5e9", Packaging: "#14b8a6",
  Marketing: "#e879f9", Miscellaneous: "#94a3b8",
};

// ─── Seed Data Generators ─────────────────────────────────────────────────────
function generateTransactions(shopId: ShopId): Transaction[] {
  const txns: Transaction[] = [];
  const now = new Date();
  const incomeTemplates = [
    { category: "Fresh Juices", descriptions: ["Watermelon juice sale", "Orange blend batch", "Carrot-ginger juice", "Green detox bundle"] },
    { category: "Smoothies", descriptions: ["Mango-pineapple smoothie", "Berry blast smoothie", "Tropical sunrise mix"] },
    { category: "Shots & Boosters", descriptions: ["Wheatgrass shots ×10", "Ginger immunity shot", "Turmeric booster pack"] },
    { category: "Combo Meals", descriptions: ["Juice + snack combo", "Family fruit box", "Office combo order"] },
    { category: "Catering", descriptions: ["Office party catering", "Wedding juice bar"] },
    { category: "Online Orders", descriptions: ["Zomato order batch", "Swiggy delivery batch"] },
  ];
  const expenseTemplates = [
    { category: "Rent", descriptions: ["Monthly shop rent"] },
    { category: "Utilities", descriptions: ["Electricity bill", "Water bill"] },
    { category: "Staff Wages", descriptions: ["Part-time staff pay", "Delivery staff wages"] },
    { category: "Marketing", descriptions: ["Instagram ad boost", "Menu printing"] },
  ];
  const seed = shopId === "shop1" ? 1 : 7;
  let id = shopId === "shop1" ? 1000 : 5000;
  for (let d = 90; d >= 0; d--) {
    const date = new Date(now); date.setDate(now.getDate() - d);
    const ic = Math.floor(((d * seed * 13) % 4)) + 2;
    for (let i = 0; i < ic; i++) {
      const tmpl = incomeTemplates[(d * seed + i * 3) % incomeTemplates.length];
      const desc = tmpl.descriptions[(d + i * seed) % tmpl.descriptions.length];
      const amount = (((d * seed + i * 17) % 38) + 4) * 100;
      const txDate = new Date(date); txDate.setHours(((d + i * seed) % 12) + 8);
      const paymentMethod: PaymentMethod = (d + i + seed) % 3 === 0 ? "gpay" : "cash";
      txns.push({ id: String(id++), type: "income", paymentMethod, amount, category: tmpl.category, description: desc, date: txDate });
    }
    const ec = Math.floor(((d * seed * 7) % 2)) + 1;
    for (let i = 0; i < ec; i++) {
      const tmpl = expenseTemplates[(d * seed + i * 5) % expenseTemplates.length];
      const desc = tmpl.descriptions[(d + i) % tmpl.descriptions.length];
      const amount = (((d * seed + i * 11) % 22) + 2) * 100;
      const txDate = new Date(date); txDate.setHours(((d + i * seed * 2) % 12) + 8);
      const paymentMethod: PaymentMethod = (d + i * seed) % 4 === 0 ? "gpay" : "cash";
      txns.push({ id: String(id++), type: "expense", paymentMethod, amount, category: tmpl.category, description: desc, date: txDate });
    }
  }
  return txns.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function generatePurchases(shopId: ShopId): Purchase[] {
  const purchases: Purchase[] = [];
  const now = new Date();
  const seed = shopId === "shop1" ? 3 : 11;
  let id = shopId === "shop1" ? 9000 : 19000;

  for (let d = 90; d >= 0; d--) {
    const date = new Date(now); date.setDate(now.getDate() - d);
    const count = Math.floor(((d * seed * 5) % 4)) + 1;
    for (let i = 0; i < count; i++) {
      const item = ALL_ITEMS_FLAT[(d * seed + i * 7) % ALL_ITEMS_FLAT.length];
      const qty = parseFloat((((d * seed + i * 13) % 20) + 1).toFixed(1));
      const ppu = item.basePrice * (1 + ((d + i * seed) % 20 - 10) / 100);
      const txDate = new Date(date); txDate.setHours(((d + i * seed) % 10) + 7);
      purchases.push({
        id: String(id++),
        itemName: item.name,
        category: item.category,
        quantity: qty,
        unit: item.unit,
        pricePerUnit: Math.round(ppu * 10) / 10,
        totalPrice: Math.round(qty * ppu),
        date: txDate,
      });
    }
  }
  return purchases.sort((a, b) => b.date.getTime() - a.date.getTime());
}

const INITIAL_TRANSACTIONS: Record<ShopId, Transaction[]> = {
  shop1: generateTransactions("shop1"),
  shop2: generateTransactions("shop2"),
};
const INITIAL_PURCHASES: Record<ShopId, Purchase[]> = {
  shop1: generatePurchases("shop1"),
  shop2: generatePurchases("shop2"),
};

// ─── Commitment Seed Data ─────────────────────────────────────────────────────
const INITIAL_COMMITMENTS: Record<ShopId, Commitment[]> = {
  shop1: [
    { id: "c1", name: "Shop Rent", emoji: "🏪", amount: 25000, dueDay: 1, color: "#7c3aed" },
    { id: "c2", name: "EB Bill", emoji: "⚡", amount: 3500, dueDay: 10, color: "#f59e0b" },
    { id: "c3", name: "Staff Salary", emoji: "👨‍💼", amount: 18000, dueDay: 1, color: "#0ea5e9" },
    { id: "c4", name: "Chit Amount", emoji: "📋", amount: 5000, dueDay: 5, color: "#10b981" },
    { id: "c5", name: "Water Bill", emoji: "💧", amount: 600, dueDay: 15, color: "#06b6d4" },
    { id: "c6", name: "Internet Bill", emoji: "📶", amount: 999, dueDay: 20, color: "#6366f1" },
  ],
  shop2: [
    { id: "d1", name: "Shop Rent", emoji: "🏪", amount: 30000, dueDay: 1, color: "#7c3aed" },
    { id: "d2", name: "EB Bill", emoji: "⚡", amount: 4200, dueDay: 10, color: "#f59e0b" },
    { id: "d3", name: "Staff Salary", emoji: "👨‍💼", amount: 20000, dueDay: 1, color: "#0ea5e9" },
    { id: "d4", name: "Chit Amount", emoji: "📋", amount: 5000, dueDay: 5, color: "#10b981" },
    { id: "d5", name: "Water Bill", emoji: "💧", amount: 600, dueDay: 15, color: "#06b6d4" },
    { id: "d6", name: "Internet Bill", emoji: "📶", amount: 999, dueDay: 20, color: "#6366f1" },
    { id: "d7", name: "LPG / Gas", emoji: "🔥", amount: 1800, dueDay: 12, color: "#ef4444" },
  ],
};

function generateCommitmentPayments(shopId: ShopId, commitments: Commitment[]): CommitmentPayment[] {
  const payments: CommitmentPayment[] = [];
  const now = new Date();
  let id = shopId === "shop1" ? 80000 : 90000;

  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isCurrent = m === 0;

    commitments.forEach((c, ci) => {
      const skipPayment = isCurrent && (ci === 1 || ci === 4);
      if (skipPayment) return;

      const paidDay = c.dueDay + Math.floor((ci * 3) % 5);
      const paidDate = new Date(d.getFullYear(), d.getMonth(), Math.min(paidDay, 28));
      const variation = 1 + ((ci * m * 7) % 10 - 5) / 100;
      const paidAmount = Math.round(c.amount * variation);
      const pm: PaymentMethod = (ci + m) % 3 === 0 ? "gpay" : "cash";

      payments.push({
        id: String(id++),
        commitmentId: c.id,
        monthKey: mk,
        paidAmount,
        paymentMethod: pm,
        paidDate,
        note: "",
      });
    });
  }
  return payments;
}

const INITIAL_COMMITMENT_PAYMENTS: Record<ShopId, CommitmentPayment[]> = {
  shop1: generateCommitmentPayments("shop1", INITIAL_COMMITMENTS.shop1),
  shop2: generateCommitmentPayments("shop2", INITIAL_COMMITMENTS.shop2),
};

function mkFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function mkLabel(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 }); }
function fmtShort(n: number) {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n;
}
function monthKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}`; }

// ─── Item Detail Modal ────────────────────────────────────────────────────────
function ItemDetailModal({
  itemName, purchases, onClose,
}: { itemName: string; purchases: Purchase[]; onClose: () => void }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));

  const months = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => set.add(monthKey(p.date)));
    return Array.from(set).sort((a, b) => b.localeCompare(a)).slice(0, 6);
  }, [purchases]);

  const monthLabel = (mk: string) => {
    const [y, m] = mk.split("-").map(Number);
    return new Date(y, m, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  };

  const filtered = useMemo(
    () => purchases.filter((p) => monthKey(p.date) === selectedMonth),
    [purchases, selectedMonth]
  );

  const totalQty = filtered.reduce((s, p) => s + p.quantity, 0);
  const totalSpent = filtered.reduce((s, p) => s + p.totalPrice, 0);
  const unit = filtered[0]?.unit ?? "";
  const item = ALL_ITEMS_FLAT.find((i) => i.name === itemName);
  const CatIcon = item ? CATEGORY_ICONS[item.category] : Package;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <CatIcon size={18} className="text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-bold">{itemName}</h3>
              <p className="text-xs text-muted-foreground">{item?.category}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Month selector */}
        <div className="px-5 pt-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {months.map((mk) => (
              <button
                key={mk}
                onClick={() => setSelectedMonth(mk)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  selectedMonth === mk
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:border-border"
                }`}
              >
                {monthLabel(mk)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-5 pt-4 grid grid-cols-3 gap-3 flex-shrink-0">
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Hash size={12} /><span className="text-xs font-semibold">Times Bought</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground">{filtered.length}</p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Weight size={12} /><span className="text-xs font-semibold">Total Qty</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground">
              {totalQty % 1 === 0 ? totalQty : totalQty.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Wallet size={12} /><span className="text-xs font-semibold">Total Spent</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-primary">{fmtShort(totalSpent)}</p>
            <p className="text-xs text-muted-foreground">{fmt(totalSpent)}</p>
          </div>
        </div>

        {/* Purchase history */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">No purchases in {monthLabel(selectedMonth)}.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Purchase History</p>
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-1 text-muted-foreground w-20 flex-shrink-0">
                    <Calendar size={11} />
                    <span className="text-xs">{p.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <div className="flex-1 text-xs text-foreground font-medium font-[DM_Mono,monospace]">
                    {p.quantity % 1 === 0 ? p.quantity : p.quantity.toFixed(1)} {p.unit}
                  </div>
                  <div className="text-xs text-muted-foreground font-[DM_Mono,monospace]">
                    ₹{p.pricePerUnit}/{p.unit}
                  </div>
                  <div className="text-xs font-bold text-primary font-[DM_Mono,monospace] w-16 text-right">
                    {fmt(p.totalPrice)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Purchases View ────────────────────────────────────────────────────────────
function PurchasesView({
  shopId, purchases, onAdd,
}: {
  shopId: ShopId;
  purchases: Purchase[];
  onAdd: (p: Purchase) => void;
}) {
  const shop = SHOPS[shopId];

  // Form state
  const [formItem, setFormItem] = useState("");
  const [formCat, setFormCat] = useState<PurchaseCategory>("Fruits & Vegetables");
  const [formQty, setFormQty] = useState("");
  const [formUnit, setFormUnit] = useState<PurchaseUnit>("kg");
  const [formPpu, setFormPpu] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [customItem, setCustomItem] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const now = new Date();
  const currentMonthKey = monthKey(now);

  // Group purchases by item for the current month summary
  const itemSummary = useMemo(() => {
    const map: Record<string, { count: number; totalQty: number; totalPrice: number; unit: string; category: PurchaseCategory; allPurchases: Purchase[] }> = {};
    purchases.forEach((p) => {
      if (!map[p.itemName]) map[p.itemName] = { count: 0, totalQty: 0, totalPrice: 0, unit: p.unit, category: p.category, allPurchases: [] };
      map[p.itemName].allPurchases.push(p);
      if (monthKey(p.date) === currentMonthKey) {
        map[p.itemName].count += 1;
        map[p.itemName].totalQty += p.quantity;
        map[p.itemName].totalPrice += p.totalPrice;
      }
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.totalPrice - a.totalPrice);
  }, [purchases, currentMonthKey]);

  const byCategory = useMemo(() => {
    const cats: Record<PurchaseCategory, typeof itemSummary> = {
      "Fruits & Vegetables": [],
      "Packaging & Plastics": [],
      "Other Supplies": [],
    };
    itemSummary.forEach((item) => {
      cats[item.category].push(item);
    });
    return cats;
  }, [itemSummary]);

  const thisMonthTotal = useMemo(
    () => purchases.filter((p) => monthKey(p.date) === currentMonthKey).reduce((s, p) => s + p.totalPrice, 0),
    [purchases, currentMonthKey]
  );

  const catItems = PURCHASE_ITEMS[formCat];

  function handleItemSelect(name: string) {
    const item = ALL_ITEMS_FLAT.find((i) => i.name === name);
    if (item) {
      setFormUnit(item.unit);
      setFormPpu(String(item.basePrice));
    }
    setFormItem(name);
  }

  function handleCatChange(cat: PurchaseCategory) {
    setFormCat(cat);
    setFormItem("");
    setFormPpu("");
    setCustomItem(false);
  }

  function submit() {
    if (!formItem || !formQty || !formPpu) return;
    const qty = parseFloat(formQty);
    const ppu = parseFloat(formPpu);
    onAdd({
      id: Date.now().toString(),
      itemName: formItem,
      category: formCat,
      quantity: qty,
      unit: formUnit,
      pricePerUnit: ppu,
      totalPrice: Math.round(qty * ppu),
      date: new Date(formDate),
    });
    setFormItem(""); setFormQty(""); setFormPpu("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setCustomItem(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT: Add Purchase Form */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sticky top-4">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: shop.color + "20" }}>
              <Plus size={14} style={{ color: shop.color }} />
            </div>
            <h2 className="text-sm font-bold">Add Purchase</h2>
          </div>

          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Category</label>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCatChange(cat)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left ${
                        formCat === cat
                          ? "border-current"
                          : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      style={formCat === cat ? { color: CATEGORY_COLORS_TEXT[cat], backgroundColor: CATEGORY_COLORS_BG[cat], borderColor: CATEGORY_COLORS_TEXT[cat] + "40" } : {}}
                    >
                      <Icon size={13} /> {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground">Item</label>
                <button
                  onClick={() => { setCustomItem(!customItem); setFormItem(""); }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {customItem ? "Pick from list" : "+ Custom item"}
                </button>
              </div>
              {customItem ? (
                <input
                  type="text" placeholder="e.g. Dragon Fruit" value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <div className="relative">
                  <select
                    value={formItem} onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="">Select item…</option>
                    {catItems.map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              )}
            </div>

            {/* Qty + Unit */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Quantity</label>
                <input
                  type="number" placeholder="0" value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="w-24">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit</label>
                <div className="relative">
                  <select
                    value={formUnit} onChange={(e) => setFormUnit(e.target.value as PurchaseUnit)}
                    className="w-full bg-input-background rounded-xl px-2 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    {(["kg", "pcs", "packets", "liters", "dozen", "boxes"] as PurchaseUnit[]).map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Price per unit */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Price per {formUnit || "unit"} (₹)</label>
              <input
                type="number" placeholder="0.00" value={formPpu}
                onChange={(e) => setFormPpu(e.target.value)}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {formQty && formPpu && (
                <p className="text-xs text-primary font-semibold mt-1.5 font-[DM_Mono,monospace]">
                  Total: {fmt(Math.round(parseFloat(formQty) * parseFloat(formPpu)))}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date</label>
              <input
                type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              onClick={submit}
              disabled={!formItem || !formQty || !formPpu}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: shop.color }}
            >
              Save Purchase
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Item List */}
      <div className="flex-1 space-y-5">
        {/* This month total */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} — Total Spend
            </p>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground mt-1">{fmt(thisMonthTotal)}</p>
          </div>
          <div className="text-3xl">{shop.emoji}</div>
        </div>

        {/* By category */}
        {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const items = byCategory[cat];
          if (items.length === 0) return null;
          const catTotal = items.reduce((s, i) => s + i.totalPrice, 0);
          return (
            <div key={cat} className="bg-card rounded-2xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: CATEGORY_COLORS_BG[cat] }}>
                    <Icon size={14} style={{ color: CATEGORY_COLORS_TEXT[cat] }} />
                  </div>
                  <h3 className="text-sm font-bold">{cat}</h3>
                </div>
                <span className="text-xs font-bold font-[DM_Mono,monospace] text-muted-foreground">
                  {fmt(catTotal)} this month
                </span>
              </div>

              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedItem(item.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/70 transition-colors text-left group border border-transparent hover:border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {item.count > 0 ? (
                          <>
                            <span className="text-xs text-muted-foreground">
                              <span className="font-[DM_Mono,monospace] font-semibold text-foreground">{item.count}×</span> this month
                            </span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground">
                              <span className="font-[DM_Mono,monospace] font-semibold text-foreground">
                                {item.totalQty % 1 === 0 ? item.totalQty : item.totalQty.toFixed(1)} {item.unit}
                              </span>
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">No purchases this month</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.count > 0 && (
                        <p className="text-sm font-bold font-[DM_Mono,monospace] text-primary">{fmt(item.totalPrice)}</p>
                      )}
                      <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors ml-auto mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          itemName={selectedItem}
          purchases={purchases.filter((p) => p.itemName === selectedItem)}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

// ─── Commitments View ────────────────────────────────────────────────────────
function CommitmentsView({
  shopId,
  commitments,
  payments,
  onAddCommitment,
  onDeleteCommitment,
  onMarkPaid,
}: {
  shopId: ShopId;
  commitments: Commitment[];
  payments: CommitmentPayment[];
  onAddCommitment: (c: Commitment) => void;
  onDeleteCommitment: (id: string) => void;
  onMarkPaid: (p: CommitmentPayment) => void;
}) {
  const shop = SHOPS[shopId];
  const now = new Date();
  const currentMk = mkFromDate(now);

  // available months (last 6)
  const months = useMemo(() => {
    const list: string[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push(mkFromDate(d));
    }
    return list;
  }, []);

  const [selectedMk, setSelectedMk] = useState(currentMk);
  const [showAddForm, setShowAddForm] = useState(false);
  const [payModal, setPayModal] = useState<Commitment | null>(null);
  const [historyModal, setHistoryModal] = useState<Commitment | null>(null);

  // Add commitment form
  const [fName, setFName] = useState("");
  const [fEmoji, setFEmoji] = useState("🏪");
  const [fAmount, setFAmount] = useState("");
  const [fDueDay, setFDueDay] = useState("1");

  // Mark paid form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState(now.toISOString().split("T")[0]);

  const EMOJI_OPTIONS = ["🏪", "⚡", "👨‍💼", "📋", "💧", "📶", "🔥", "🛡️", "🏦", "🚗", "📦", "🔧"];

  const paymentsInMonth = useMemo(
    () => payments.filter((p) => p.monthKey === selectedMk),
    [payments, selectedMk]
  );

  const paidIds = useMemo(() => new Set(paymentsInMonth.map((p) => p.commitmentId)), [paymentsInMonth]);

  const totalCommitted = commitments.reduce((s, c) => s + c.amount, 0);
  const totalPaid = paymentsInMonth.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = commitments
    .filter((c) => !paidIds.has(c.id))
    .reduce((s, c) => s + c.amount, 0);

  function submitAdd() {
    if (!fName || !fAmount) return;
    const colors = ["#7c3aed", "#f59e0b", "#0ea5e9", "#10b981", "#06b6d4", "#6366f1", "#ef4444", "#ec4899"];
    onAddCommitment({
      id: Date.now().toString(),
      name: fName,
      emoji: fEmoji,
      amount: parseFloat(fAmount),
      dueDay: parseInt(fDueDay),
      color: colors[commitments.length % colors.length],
    });
    setFName(""); setFAmount(""); setFDueDay("1"); setFEmoji("🏪");
    setShowAddForm(false);
  }

  function submitPay() {
    if (!payModal || !payAmount) return;
    onMarkPaid({
      id: Date.now().toString(),
      commitmentId: payModal.id,
      monthKey: selectedMk,
      paidAmount: parseFloat(payAmount),
      paymentMethod: payMethod,
      paidDate: new Date(payDate),
      note: payNote,
    });
    setPayAmount(""); setPayNote(""); setPayDate(now.toISOString().split("T")[0]);
    setPayModal(null);
  }

  const historyPayments = useMemo(
    () => historyModal ? payments.filter((p) => p.commitmentId === historyModal.id).sort((a, b) => b.paidDate.getTime() - a.paidDate.getTime()) : [],
    [payments, historyModal]
  );

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Month:</span>
          {months.map((mk) => (
            <button key={mk} onClick={() => setSelectedMk(mk)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${selectedMk === mk ? "text-white border-transparent" : "bg-card text-foreground border-border"}`}
              style={selectedMk === mk ? { backgroundColor: shop.color } : {}}
            >{mkLabel(mk)}</button>
          ))}
        </div>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: shop.color }}
        ><Plus size={15} /> Add Commitment</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Total Committed</p>
          <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground">{fmt(totalCommitted)}</p>
          <p className="text-xs text-muted-foreground mt-1">{commitments.length} items</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-green-600" />
            <p className="text-xs font-semibold text-muted-foreground">Paid</p>
          </div>
          <p className="text-2xl font-bold font-[DM_Mono,monospace] text-green-600">{fmt(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-1">{paidIds.size} of {commitments.length} done</p>
        </div>
        <div className="rounded-2xl p-5 border shadow-sm" style={{ backgroundColor: totalPending > 0 ? "#fef2f2" : "#f0fdf4", borderColor: totalPending > 0 ? "#fecaca" : "#bbf7d0" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} style={{ color: totalPending > 0 ? "#dc2626" : "#16a34a" }} />
            <p className="text-xs font-semibold text-muted-foreground">Pending</p>
          </div>
          <p className="text-2xl font-bold font-[DM_Mono,monospace]" style={{ color: totalPending > 0 ? "#dc2626" : "#16a34a" }}>{fmt(totalPending)}</p>
          <p className="text-xs text-muted-foreground mt-1">{commitments.length - paidIds.size} items remaining</p>
        </div>
      </div>

      {/* Commitment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {commitments.map((c) => {
          const isPaid = paidIds.has(c.id);
          const pmt = paymentsInMonth.find((p) => p.commitmentId === c.id);
          const isDue = !isPaid && now.getDate() >= c.dueDay && selectedMk === currentMk;

          return (
            <div key={c.id}
              className={`bg-card rounded-2xl border shadow-sm p-5 flex flex-col gap-4 transition-all ${isPaid ? "border-green-200" : isDue ? "border-red-200" : "border-border"}`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: c.color + "18" }}>
                    {c.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Due: {c.dueDay}{["st","nd","rd"][((c.dueDay % 10) - 1)] || "th"} of month</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setHistoryModal(c)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <History size={13} />
                  </button>
                  <button onClick={() => onDeleteCommitment(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Expected</p>
                  <p className="text-xl font-bold font-[DM_Mono,monospace]" style={{ color: c.color }}>
                    {fmt(c.amount)}
                  </p>
                </div>
                {isPaid && pmt && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="text-sm font-bold font-[DM_Mono,monospace] text-green-600">{fmt(pmt.paidAmount)}</p>
                  </div>
                )}
              </div>

              {/* Status / action */}
              {isPaid && pmt ? (
                <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-semibold">Paid on {pmt.paidDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${pmt.paymentMethod === "cash" ? "text-amber-600" : "text-sky-600"}`}>
                    {pmt.paymentMethod === "cash" ? <Banknote size={11} /> : <Smartphone size={11} />}
                    {pmt.paymentMethod === "cash" ? "Cash" : "GPay"}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => { setPayModal(c); setPayAmount(String(c.amount)); }}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${
                    isDue
                      ? "bg-red-50 text-destructive border-red-200 hover:bg-red-100"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  }`}
                >
                  {isDue ? "⚠️ Overdue — Mark as Paid" : "Mark as Paid"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {commitments.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No commitments yet.</p>
          <p className="text-xs mt-1">Add recurring monthly expenses like rent, EB bill, salary.</p>
        </div>
      )}

      {/* Add Commitment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">New Monthly Commitment</h3>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button key={e} onClick={() => setFEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-lg transition-all border ${fEmoji === e ? "border-primary bg-primary/10" : "border-border bg-muted"}`}
                    >{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Name</label>
                <input type="text" placeholder="e.g. Shop Rent" value={fName} onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount (₹)</label>
                  <input type="number" placeholder="0" value={fAmount} onChange={(e) => setFAmount(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="w-28">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Due Day</label>
                  <input type="number" min="1" max="31" value={fDueDay} onChange={(e) => setFDueDay(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <button onClick={submitAdd} disabled={!fName || !fAmount}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: shop.color }}>Save Commitment</button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold">Mark as Paid</h3>
                <p className="text-xs text-muted-foreground">{payModal.emoji} {payModal.name} · {mkLabel(selectedMk)}</p>
              </div>
              <button onClick={() => setPayModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button onClick={() => setPayMethod("cash")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border ${payMethod === "cash" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-muted text-muted-foreground border-transparent"}`}><Banknote size={15} /> Hand Cash</button>
                  <button onClick={() => setPayMethod("gpay")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border ${payMethod === "gpay" ? "bg-sky-50 text-sky-700 border-sky-300" : "bg-muted text-muted-foreground border-transparent"}`}><Smartphone size={15} /> GPay</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount Paid (₹)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                {payAmount && parseFloat(payAmount) !== payModal.amount && (
                  <p className="text-xs mt-1" style={{ color: parseFloat(payAmount) > payModal.amount ? "#16a34a" : "#dc2626" }}>
                    Expected: {fmt(payModal.amount)} ({parseFloat(payAmount) > payModal.amount ? "+" : ""}{fmt(parseFloat(payAmount) - payModal.amount)})
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date Paid</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Note (optional)</label>
                <input type="text" placeholder="e.g. Paid via NEFT" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={submitPay} disabled={!payAmount}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: shop.color }}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-base font-bold">{historyModal.emoji} {historyModal.name}</h3>
                <p className="text-xs text-muted-foreground">Payment history</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {historyPayments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No payment history.</p>
              ) : (
                historyPayments.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-1 text-muted-foreground w-24 flex-shrink-0">
                      <Calendar size={11} />
                      <span className="text-xs">{mkLabel(p.monthKey)}</span>
                    </div>
                    <div className="flex-1">
                      <span className={`text-xs font-semibold flex items-center gap-1 ${p.paymentMethod === "cash" ? "text-amber-600" : "text-sky-600"}`}>
                        {p.paymentMethod === "cash" ? <Banknote size={10} /> : <Smartphone size={10} />}
                        {p.paymentMethod === "cash" ? "Cash" : "GPay"}
                      </span>
                      {p.note && <p className="text-xs text-muted-foreground mt-0.5">{p.note}</p>}
                    </div>
                    <span className="text-sm font-bold font-[DM_Mono,monospace] text-green-600">{fmt(p.paidAmount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Finance View ─────────────────────────────────────────────────────────────
function FinanceView({
  shopId, transactions, onAdd,
}: { shopId: ShopId; transactions: Transaction[]; onAdd: (t: Transaction) => void }) {
  const shop = SHOPS[shopId];
  const [period, setPeriod] = useState<Period>("30d");
  const [particularDate, setParticularDate] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<TransactionType>("income");
  const [formPayment, setFormPayment] = useState<PaymentMethod>("cash");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");

  const cutoff = useMemo(() => {
    const now = new Date();
    if (period === "7d") { const d = new Date(now); d.setDate(now.getDate() - 7); return d; }
    if (period === "30d") { const d = new Date(now); d.setDate(now.getDate() - 30); return d; }
    if (period === "90d") { const d = new Date(now); d.setDate(now.getDate() - 90); return d; }
    return new Date(0);
  }, [period]);

  const filtered = useMemo(() => {
    if (particularDate) {
      const targetDateStr = new Date(particularDate).toDateString();
      return transactions.filter((t) => t.date.toDateString() === targetDateStr);
    }
    return transactions.filter((t) => t.date >= cutoff);
  }, [transactions, cutoff, particularDate]);

  const totalIncome = useMemo(() => filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance = totalIncome - totalExpense;
  const cashIncome = useMemo(() => filtered.filter((t) => t.type === "income" && t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0), [filtered]);
  const cashExpense = useMemo(() => filtered.filter((t) => t.type === "expense" && t.paymentMethod === "cash").reduce((s, t) => s + t.amount, 0), [filtered]);
  const gpayIncome = useMemo(() => filtered.filter((t) => t.type === "income" && t.paymentMethod === "gpay").reduce((s, t) => s + t.amount, 0), [filtered]);
  const gpayExpense = useMemo(() => filtered.filter((t) => t.type === "expense" && t.paymentMethod === "gpay").reduce((s, t) => s + t.amount, 0), [filtered]);
  const cashBalance = cashIncome - cashExpense;
  const gpayBalance = gpayIncome - gpayExpense;

  const chartData = useMemo(() => {
    if (particularDate) {
      // Group by hours of the day
      const slots = [
        { label: "Morning (8a-12p)", income: 0, expense: 0 },
        { label: "Afternoon (12p-4p)", income: 0, expense: 0 },
        { label: "Evening (4p-8p)", income: 0, expense: 0 },
        { label: "Night (8p-12a)", income: 0, expense: 0 },
      ];
      filtered.forEach((t) => {
        const hour = t.date.getHours();
        if (hour >= 8 && hour < 12) {
          if (t.type === "income") slots[0].income += t.amount; else slots[0].expense += t.amount;
        } else if (hour >= 12 && hour < 16) {
          if (t.type === "income") slots[1].income += t.amount; else slots[1].expense += t.amount;
        } else if (hour >= 16 && hour < 20) {
          if (t.type === "income") slots[2].income += t.amount; else slots[2].expense += t.amount;
        } else {
          if (t.type === "income") slots[3].income += t.amount; else slots[3].expense += t.amount;
        }
      });
      return slots;
    }

    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const map: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      map[key] = { income: 0, expense: 0 };
    }
    filtered.forEach((t) => {
      const key = t.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      if (map[key]) { if (t.type === "income") map[key].income += t.amount; else map[key].expense += t.amount; }
    });
    const entries = Object.entries(map).map(([label, v]) => ({ label, ...v }));
    if (period === "90d") {
      const grouped: Record<string, { income: number; expense: number }> = {};
      entries.forEach((e, i) => { const w = `Wk ${Math.floor(i / 7) + 1}`; if (!grouped[w]) grouped[w] = { income: 0, expense: 0 }; grouped[w].income += e.income; grouped[w].expense += e.expense; });
      return Object.entries(grouped).map(([label, v]) => ({ label, ...v }));
    }
    return entries;
  }, [filtered, period, particularDate]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((t) => { if (!map[t.category]) map[t.category] = 0; map[t.category] += t.amount; });
    return Object.entries(map).map(([cat, amt]) => ({ cat, amt })).sort((a, b) => b.amt - a.amt).slice(0, 8);
  }, [filtered]);

  const visibleTxns = useMemo(() => filtered.filter((t) => activeTab === "all" || t.type === activeTab).slice(0, 25), [filtered, activeTab]);

  function addTransaction() {
    if (!formAmount || !formCategory || !formDesc) return;
    onAdd({ id: Date.now().toString(), type: formType, paymentMethod: formPayment, amount: Math.abs(parseFloat(formAmount)), category: formCategory, description: formDesc, date: new Date(formDate) });
    setFormAmount(""); setFormCategory(""); setFormDesc(""); setFormDate(new Date().toISOString().split("T")[0]); setShowForm(false);
  }

  return (
    <div className="space-y-5">
      {/* Period Filter + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Period:</span>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => {
            const isActive = period === p && !particularDate;
            return (
              <button key={p} onClick={() => { setPeriod(p); setParticularDate(""); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border cursor-pointer ${isActive ? "text-white border-transparent shadow-sm" : "bg-card text-foreground border-border hover:border-border/60"}`}
                style={isActive ? { backgroundColor: shop.color } : {}}
              >{PERIOD_LABELS[p]}</button>
            );
          })}
          
          {/* Particular Day Toggle / Picker */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3.5 py-1 transition-all hover:border-border/60">
            <span className="text-xs font-semibold text-muted-foreground select-none">Particular Day:</span>
            <input 
              type="date"
              value={particularDate}
              onChange={(e) => setParticularDate(e.target.value)}
              className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer w-28 text-center"
              style={{ color: shop.color }}
            />
            {particularDate && (
              <button 
                type="button"
                onClick={() => setParticularDate("")}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-1 font-semibold cursor-pointer"
                title="Clear particular day"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity cursor-pointer"
          style={{ backgroundColor: shop.color }}
        ><Plus size={15} /> Add Entry</button>
      </div>

      {/* Payment method cards */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Payment Method Breakdown</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><Banknote size={15} className="text-amber-700" /></div>
              <span className="text-sm font-semibold text-muted-foreground">Hand Cash</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace]" style={{ color: cashBalance >= 0 ? "#b45309" : "#dc2626" }}>{fmtShort(Math.abs(cashBalance))}</p>
            <div className="mt-3 flex gap-3 text-xs"><span className="text-green-600 font-medium">+{fmtShort(cashIncome)}</span><span className="text-destructive font-medium">−{fmtShort(cashExpense)}</span></div>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center"><Smartphone size={15} className="text-sky-700" /></div>
              <span className="text-sm font-semibold text-muted-foreground">GPay</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace]" style={{ color: gpayBalance >= 0 ? "#0369a1" : "#dc2626" }}>{fmtShort(Math.abs(gpayBalance))}</p>
            <div className="mt-3 flex gap-3 text-xs"><span className="text-green-600 font-medium">+{fmtShort(gpayIncome)}</span><span className="text-destructive font-medium">−{fmtShort(gpayExpense)}</span></div>
          </div>
          <div className="rounded-2xl p-5 border shadow-sm text-white" style={{ backgroundColor: shop.color }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center"><Wallet size={15} /></div>
              <span className="text-sm font-semibold opacity-80">Total Balance</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace]">{fmtShort(Math.abs(balance))}</p>
            <div className="mt-3 flex gap-3 text-xs opacity-80"><span>Cash: {fmtShort(cashBalance)}</span><span>GPay: {fmtShort(gpayBalance)}</span></div>
          </div>
        </div>
      </div>

      {/* Income / Expense */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveTab(activeTab === "income" ? "all" : "income")}
          className={`bg-card rounded-2xl p-5 border shadow-sm flex items-center gap-4 text-left cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === "income" ? "border-green-600/50 bg-green-50/10 shadow-md" : "border-border hover:border-green-600/20"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><TrendingUp size={18} className="text-green-700" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
              Total Income {activeTab === "income" && <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-ping" />}
            </p>
            <p className="text-xl font-bold text-green-700 font-[DM_Mono,monospace]">{fmt(totalIncome)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.filter((t) => t.type === "income").length} transactions</p>
          </div>
        </button>
        <button 
          onClick={() => setActiveTab(activeTab === "expense" ? "all" : "expense")}
          className={`bg-card rounded-2xl p-5 border shadow-sm flex items-center gap-4 text-left cursor-pointer transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] ${
            activeTab === "expense" ? "border-destructive/50 bg-destructive/5 shadow-md" : "border-border hover:border-destructive/20"
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><TrendingDown size={18} className="text-destructive" /></div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
              Total Expenses {activeTab === "expense" && <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />}
            </p>
            <p className="text-xl font-bold text-destructive font-[DM_Mono,monospace]">{fmt(totalExpense)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.filter((t) => t.type === "expense").length} transactions</p>
          </div>
        </button>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-bold mb-4">
          Income vs Expenses — {particularDate ? `Particular Day (${new Date(particularDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })})` : PERIOD_LABELS[period]}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "DM Mono, monospace", fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={particularDate ? 0 : (period === "7d" ? 0 : period === "30d" ? 4 : 0)} />
            <YAxis tickFormatter={fmtShort} tick={{ fontSize: 10, fontFamily: "DM Mono, monospace", fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(v: number, name: string) => [fmt(v), name === "income" ? "Income" : "Expense"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontFamily: "DM Mono, monospace", fontSize: 12 }} />
            <Legend formatter={(v) => v === "income" ? "Income" : "Expenses"} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="income" fill={shop.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 lg:col-span-2">
          <h2 className="text-sm font-bold mb-4">By Category</h2>
          <div className="space-y-3">
            {categoryBreakdown.map(({ cat, amt }) => {
              const max = categoryBreakdown[0]?.amt || 1;
              const color = CATEGORY_COLORS[cat] || "#94a3b8";
              return (
                <div key={cat} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-xs font-medium w-28 truncate">{cat}</span>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.round((amt / max) * 100)}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-xs font-semibold font-[DM_Mono,monospace] text-muted-foreground w-16 text-right">{fmtShort(amt)}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">Recent Transactions</h2>
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(["all", "income", "expense"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
                >{tab}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {visibleTxns.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No transactions in this period.</p>}
            {visibleTxns.map((t) => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0" style={{ backgroundColor: (CATEGORY_COLORS[t.category] || "#94a3b8") + "18" }}>
                  {t.type === "income" ? "📈" : "📉"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{t.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-muted-foreground truncate">{t.category}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${t.paymentMethod === "cash" ? "text-amber-600" : "text-sky-600"}`}>
                      {t.paymentMethod === "cash" ? <Banknote size={10} /> : <Smartphone size={10} />}
                      {t.paymentMethod === "cash" ? "Cash" : "GPay"}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground">{t.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                  </div>
                </div>
                <span className={`text-xs font-bold font-[DM_Mono,monospace] flex-shrink-0 ${t.type === "income" ? "text-green-700" : "text-destructive"}`}>
                  {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div><h3 className="text-base font-bold">Add Entry</h3><p className="text-xs text-muted-foreground">{shop.emoji} {shop.name}</p></div>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button onClick={() => { setFormType("income"); setFormCategory(""); }} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${formType === "income" ? "bg-green-700 text-white border-green-700" : "bg-muted text-muted-foreground border-transparent"}`}>+ Income</button>
                <button onClick={() => { setFormType("expense"); setFormCategory(""); }} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border ${formType === "expense" ? "bg-destructive text-white border-destructive" : "bg-muted text-muted-foreground border-transparent"}`}>− Expense</button>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button onClick={() => setFormPayment("cash")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border ${formPayment === "cash" ? "bg-amber-50 text-amber-700 border-amber-300" : "bg-muted text-muted-foreground border-transparent"}`}><Banknote size={15} /> Hand Cash</button>
                  <button onClick={() => setFormPayment("gpay")} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border ${formPayment === "gpay" ? "bg-sky-50 text-sky-700 border-sky-300" : "bg-muted text-muted-foreground border-transparent"}`}><Smartphone size={15} /> GPay</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount (₹)</label>
                <input type="number" placeholder="0" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
                <div className="relative">
                  <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                    <option value="">Select category…</option>
                    {(formType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description</label>
                <input type="text" placeholder="e.g. Mango juice batch sale" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={addTransaction} disabled={!formAmount || !formCategory || !formDesc} className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity" style={{ backgroundColor: shop.color }}>Save Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("jsf_logged_in") === "true" || sessionStorage.getItem("jsf_logged_in") === "true";
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem("jsf_user_email") || sessionStorage.getItem("jsf_user_email") || "";
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [activeShop, setActiveShop] = useState<ShopId>("shop1");
  const [mainView, setMainView] = useState<MainView>("finance");
  const [shopTransactions, setShopTransactions] = useState<Record<ShopId, Transaction[]>>(INITIAL_TRANSACTIONS);
  const [shopPurchases, setShopPurchases] = useState<Record<ShopId, Purchase[]>>(INITIAL_PURCHASES);
  const [shopCommitments, setShopCommitments] = useState<Record<ShopId, Commitment[]>>(INITIAL_COMMITMENTS);
  const [shopCommitmentPayments, setShopCommitmentPayments] = useState<Record<ShopId, CommitmentPayment[]>>(INITIAL_COMMITMENT_PAYMENTS);

  const shop = SHOPS[activeShop];

  function addTransaction(t: Transaction) {
    setShopTransactions((prev) => ({ ...prev, [activeShop]: [t, ...prev[activeShop]] }));
  }
  function addPurchase(p: Purchase) {
    setShopPurchases((prev) => ({ ...prev, [activeShop]: [p, ...prev[activeShop]] }));
  }
  function addCommitment(c: Commitment) {
    setShopCommitments((prev) => ({ ...prev, [activeShop]: [...prev[activeShop], c] }));
  }
  function deleteCommitment(id: string) {
    setShopCommitments((prev) => ({ ...prev, [activeShop]: prev[activeShop].filter((c) => c.id !== id) }));
  }
  function markCommitmentPaid(p: CommitmentPayment) {
    setShopCommitmentPayments((prev) => ({ ...prev, [activeShop]: [p, ...prev[activeShop]] }));
  }

  function handleLogout() {
    localStorage.removeItem("jsf_logged_in");
    localStorage.removeItem("jsf_user_email");
    sessionStorage.removeItem("jsf_logged_in");
    sessionStorage.removeItem("jsf_user_email");
    setIsLoggedIn(false);
    setUserEmail("");
  }

  if (!isLoggedIn) {
    return (
      <Login 
        onLoginSuccess={(email) => {
          setIsLoggedIn(true);
          setUserEmail(email);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-card shadow-sm gap-4 flex-wrap md:flex-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: shop.color + "20" }}>{shop.emoji}</div>
          <div>
            <h1 className="text-base font-bold leading-tight">JuiceShop Finance</h1>
            <p className="text-xs text-muted-foreground">{shop.name}</p>
          </div>
        </div>
        
        {/* Main nav */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 order-last md:order-none w-full md:w-auto justify-center">
          <button
            onClick={() => setMainView("finance")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${mainView === "finance" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutDashboard size={14} /> Finance
          </button>
          <button
            onClick={() => setMainView("purchases")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${mainView === "purchases" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ShoppingCart size={14} /> Purchases
          </button>
          <button
            onClick={() => setMainView("commitments")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${mainView === "commitments" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <ClipboardList size={14} /> Commitments
          </button>
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider leading-none mb-0.5">Manager</span>
            <span className="text-xs text-foreground font-semibold font-[DM_Mono,monospace] truncate max-w-[130px]">{userEmail}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs select-none">
            {userEmail ? userEmail[0].toUpperCase() : "A"}
          </div>
          <button
            onClick={() => setShowChangePassword(true)}
            title="Change Password"
            className="flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-95 cursor-pointer"
          >
            <Key size={16} />
          </button>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Shop Tabs */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex gap-0 max-w-6xl mx-auto">
          {(Object.keys(SHOPS) as ShopId[]).map((sid) => {
            const s = SHOPS[sid];
            const isActive = sid === activeShop;
            return (
              <button key={sid} onClick={() => setActiveShop(sid)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${isActive ? "border-current" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                style={isActive ? { color: s.color, borderColor: s.color } : {}}
              >
                <Store size={14} />{s.name}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {mainView === "finance" && (
          <FinanceView
            shopId={activeShop}
            transactions={shopTransactions[activeShop]}
            onAdd={addTransaction}
          />
        )}
        {mainView === "purchases" && (
          <PurchasesView
            shopId={activeShop}
            purchases={shopPurchases[activeShop]}
            onAdd={addPurchase}
          />
        )}
        {mainView === "commitments" && (
          <CommitmentsView
            shopId={activeShop}
            commitments={shopCommitments[activeShop]}
            payments={shopCommitmentPayments[activeShop]}
            onAddCommitment={addCommitment}
            onDeleteCommitment={deleteCommitment}
            onMarkPaid={markCommitmentPaid}
          />
        )}
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}
