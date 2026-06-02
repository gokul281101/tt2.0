export type TransactionType = "income" | "expense";
export type PaymentMethod = "cash" | "gpay" | "zomato";
export type ShopId = "shop1" | "shop2";
export type Period = "7d" | "30d" | "90d" | "all";
export type MainView =
  | "dashboard"
  | "sales"
  | "purchases"
  | "commitments"
  | "personal"
  | "debt"
  | "attendance"
  | "reports"
  | "settings"
  | "stock";
export type PurchaseCategory =
  | "Fruits & Vegetables"
  | "Packaging & Plastics"
  | "Other Supplies"
  | "Ice Cream"
  | "Dry Fruits"
  | "Cleaning Utility"
  | "Essence";
export type PurchaseUnit = "kg" | "pcs" | "packets" | "liters" | "dozen" | "boxes";
export type StockStatus = "none" | "in-stock" | "wanted";
export type InventoryLevel = "ok" | "low" | "out";

export interface Transaction {
  id: string;
  type: TransactionType;
  paymentMethod: PaymentMethod;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface Purchase {
  id: string;
  itemName: string;
  category: PurchaseCategory;
  quantity: number;
  unit: PurchaseUnit;
  pricePerUnit: number;
  totalPrice: number;
  date: Date;
  expenseId?: string;
}

export interface Commitment {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  dueDay: number;
  color: string;
}

export interface PartialPayment {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidDate: Date;
  note: string;
}

export interface CommitmentPayment {
  id: string;
  commitmentId: string;
  monthKey: string;
  paidAmount: number; // cumulative total of all partials
  paymentMethod: PaymentMethod;
  paidDate: Date;
  note: string;
  partialPayments: PartialPayment[];
}

export interface StockItem {
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

export interface PersonalExpense {
  id: string;
  amount: number;
  category: "Home" | "Personal Use";
  description: string;
  date: Date;
  paymentMethod: PaymentMethod;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: Date;
  description: string;
  paymentMethod: PaymentMethod;
}

export interface Debt {
  id: string;
  debtName: string;
  creditorName: string;
  originalAmount: number;
  remainingAmount: number;
  dueDate: Date;
  payments: DebtPayment[];
  status: "pending" | "paid";
}

export interface WageHistoryEntry {
  dailyWage: number;
  effectiveDate: string;
}

export interface Staff {
  id: string;
  name: string;
  dailyWage: number;
  wageHistory?: WageHistoryEntry[];
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: Date;
  status: "present" | "absent";
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  staffName: string;
  monthKey: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paidDate: Date;
  note: string;
}

