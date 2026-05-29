import { useState, useMemo, useRef, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Wallet, Plus, X, ChevronDown,
  Banknote, Smartphone, Store, ShoppingCart, LayoutDashboard,
  Package, Leaf, ChevronRight, Calendar, Hash, Weight,
  ClipboardList, CheckCircle2, AlertCircle, Trash2, History,
  Boxes, Star, StarOff, BookMarked, CircleAlert, CheckCheck,
  Bell, BellRing, ExternalLink,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type TransactionType = "income" | "expense";
type PaymentMethod = "cash" | "gpay";
type ShopId = "shop1" | "shop2";
type Period = "7d" | "30d" | "90d" | "all";
type MainView = "finance" | "purchases" | "commitments" | "stock";
type PurchaseCategory = "Fruits & Vegetables" | "Packaging & Plastics" | "Other Supplies";
type PurchaseUnit = "kg" | "pcs" | "packets" | "liters" | "dozen" | "boxes";
type StockStatus = "none" | "in-stock" | "wanted";

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

type StockStatus = "ok" | "low" | "out";

interface StockItem {
  id: string;
  name: string;
  category: PurchaseCategory;
  currentQty: number;
  unit: PurchaseUnit;
  minThreshold: number;
  wanted: boolean;
  wantedQty: number;
  wantedNote: string;
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

// ─── Stock Seed Data ──────────────────────────────────────────────────────────
function buildStockList(seed: number): StockItem[] {
  const items: StockItem[] = [
    // Fruits & Vegetables
    { id: `s${seed}1`,  name: "Watermelon",        category: "Fruits & Vegetables",   currentQty: 12,  unit: "kg",      minThreshold: 10, wanted: false, wantedQty: 20, wantedNote: "" },
    { id: `s${seed}2`,  name: "Mango",              category: "Fruits & Vegetables",   currentQty: 4,   unit: "kg",      minThreshold: 8,  wanted: true,  wantedQty: 15, wantedNote: "Need before weekend" },
    { id: `s${seed}3`,  name: "Orange",             category: "Fruits & Vegetables",   currentQty: 8,   unit: "kg",      minThreshold: 5,  wanted: false, wantedQty: 10, wantedNote: "" },
    { id: `s${seed}4`,  name: "Carrot",             category: "Fruits & Vegetables",   currentQty: 2,   unit: "kg",      minThreshold: 5,  wanted: true,  wantedQty: 8,  wantedNote: "" },
    { id: `s${seed}5`,  name: "Ginger",             category: "Fruits & Vegetables",   currentQty: 0,   unit: "kg",      minThreshold: 2,  wanted: true,  wantedQty: 3,  wantedNote: "Urgent" },
    { id: `s${seed}6`,  name: "Lemon",              category: "Fruits & Vegetables",   currentQty: 3,   unit: "kg",      minThreshold: 4,  wanted: true,  wantedQty: 6,  wantedNote: "" },
    { id: `s${seed}7`,  name: "Pineapple",          category: "Fruits & Vegetables",   currentQty: 5,   unit: "kg",      minThreshold: 4,  wanted: false, wantedQty: 5,  wantedNote: "" },
    { id: `s${seed}8`,  name: "Spinach",            category: "Fruits & Vegetables",   currentQty: 1,   unit: "kg",      minThreshold: 3,  wanted: true,  wantedQty: 4,  wantedNote: "" },
    { id: `s${seed}9`,  name: "Beetroot",           category: "Fruits & Vegetables",   currentQty: 6,   unit: "kg",      minThreshold: 3,  wanted: false, wantedQty: 5,  wantedNote: "" },
    { id: `s${seed}10`, name: "Coconut",            category: "Fruits & Vegetables",   currentQty: 10,  unit: "pcs",     minThreshold: 8,  wanted: false, wantedQty: 20, wantedNote: "" },
    // Packaging & Plastics
    { id: `s${seed}11`, name: "Plastic Cups 250ml", category: "Packaging & Plastics", currentQty: 3,   unit: "packets", minThreshold: 5,  wanted: true,  wantedQty: 10, wantedNote: "" },
    { id: `s${seed}12`, name: "Plastic Cups 500ml", category: "Packaging & Plastics", currentQty: 6,   unit: "packets", minThreshold: 4,  wanted: false, wantedQty: 8,  wantedNote: "" },
    { id: `s${seed}13`, name: "Paper Straws",       category: "Packaging & Plastics", currentQty: 0,   unit: "packets", minThreshold: 3,  wanted: true,  wantedQty: 5,  wantedNote: "Out of stock" },
    { id: `s${seed}14`, name: "Carry Bags",         category: "Packaging & Plastics", currentQty: 2,   unit: "packets", minThreshold: 3,  wanted: true,  wantedQty: 6,  wantedNote: "" },
    { id: `s${seed}15`, name: "Tissue Paper",       category: "Packaging & Plastics", currentQty: 8,   unit: "packets", minThreshold: 4,  wanted: false, wantedQty: 5,  wantedNote: "" },
    // Other Supplies
    { id: `s${seed}16`, name: "Sugar",              category: "Other Supplies",        currentQty: 5,   unit: "kg",      minThreshold: 3,  wanted: false, wantedQty: 10, wantedNote: "" },
    { id: `s${seed}17`, name: "Black Salt",         category: "Other Supplies",        currentQty: 0.5, unit: "kg",      minThreshold: 1,  wanted: true,  wantedQty: 2,  wantedNote: "" },
    { id: `s${seed}18`, name: "Honey",              category: "Other Supplies",        currentQty: 2,   unit: "kg",      minThreshold: 1,  wanted: false, wantedQty: 2,  wantedNote: "" },
    { id: `s${seed}19`, name: "Ice",                category: "Other Supplies",        currentQty: 0,   unit: "kg",      minThreshold: 5,  wanted: true,  wantedQty: 20, wantedNote: "Daily need" },
    { id: `s${seed}20`, name: "Protein Powder",     category: "Other Supplies",        currentQty: 1,   unit: "kg",      minThreshold: 0.5,wanted: false, wantedQty: 2,  wantedNote: "" },
  ];
  if (seed === 2) {
    items[0].currentQty = 8;
    items[1].currentQty = 10;
    items[1].wanted = false;
    items[4].currentQty = 1;
    items[10].currentQty = 1;
  }
  return items;
}

const INITIAL_STOCK: Record<ShopId, StockItem[]> = {
  shop1: buildStockList(1),
  shop2: buildStockList(2),
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

// ─── Stock List Column ──────────────────────────────────────────────────────────
function StockListColumn({
  shopId,
  stockList,
  customItems,
  onToggle,
  onAddCustomItem,
  onRemoveCustomItem,
}: {
  shopId: ShopId;
  stockList: Record<string, StockStatus>;
  customItems: string[];
  onToggle: (itemName: string) => void;
  onAddCustomItem: (name: string) => void;
  onRemoveCustomItem: (name: string) => void;
}) {
  const shop = SHOPS[shopId];
  const [newItem, setNewItem] = useState("");

  // Gather all items: preset + custom
  const allTracked = [
    ...ALL_ITEMS_FLAT.map((i) => i.name),
    ...customItems,
  ];
  const wantedItems = allTracked.filter((name) => stockList[name] === "wanted");
  const inStockItems = allTracked.filter((name) => stockList[name] === "in-stock");

  function handleAdd() {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onAddCustomItem(trimmed);
    setNewItem("");
  }

  return (
    <div className="lg:w-72 flex-shrink-0">
      <div className="bg-card rounded-2xl border border-border shadow-sm sticky top-4 flex flex-col" style={{ maxHeight: "calc(100vh - 6rem)" }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: shop.color + "20" }}>
            <ClipboardList size={14} style={{ color: shop.color }} />
          </div>
          <h2 className="text-sm font-bold flex-1">Stock List</h2>
          <div className="flex gap-2">
            <div className="text-center">
              <span className="text-xs font-bold text-green-700">{inStockItems.length}</span>
              <span className="text-[10px] text-muted-foreground ml-0.5">✅</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-amber-600">{wantedItems.length}</span>
              <span className="text-[10px] text-muted-foreground ml-0.5">⭐</span>
            </div>
          </div>
        </div>

        {/* Wanted Reminder Banner — removed; global banner handles this */}

        {/* Add new item input */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add item to track…"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleAdd}
              disabled={!newItem.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ backgroundColor: shop.color }}
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">Tap item to cycle: ⬜ → ✅ → ⭐ → ⬜</p>
        </div>

        {/* Scrollable item list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">

          {/* Custom items section */}
          {customItems.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: shop.color }}>
                Custom Items
              </p>
              <div className="space-y-1">
                {customItems.map((name) => {
                  const status = stockList[name] ?? "none";
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-1"
                    >
                      <button
                        onClick={() => onToggle(name)}
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor:
                            status === "in-stock" ? "#dcfce7"
                            : status === "wanted" ? "#fef3c7"
                            : "var(--muted)",
                          border:
                            status === "in-stock" ? "1px solid #86efac"
                            : status === "wanted" ? "1px solid #fde68a"
                            : "1px solid transparent",
                        }}
                      >
                        <span className="text-sm flex-shrink-0">
                          {status === "in-stock" ? "✅" : status === "wanted" ? "⭐" : "⬜"}
                        </span>
                        <span
                          className="text-xs font-semibold flex-1 truncate"
                          style={{
                            color:
                              status === "in-stock" ? "#166534"
                              : status === "wanted" ? "#92400e"
                              : "var(--muted-foreground)",
                          }}
                        >
                          {name}
                        </span>
                      </button>
                      <button
                        onClick={() => onRemoveCustomItem(name)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preset items by category */}
          {(Object.entries(PURCHASE_ITEMS) as [PurchaseCategory, typeof ALL_ITEMS_FLAT[0][]][]).map(([cat, items]) => (
            <div key={cat}>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: CATEGORY_COLORS_TEXT[cat] }}
              >
                {cat}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const status = stockList[item.name] ?? "none";
                  return (
                    <button
                      key={item.name}
                      onClick={() => onToggle(item.name)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all"
                      style={{
                        backgroundColor:
                          status === "in-stock" ? "#dcfce7"
                          : status === "wanted" ? "#fef3c7"
                          : "var(--muted)",
                        border:
                          status === "in-stock" ? "1px solid #86efac"
                          : status === "wanted" ? "1px solid #fde68a"
                          : "1px solid transparent",
                      }}
                    >
                      <span className="text-sm flex-shrink-0">
                        {status === "in-stock" ? "✅" : status === "wanted" ? "⭐" : "⬜"}
                      </span>
                      <span
                        className="text-xs font-semibold flex-1 truncate"
                        style={{
                          color:
                            status === "in-stock" ? "#166534"
                            : status === "wanted" ? "#92400e"
                            : "var(--muted-foreground)",
                        }}
                      >
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Purchases View ────────────────────────────────────────────────────────────
function PurchasesView({
  shopId, purchases, onAdd, stockList, onStockToggle, customItems, onAddCustomItem, onRemoveCustomItem,
}: {
  shopId: ShopId;
  purchases: Purchase[];
  onAdd: (p: Purchase) => void;
  stockList: Record<string, StockStatus>;
  onStockToggle: (itemName: string) => void;
  customItems: string[];
  onAddCustomItem: (name: string) => void;
  onRemoveCustomItem: (name: string) => void;
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

      {/* Stock List Column */}
      <StockListColumn
        shopId={shopId}
        stockList={stockList}
        customItems={customItems}
        onToggle={onStockToggle}
        onAddCustomItem={onAddCustomItem}
        onRemoveCustomItem={onRemoveCustomItem}
      />
    </div>
  );
}

// ─── Stock View ──────────────────────────────────────────────────────────────
function stockStatus(item: StockItem): StockStatus {
  if (item.currentQty <= 0) return "out";
  if (item.currentQty < item.minThreshold) return "low";
  return "ok";
}

const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string; border: string }> = {
  ok:  { label: "In Stock",  bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  low: { label: "Low",       bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  out: { label: "Out",       bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

function StockView({
  shopId, stock, onUpdate,
}: {
  shopId: ShopId;
  stock: StockItem[];
  onUpdate: (items: StockItem[]) => void;
}) {
  const shop = SHOPS[shopId];
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<PurchaseCategory | "all">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editQtyId, setEditQtyId] = useState<string | null>(null);
  const [editQtyVal, setEditQtyVal] = useState("");
  const [editWantedQtyId, setEditWantedQtyId] = useState<string | null>(null);
  const [editWantedQtyVal, setEditWantedQtyVal] = useState("");

  // Add form
  const [fName, setFName] = useState("");
  const [fCat, setFCat] = useState<PurchaseCategory>("Fruits & Vegetables");
  const [fQty, setFQty] = useState("");
  const [fUnit, setFUnit] = useState<PurchaseUnit>("kg");
  const [fMin, setFMin] = useState("");

  function update(id: string, patch: Partial<StockItem>) {
    onUpdate(stock.map((s) => s.id === id ? { ...s, ...patch } : s));
  }

  function toggleWanted(id: string) {
    const item = stock.find((s) => s.id === id)!;
    update(id, { wanted: !item.wanted });
  }

  function removeItem(id: string) {
    onUpdate(stock.filter((s) => s.id !== id));
  }

  function clearAllWanted() {
    onUpdate(stock.map((s) => ({ ...s, wanted: false })));
  }

  function submitAdd() {
    if (!fName || !fQty) return;
    const newItem: StockItem = {
      id: Date.now().toString(),
      name: fName,
      category: fCat,
      currentQty: parseFloat(fQty),
      unit: fUnit,
      minThreshold: fMin ? parseFloat(fMin) : 0,
      wanted: false,
      wantedQty: 1,
      wantedNote: "",
    };
    onUpdate([...stock, newItem]);
    setFName(""); setFQty(""); setFMin(""); setShowAddForm(false);
  }

  const filteredStock = useMemo(() => {
    return stock.filter((s) => {
      const matchCat = filterCat === "all" || s.category === filterCat;
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [stock, filterCat, search]);

  const byCategory = useMemo(() => {
    const cats: Record<string, StockItem[]> = {};
    filteredStock.forEach((s) => {
      if (!cats[s.category]) cats[s.category] = [];
      cats[s.category].push(s);
    });
    return cats;
  }, [filteredStock]);

  const wantedItems = useMemo(() => stock.filter((s) => s.wanted), [stock]);
  const outCount = stock.filter((s) => stockStatus(s) === "out").length;
  const lowCount = stock.filter((s) => stockStatus(s) === "low").length;

  const CAT_ICONS: Record<string, typeof Leaf> = {
    "Fruits & Vegetables": Leaf,
    "Packaging & Plastics": Package,
    "Other Supplies": ShoppingCart,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT: Stock List */}
      <div className="flex-1 space-y-4">
        {/* Summary + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {outCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}>
                <CircleAlert size={12} /> {outCount} Out of stock
              </span>
            )}
            {lowCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: "#fffbeb", color: "#b45309" }}>
                <AlertCircle size={12} /> {lowCount} Low stock
              </span>
            )}
          </div>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: shop.color }}
          ><Plus size={14} /> Add Item</button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text" placeholder="Search items…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-40 bg-card rounded-xl px-4 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["all", ...Object.keys(PURCHASE_ITEMS)] as (PurchaseCategory | "all")[]).map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${filterCat === cat ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >{cat === "all" ? "All" : cat.split(" ")[0]}</button>
            ))}
          </div>
        </div>

        {/* Stock by category */}
        {Object.entries(byCategory).map(([cat, items]) => {
          const Icon = CAT_ICONS[cat] || Package;
          return (
            <div key={cat} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
                <Icon size={14} className="text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{cat}</span>
                <span className="ml-auto text-xs text-muted-foreground">{items.length} items</span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const st = stockStatus(item);
                  const cfg = STATUS_CONFIG[st];
                  const isEditingQty = editQtyId === item.id;
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                      {/* Status dot */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.text }} />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Editable current qty */}
                          {isEditingQty ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus type="number" value={editQtyVal}
                                onChange={(e) => setEditQtyVal(e.target.value)}
                                onBlur={() => { if (editQtyVal !== "") update(item.id, { currentQty: parseFloat(editQtyVal) }); setEditQtyId(null); }}
                                onKeyDown={(e) => { if (e.key === "Enter") { if (editQtyVal !== "") update(item.id, { currentQty: parseFloat(editQtyVal) }); setEditQtyId(null); } }}
                                className="w-16 bg-input-background rounded-lg px-2 py-0.5 text-xs font-[DM_Mono,monospace] border border-primary focus:outline-none"
                              />
                              <span className="text-xs text-muted-foreground">{item.unit}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setEditQtyId(item.id); setEditQtyVal(String(item.currentQty)); }}
                              className="text-xs font-[DM_Mono,monospace] font-semibold hover:underline"
                              style={{ color: cfg.text }}
                            >
                              {item.currentQty % 1 === 0 ? item.currentQty : item.currentQty.toFixed(1)} {item.unit}
                            </button>
                          )}
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground/60">min {item.minThreshold} {item.unit}</span>
                        </div>
                      </div>

                      {/* Wanted toggle */}
                      <button
                        onClick={() => toggleWanted(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 ${
                          item.wanted
                            ? "border-amber-300 text-amber-700 bg-amber-50"
                            : "border-transparent text-muted-foreground bg-muted hover:border-border"
                        }`}
                      >
                        {item.wanted ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                        {item.wanted ? "Wanted" : "Want"}
                      </button>

                      {/* Delete */}
                      <button onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-red-50 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredStock.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Boxes size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No items found.</p>
          </div>
        )}
      </div>

      {/* RIGHT: Wanted List */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="bg-card rounded-2xl border border-border shadow-sm sticky top-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <BookMarked size={15} className="text-amber-600" />
              <h2 className="text-sm font-bold">Wanted List</h2>
              {wantedItems.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                  {wantedItems.length}
                </span>
              )}
            </div>
            {wantedItems.length > 0 && (
              <button onClick={clearAllWanted} className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium">
                Clear all
              </button>
            )}
          </div>

          {wantedItems.length === 0 ? (
            <div className="py-12 text-center px-5">
              <Star size={28} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground font-medium">No items marked as wanted.</p>
              <p className="text-xs text-muted-foreground mt-1">Click ★ Want on any stock item to add it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {wantedItems.map((item) => {
                const st = stockStatus(item);
                const cfg = STATUS_CONFIG[st];
                const isEditingWanted = editWantedQtyId === item.id;
                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.text }} />
                          <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-3">
                          Have: <span className="font-[DM_Mono,monospace] font-semibold" style={{ color: cfg.text }}>
                            {item.currentQty % 1 === 0 ? item.currentQty : item.currentQty.toFixed(1)} {item.unit}
                          </span>
                        </p>
                      </div>
                      <button onClick={() => toggleWanted(item.id)} className="text-amber-500 hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5">
                        <Star size={14} fill="currentColor" />
                      </button>
                    </div>

                    {/* Wanted qty */}
                    <div className="mt-2 flex items-center gap-2 ml-3">
                      <span className="text-xs text-muted-foreground">Need:</span>
                      {isEditingWanted ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus type="number" value={editWantedQtyVal}
                            onChange={(e) => setEditWantedQtyVal(e.target.value)}
                            onBlur={() => { if (editWantedQtyVal !== "") update(item.id, { wantedQty: parseFloat(editWantedQtyVal) }); setEditWantedQtyId(null); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { if (editWantedQtyVal !== "") update(item.id, { wantedQty: parseFloat(editWantedQtyVal) }); setEditWantedQtyId(null); } }}
                            className="w-14 bg-input-background rounded-lg px-2 py-0.5 text-xs font-[DM_Mono,monospace] border border-primary focus:outline-none"
                          />
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditWantedQtyId(item.id); setEditWantedQtyVal(String(item.wantedQty)); }}
                          className="text-xs font-[DM_Mono,monospace] font-bold text-primary hover:underline"
                        >
                          {item.wantedQty} {item.unit}
                        </button>
                      )}
                    </div>

                    {/* Note */}
                    <input
                      type="text" placeholder="Add note…" value={item.wantedNote}
                      onChange={(e) => update(item.id, { wantedNote: e.target.value })}
                      className="mt-2 w-full bg-transparent text-xs text-muted-foreground placeholder:text-muted-foreground/50 border-0 border-b border-dashed border-border focus:outline-none focus:border-primary ml-3"
                      style={{ width: "calc(100% - 0.75rem)" }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {wantedItems.length > 0 && (
            <div className="px-5 py-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span className="font-semibold">{wantedItems.length} items to buy</span>
                <span className="flex items-center gap-1">
                  <CheckCheck size={12} />
                  tap ★ to clear
                </span>
              </div>
              <div className="space-y-1">
                {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                  const catWanted = wantedItems.filter((i) => i.category === cat);
                  if (catWanted.length === 0) return null;
                  const CatIcon = CAT_ICONS[cat] || Package;
                  const CAT_ICONS2: Record<string, typeof Leaf> = { "Fruits & Vegetables": Leaf, "Packaging & Plastics": Package, "Other Supplies": ShoppingCart };
                  const CIcon = CAT_ICONS2[cat] || Package;
                  return (
                    <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CIcon size={10} /><span>{catWanted.length} {cat.split(" ")[0].toLowerCase()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Stock Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">Add Stock Item</h3>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Category</label>
                <div className="flex flex-col gap-1.5">
                  {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                    const Icon = CAT_ICONS[cat] || Package;
                    return (
                      <button key={cat} onClick={() => setFCat(cat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${fCat === cat ? "bg-primary/10 border-primary/40 text-primary" : "bg-muted border-transparent text-muted-foreground"}`}
                      ><Icon size={13} />{cat}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Item Name</label>
                <input type="text" placeholder="e.g. Dragon Fruit" value={fName} onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Current Qty</label>
                  <input type="number" placeholder="0" value={fQty} onChange={(e) => setFQty(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div className="w-28">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit</label>
                  <div className="relative">
                    <select value={fUnit} onChange={(e) => setFUnit(e.target.value as PurchaseUnit)}
                      className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none">
                      {(["kg", "pcs", "packets", "liters", "dozen", "boxes"] as PurchaseUnit[]).map((u) => <option key={u}>{u}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Min Threshold (alert when below)</label>
                <input type="number" placeholder="e.g. 5" value={fMin} onChange={(e) => setFMin(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <button onClick={submitAdd} disabled={!fName || !fQty}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: shop.color }}>Add to Stock</button>
            </div>
          </div>
        </div>
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

  const filtered = useMemo(() => transactions.filter((t) => t.date >= cutoff), [transactions, cutoff]);
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
  }, [filtered, period]);

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
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${period === p ? "text-white border-transparent shadow-sm" : "bg-card text-foreground border-border"}`}
              style={period === p ? { backgroundColor: shop.color } : {}}
            >{PERIOD_LABELS[p]}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
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
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><TrendingUp size={18} className="text-green-700" /></div>
          <div><p className="text-xs text-muted-foreground font-semibold">Total Income</p><p className="text-xl font-bold text-green-700 font-[DM_Mono,monospace]">{fmt(totalIncome)}</p><p className="text-xs text-muted-foreground mt-0.5">{filtered.filter((t) => t.type === "income").length} transactions</p></div>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><TrendingDown size={18} className="text-destructive" /></div>
          <div><p className="text-xs text-muted-foreground font-semibold">Total Expenses</p><p className="text-xl font-bold text-destructive font-[DM_Mono,monospace]">{fmt(totalExpense)}</p><p className="text-xs text-muted-foreground mt-0.5">{filtered.filter((t) => t.type === "expense").length} transactions</p></div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-bold mb-4">Income vs Expenses — {PERIOD_LABELS[period]}</h2>
        <ResponsiveContainer key={period} width="100%" height={200}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "DM Mono, monospace", fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={period === "7d" ? 0 : period === "30d" ? 4 : 0} />
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
  const [activeShop, setActiveShop] = useState<ShopId>("shop1");
  const [mainView, setMainView] = useState<MainView>("finance");
  const [shopTransactions, setShopTransactions] = useState<Record<ShopId, Transaction[]>>(INITIAL_TRANSACTIONS);
  const [shopPurchases, setShopPurchases] = useState<Record<ShopId, Purchase[]>>(INITIAL_PURCHASES);
  const [shopCommitments, setShopCommitments] = useState<Record<ShopId, Commitment[]>>(INITIAL_COMMITMENTS);
  const [shopCommitmentPayments, setShopCommitmentPayments] = useState<Record<ShopId, CommitmentPayment[]>>(INITIAL_COMMITMENT_PAYMENTS);
<<<<<<< HEAD:frontend/src/app/App.tsx
  const [shopStockList, setShopStockList] = useState<Record<ShopId, Record<string, StockStatus>>>({ shop1: {}, shop2: {} });
  const [shopCustomItems, setShopCustomItems] = useState<Record<ShopId, string[]>>({ shop1: [], shop2: [] });

  const shop = SHOPS[activeShop];

  // Compute all wanted items for the global reminder (preset + custom)
  const allWantedItems = useMemo(() => {
    const sl = shopStockList[activeShop];
    const preset = ALL_ITEMS_FLAT.map((i) => i.name).filter((n) => sl[n] === "wanted");
    const custom = (shopCustomItems[activeShop] || []).filter((n) => sl[n] === "wanted");
    return [...preset, ...custom];
  }, [shopStockList, shopCustomItems, activeShop]);
=======
  const [shopStock, setShopStock] = useState<Record<ShopId, StockItem[]>>(INITIAL_STOCK);
  const [showBell, setShowBell] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const shop = SHOPS[activeShop];

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setShowBell(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Compute reminders across BOTH shops
  const allReminders = useMemo(() => {
    const out: { shopId: ShopId; item: StockItem }[] = [];
    const low: { shopId: ShopId; item: StockItem }[] = [];
    const wanted: { shopId: ShopId; item: StockItem }[] = [];
    (Object.keys(SHOPS) as ShopId[]).forEach((sid) => {
      shopStock[sid].forEach((item) => {
        const st = stockStatus(item);
        if (st === "out") out.push({ shopId: sid, item });
        else if (st === "low") low.push({ shopId: sid, item });
        if (item.wanted) wanted.push({ shopId: sid, item });
      });
    });
    return { out, low, wanted };
  }, [shopStock]);

  const totalAlerts = allReminders.out.length + allReminders.low.length + allReminders.wanted.length;
  const urgentCount = allReminders.out.length;
>>>>>>> bfe00cf02dfdc65887bd9c429cd1632d51211038:src/app/App.tsx

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
<<<<<<< HEAD:frontend/src/app/App.tsx

  function toggleStockItem(itemName: string) {
    setShopStockList((prev) => {
      const current = prev[activeShop][itemName] ?? "none";
      const next: StockStatus = current === "none" ? "in-stock" : current === "in-stock" ? "wanted" : "none";
      return { ...prev, [activeShop]: { ...prev[activeShop], [itemName]: next } };
    });
  }

  function addCustomStockItem(name: string) {
    setShopCustomItems((prev) => {
      if (prev[activeShop].includes(name)) return prev;
      return { ...prev, [activeShop]: [...prev[activeShop], name] };
    });
  }

  function removeCustomStockItem(name: string) {
    setShopCustomItems((prev) => ({
      ...prev,
      [activeShop]: prev[activeShop].filter((i) => i !== name),
    }));
    // Also clear its stock status
    setShopStockList((prev) => {
      const updated = { ...prev[activeShop] };
      delete updated[name];
      return { ...prev, [activeShop]: updated };
    });
  }

  function handleLogout() {
    localStorage.removeItem("jsf_logged_in");
    localStorage.removeItem("jsf_user_email");
    sessionStorage.removeItem("jsf_logged_in");
    sessionStorage.removeItem("jsf_user_email");
    setIsLoggedIn(false);
    setUserEmail("");
=======
  function updateStock(items: StockItem[]) {
    setShopStock((prev) => ({ ...prev, [activeShop]: items }));
>>>>>>> bfe00cf02dfdc65887bd9c429cd1632d51211038:src/app/App.tsx
  }

  // Stock counts for the active shop (for tab badge)
  const activeStockAlerts = useMemo(() => {
    const items = shopStock[activeShop];
    return {
      out: items.filter((i) => stockStatus(i) === "out").length,
      low: items.filter((i) => stockStatus(i) === "low").length,
      wanted: items.filter((i) => i.wanted).length,
    };
  }, [shopStock, activeShop]);

  return (
    <div className="min-h-screen bg-background font-[Plus_Jakarta_Sans,sans-serif]">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-border bg-card shadow-sm gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: shop.color + "20" }}>{shop.emoji}</div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold leading-tight">JuiceShop Finance</h1>
            <p className="text-xs text-muted-foreground">{shop.name}</p>
          </div>
        </div>

        {/* Main nav */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto flex-shrink-0">
          <button onClick={() => setMainView("finance")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${mainView === "finance" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutDashboard size={13} /> Finance
          </button>
          <button onClick={() => setMainView("purchases")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${mainView === "purchases" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <ShoppingCart size={13} /> Purchases
          </button>
          <button onClick={() => setMainView("commitments")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${mainView === "commitments" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <ClipboardList size={13} /> Commitments
          </button>
          <button onClick={() => setMainView("stock")}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${mainView === "stock" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Boxes size={13} /> Stock
            {(activeStockAlerts.out + activeStockAlerts.low) > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                {activeStockAlerts.out + activeStockAlerts.low}
              </span>
            )}
          </button>
        </div>

        {/* Bell */}
        <div className="relative flex-shrink-0" ref={bellRef}>
          <button
            onClick={() => setShowBell((v) => !v)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showBell ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"}`}
          >
            {totalAlerts > 0 ? <BellRing size={17} /> : <Bell size={17} />}
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Bell Dropdown */}
          {showBell && (
            <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-bold">Stock Reminders</p>
                <span className="text-xs text-muted-foreground">{totalAlerts} alerts</span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {totalAlerts === 0 && (
                  <div className="py-10 text-center text-muted-foreground">
                    <CheckCircle2 size={28} className="mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-medium">All stocked up!</p>
                    <p className="text-xs mt-1">No reminders right now.</p>
                  </div>
                )}

                {/* Out of Stock */}
                {allReminders.out.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border-b border-red-100">
                      <CircleAlert size={13} className="text-destructive" />
                      <span className="text-xs font-bold text-destructive uppercase tracking-wide">Out of Stock</span>
                      <span className="ml-auto text-xs font-bold text-destructive">{allReminders.out.length}</span>
                    </div>
                    {allReminders.out.map(({ shopId, item }) => (
                      <div key={`out-${shopId}-${item.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 border-b border-border/50">
                        <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{SHOPS[shopId].emoji} {SHOPS[shopId].name.split("—")[0].trim()}</p>
                        </div>
                        <span className="text-xs font-bold text-destructive font-[DM_Mono,monospace]">0 {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Stock */}
                {allReminders.low.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
                      <AlertCircle size={13} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Low Stock</span>
                      <span className="ml-auto text-xs font-bold text-amber-700">{allReminders.low.length}</span>
                    </div>
                    {allReminders.low.map(({ shopId, item }) => (
                      <div key={`low-${shopId}-${item.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 border-b border-border/50">
                        <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{SHOPS[shopId].emoji} {SHOPS[shopId].name.split("—")[0].trim()}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-700 font-[DM_Mono,monospace]">
                          {item.currentQty % 1 === 0 ? item.currentQty : item.currentQty.toFixed(1)} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Wanted */}
                {allReminders.wanted.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/50 border-b border-amber-100/50">
                      <Star size={13} className="text-amber-500" fill="currentColor" />
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Wanted to Buy</span>
                      <span className="ml-auto text-xs font-bold text-amber-600">{allReminders.wanted.length}</span>
                    </div>
                    {allReminders.wanted.map(({ shopId, item }) => (
                      <div key={`want-${shopId}-${item.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 border-b border-border/50">
                        <Star size={12} className="text-amber-400 flex-shrink-0" fill="currentColor" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">{SHOPS[shopId].emoji} {SHOPS[shopId].name.split("—")[0].trim()}</p>
                            {item.wantedNote && <><span className="text-muted-foreground/40">·</span><p className="text-xs text-muted-foreground truncate">{item.wantedNote}</p></>}
                          </div>
                        </div>
                        <span className="text-xs font-bold text-primary font-[DM_Mono,monospace]">
                          {item.wantedQty} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-4 py-3 border-t border-border">
                <button
                  onClick={() => { setMainView("stock"); setShowBell(false); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={12} /> Go to Stock List
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Urgent Banner */}
      {urgentCount > 0 && !dismissedBanner && (
        <div className="bg-destructive text-white px-4 py-2.5 flex items-center gap-3">
          <CircleAlert size={15} className="flex-shrink-0" />
          <p className="text-sm font-semibold flex-1">
            {urgentCount} item{urgentCount > 1 ? "s are" : " is"} out of stock across your shops —{" "}
            <button onClick={() => { setMainView("stock"); setDismissedBanner(true); }} className="underline underline-offset-2 hover:opacity-80">
              check stock list
            </button>
          </p>
          <button onClick={() => setDismissedBanner(true)} className="text-white/70 hover:text-white transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Shop Tabs */}
      <div className="bg-card border-b border-border px-6">
        <div className="flex gap-0 max-w-6xl mx-auto">
          {(Object.keys(SHOPS) as ShopId[]).map((sid) => {
            const s = SHOPS[sid];
            const isActive = sid === activeShop;
            const shopOut = shopStock[sid].filter((i) => stockStatus(i) === "out").length;
            return (
              <button key={sid} onClick={() => setActiveShop(sid)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${isActive ? "border-current" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                style={isActive ? { color: s.color, borderColor: s.color } : {}}
              >
                <Store size={14} />{s.name}
                {shopOut > 0 && (
                  <span className="w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">{shopOut}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Wanted Reminder Bar */}
      {allWantedItems.length > 0 && (
        <div
          className="px-6 py-2.5"
          style={{
            background: "linear-gradient(90deg, #fef3c7 0%, #fde68a 60%, #fef3c7 100%)",
            borderBottom: "1.5px solid #fbbf24",
          }}
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span className="text-xs font-bold text-amber-900">🛒 Shopping Reminder</span>
              <span
                className="text-[10px] font-bold rounded-full px-1.5 py-0.5 text-white"
                style={{ backgroundColor: "#d97706" }}
              >
                {allWantedItems.length} item{allWantedItems.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allWantedItems.map((name) => (
                <span
                  key={name}
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#fbbf24", color: "#78350f", border: "1px solid #f59e0b" }}
                >
                  {name}
                </span>
              ))}
            </div>
            <button
              onClick={() => setMainView("purchases")}
              className="ml-auto text-xs font-bold text-amber-800 underline underline-offset-2 hover:text-amber-900 flex-shrink-0 transition-colors"
            >
              Manage Stock →
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {mainView === "finance" && (
          <FinanceView shopId={activeShop} transactions={shopTransactions[activeShop]} onAdd={addTransaction} />
        )}
        {mainView === "purchases" && (
<<<<<<< HEAD:frontend/src/app/App.tsx
          <PurchasesView
            shopId={activeShop}
            purchases={shopPurchases[activeShop]}
            onAdd={addPurchase}
            stockList={shopStockList[activeShop]}
            onStockToggle={toggleStockItem}
            customItems={shopCustomItems[activeShop]}
            onAddCustomItem={addCustomStockItem}
            onRemoveCustomItem={removeCustomStockItem}
          />
=======
          <PurchasesView shopId={activeShop} purchases={shopPurchases[activeShop]} onAdd={addPurchase} />
>>>>>>> bfe00cf02dfdc65887bd9c429cd1632d51211038:src/app/App.tsx
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
        {mainView === "stock" && (
          <StockView shopId={activeShop} stock={shopStock[activeShop]} onUpdate={updateStock} />
        )}
      </main>
    </div>
  );
}
