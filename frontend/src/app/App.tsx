import { useState, useRef, useEffect, useMemo } from "react";
import {
  Bell,
  BellRing,
  CheckCircle2,
  CircleAlert,
  AlertCircle,
  Star,
  X,
  Store,
  LayoutDashboard,
  BadgeCent,
  ShoppingCart,
  ClipboardList,
  HeartHandshake,
  ShieldAlert,
  Users,
  ChartPie,
  Settings,
  Boxes,
  ExternalLink,
  Plus,
  Banknote,
  Smartphone,
  Flame,
} from "lucide-react";
import Login from "./components/Login";
import { api } from "./api";

// Import Modular Types
import type {
  ShopId,
  MainView,
  Transaction,
  TransactionType,
  PaymentMethod,
  Purchase,
  Commitment,
  CommitmentPayment,
  StockItem,
  StockStatus,
  PersonalExpense,
  Debt,
  Staff,
  AttendanceRecord,
  SalaryPayment,
  PurchaseCategory,
  PurchaseUnit,
} from "./types";
import { SHOPS, PURCHASE_ITEMS } from "./constants";
import { stockStatus } from "./components/StockView";

// Views
import { DashboardView } from "./components/DashboardView";
import { FinanceView } from "./components/FinanceView"; // Sales Module
import { PurchasesView } from "./components/PurchasesView";
import { CommitmentsView } from "./components/CommitmentsView";
import { PersonalView } from "./components/PersonalView";
import { DebtView } from "./components/DebtView";
import { AttendanceView } from "./components/AttendanceView";
import { ReportsView } from "./components/ReportsView";
import { SettingsView } from "./components/SettingsView";
import { StockView } from "./components/StockView";

// Setup Initial empty collections
const INITIAL_TRANSACTIONS: Record<ShopId, Transaction[]> = {
  shop1: [],
  shop2: [],
};
const INITIAL_PURCHASES: Record<ShopId, Purchase[]> = {
  shop1: [],
  shop2: [],
};
const INITIAL_COMMITMENTS: Record<ShopId, Commitment[]> = {
  shop1: [],
  shop2: [],
};
const INITIAL_COMMITMENT_PAYMENTS: Record<ShopId, CommitmentPayment[]> = {
  shop1: [],
  shop2: [],
};
const INITIAL_STOCK: Record<ShopId, StockItem[]> = {
  shop1: [],
  shop2: [],
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [, setUserEmail] = useState<string>("admin@jsfinance.com");
  const [activeShop, setActiveShop] = useState<ShopId>("shop1");
  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [shopTransactions, setShopTransactions] = useState<Record<ShopId, Transaction[]>>(
    INITIAL_TRANSACTIONS
  );
  const [shopPurchases, setShopPurchases] = useState<Record<ShopId, Purchase[]>>(
    INITIAL_PURCHASES
  );
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [commitmentPayments, setCommitmentPayments] = useState<CommitmentPayment[]>([]);
  const [allCommitmentPayments, setAllCommitmentPayments] = useState<CommitmentPayment[]>([]);
  const [shopStockList, setShopStockList] = useState<Record<ShopId, Record<string, StockStatus>>>({
    shop1: {},
    shop2: {},
  });
  const [shopCustomItems, setShopCustomItems] = useState<Record<ShopId, string[]>>({
    shop1: [],
    shop2: [],
  });
  const [shopStock, setShopStock] = useState<Record<ShopId, StockItem[]>>(INITIAL_STOCK);
  const [showBell, setShowBell] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // New modules states
  const [personalExpenses, setPersonalExpenses] = useState<PersonalExpense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);

  // Quick Entry FAB States
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showQuickIncome, setShowQuickIncome] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickPersonal, setShowQuickPersonal] = useState(false);

  // Quick Personal Form States
  const [quickPersCategory, setQuickPersCategory] = useState<"Home" | "Personal Use">("Home");
  const [quickPersPayment, setQuickPersPayment] = useState<PaymentMethod>("cash");
  const [quickPersAmount, setQuickPersAmount] = useState("");
  const [quickPersDesc, setQuickPersDesc] = useState("");
  const [quickPersDate, setQuickPersDate] = useState(new Date().toISOString().split("T")[0]);

  // Quick Income Form States
  const [quickIncShop, setQuickIncShop] = useState<ShopId>("shop1");
  const [quickIncPayment, setQuickIncPayment] = useState<PaymentMethod>("cash");
  const [quickIncAmount, setQuickIncAmount] = useState("");
  const [quickIncDesc, setQuickIncDesc] = useState("");
  const [quickIncDate, setQuickIncDate] = useState(new Date().toISOString().split("T")[0]);

  // Quick Expense Form States
  const [quickExpCategory, setQuickExpCategory] = useState("");
  const [quickExpPayment, setQuickExpPayment] = useState<PaymentMethod>("cash");
  const [quickExpAmount, setQuickExpAmount] = useState("");
  const [quickExpDesc, setQuickExpDesc] = useState("");
  const [quickExpQty, setQuickExpQty] = useState("");
  const [quickExpUnit, setQuickExpUnit] = useState<PurchaseUnit>("pcs");
  const [quickExpDate, setQuickExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [quickExpCustomItem, setQuickExpCustomItem] = useState(false);

  const shop = SHOPS[activeShop];

  // Load data from backend API
  useEffect(() => {
    if (!isLoggedIn) return;

    async function loadData() {
      try {
        const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(
          2,
          "0"
        )}`;

        const [
          txnsShop1,
          txnsShop2,
          purchasesShop1,
          purchasesShop2,
          commitmentsData,
          stockShop1,
          stockShop2,
          personal,
          debtRecords,
          staff,
          attendance,
          salaries,
        ] = await Promise.all([
          api.getTransactions("shop1"),
          api.getTransactions("shop2"),
          api.getPurchases("shop1"),
          api.getPurchases("shop2"),
          api.getCommitments(activeShop, monthKey),
          api.getStock("shop1"),
          api.getStock("shop2"),
          api.getPersonalExpenses(),
          api.getDebts(),
          api.getStaff(),
          api.getAttendance(),
          api.getSalaryPayments(),
        ]);

        setShopTransactions({ shop1: txnsShop1, shop2: txnsShop2 });
        setShopPurchases({ shop1: purchasesShop1, shop2: purchasesShop2 });
        setCommitments(commitmentsData.commitments);
        setCommitmentPayments(commitmentsData.payments);
        setAllCommitmentPayments(commitmentsData.allPayments);
        setShopStock({ shop1: stockShop1, shop2: stockShop2 });
        setPersonalExpenses(personal);
        setDebts(debtRecords);
        setStaffList(staff);
        setAttendanceRecords(attendance);
        setSalaryPayments(salaries);
      } catch (error) {
        console.error("Error loading backend data:", error);
      }
    }

    loadData();
  }, [isLoggedIn]);

  async function addTransaction(
    t: Transaction,
    targetShopId: ShopId = activeShop,
    purchasePayloads?: {
      itemName: string;
      category: any;
      quantity: number;
      unit: any;
      price: number;
      date: Date;
    }[]
  ) {
    try {
      const newTx = await api.addTransaction(targetShopId, t);
      if (newTx.type === "expense") {
        setShopTransactions((prev) => ({
          ...prev,
          shop1: [newTx, ...prev.shop1],
          shop2: [newTx, ...prev.shop2],
        }));
      } else {
        setShopTransactions((prev) => ({
          ...prev,
          [targetShopId]: [newTx, ...prev[targetShopId]],
        }));
      }

      if (purchasePayloads && purchasePayloads.length > 0) {
        await Promise.all(
          purchasePayloads.map(async (pItem) => {
            const p: Omit<Purchase, "id"> = {
              itemName: pItem.itemName,
              category: pItem.category,
              quantity: pItem.quantity,
              unit: pItem.unit,
              pricePerUnit: Math.round((pItem.price / pItem.quantity) * 100) / 100,
              totalPrice: pItem.price,
              date: pItem.date,
              expenseId: newTx.id,
            };
            await addPurchase(p as Purchase, targetShopId);
          })
        );
      } else if (newTx.type === "expense" && PURCHASE_ITEMS[newTx.category as PurchaseCategory]) {
        // Automatically create a purchase if it belongs to an inventory category
        const cat = newTx.category as PurchaseCategory;
        const matchedItem = PURCHASE_ITEMS[cat]?.find(
          (i) => i.name.toLowerCase() === newTx.description.toLowerCase()
        );
        const itemName = matchedItem ? matchedItem.name : newTx.description || cat;
        const unit = matchedItem ? matchedItem.unit : "pcs";
        const basePrice = matchedItem ? matchedItem.basePrice : 1;
        const quantity = matchedItem 
          ? Number((newTx.amount / basePrice).toFixed(2)) || 1
          : 1;
        const pricePerUnit = Math.round((newTx.amount / quantity) * 100) / 100;

        const p: Omit<Purchase, "id"> = {
          itemName,
          category: cat,
          quantity,
          unit,
          pricePerUnit,
          totalPrice: newTx.amount,
          date: newTx.date,
          expenseId: newTx.id,
        };

        await addPurchase(p as Purchase, targetShopId);
      }
    } catch (error) {
      console.error("Failed to add transaction:", error);
    }
  }

  async function deleteTransaction(id: string, type: TransactionType, targetShopId: ShopId = activeShop) {
    try {
      await api.deleteTransaction(targetShopId, id, type);
      if (type === "expense") {
        setShopTransactions((prev) => ({
          ...prev,
          shop1: prev.shop1.filter((t) => t.id !== id),
          shop2: prev.shop2.filter((t) => t.id !== id),
        }));
        // Also cascade delete associated purchases locally
        setShopPurchases((prev) => ({
          ...prev,
          shop1: prev.shop1.filter((p) => p.expenseId !== id),
          shop2: prev.shop2.filter((p) => p.expenseId !== id),
        }));

        // Reload stock for both shops to reflect inventory adjustments from deleted stock purchases
        const [stock1, stock2] = await Promise.all([
          api.getStock("shop1"),
          api.getStock("shop2"),
        ]);
        setShopStock({ shop1: stock1, shop2: stock2 });
      } else {
        setShopTransactions((prev) => ({
          ...prev,
          [targetShopId]: prev[targetShopId].filter((t) => t.id !== id),
        }));
      }
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }

  async function addPurchase(p: Omit<Purchase, "id">, targetShopId: ShopId = activeShop) {
    try {
      let expenseId = p.expenseId;
      if (!expenseId) {
        // Create an Expense transaction first
        const t: Omit<Transaction, "id"> = {
          type: "expense",
          paymentMethod: "cash", // default payment method
          amount: p.totalPrice,
          category: p.category,
          description: `Purchase: ${p.itemName} (${p.quantity} ${p.unit})`,
          date: p.date,
        };
        const newTx = await api.addTransaction(targetShopId, t);
        expenseId = newTx.id;

        // Add to the local shopTransactions state
        setShopTransactions((prev) => ({
          ...prev,
          shop1: [newTx, ...prev.shop1],
          shop2: [newTx, ...prev.shop2],
        }));
      }

      // Now create the purchase with the expenseId linked!
      const purchaseWithExpense: Omit<Purchase, "id"> = {
        ...p,
        expenseId: expenseId,
      };

      const newP = await api.addPurchase(targetShopId, purchaseWithExpense as Purchase);
      setShopPurchases((prev) => ({
        ...prev,
        shop1: [newP, ...prev.shop1],
        shop2: [newP, ...prev.shop2],
      }));

      // Reload stock to reflect inventory adjustments
      const updatedStock = await api.getStock(targetShopId);
      setShopStock((prev) => ({ ...prev, [targetShopId]: updatedStock }));
    } catch (error) {
      console.error("Failed to save purchase:", error);
    }
  }

  async function deletePurchase(id: string, targetShopId: ShopId = activeShop) {
    try {
      // Find the purchase to check if it has an expenseId
      const targetShopPurchases = shopPurchases[targetShopId] || [];
      const purchaseToDelete = targetShopPurchases.find((p) => p.id === id);

      if (purchaseToDelete && purchaseToDelete.expenseId) {
        // If it has an expenseId, delete the transaction, which deletes the purchase too
        await deleteTransaction(purchaseToDelete.expenseId, "expense", targetShopId);
      } else {
        // If no expenseId, delete the purchase only
        await api.deletePurchase(targetShopId, id);
        setShopPurchases((prev) => ({
          ...prev,
          shop1: prev.shop1.filter((p) => p.id !== id),
          shop2: prev.shop2.filter((p) => p.id !== id),
        }));
        // Reload stock to reflect inventory adjustments
        const updatedStock = await api.getStock(targetShopId);
        setShopStock((prev) => ({ ...prev, [targetShopId]: updatedStock }));
      }
    } catch (error) {
      console.error("Failed to delete purchase:", error);
    }
  }

  async function addCommitment(c: Commitment) {
    try {
      const newC = await api.addCommitment(activeShop, c);
      setCommitments((prev) => [...prev, newC]);
    } catch (error) {
      console.error("Failed to add commitment:", error);
    }
  }

  async function deleteCommitment(id: string) {
    try {
      await api.deleteCommitment(activeShop, id);
      setCommitments((prev) => prev.filter((c) => c.id !== id));
      setCommitmentPayments((prev) => prev.filter((p) => p.commitmentId !== id));
      setAllCommitmentPayments((prev) => prev.filter((p) => p.commitmentId !== id));
    } catch (error) {
      console.error("Failed to delete commitment:", error);
    }
  }

  async function markCommitmentPaid(p: CommitmentPayment) {
    try {
      const newP = await api.payCommitment(activeShop, p.commitmentId, p);
      setCommitmentPayments((prev) => {
        const idx = prev.findIndex((x) => x.id === newP.id);
        if (idx >= 0) {
          // Replace existing (updated partials)
          const updated = [...prev];
          updated[idx] = newP;
          return updated;
        }
        return [newP, ...prev];
      });
      setAllCommitmentPayments((prev) => {
        const idx = prev.findIndex((x) => x.id === newP.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newP;
          return updated;
        }
        return [newP, ...prev];
      });
    } catch (error) {
      console.error("Failed to pay commitment:", error);
    }
  }

  async function deleteCommitmentPartialPayment(commitmentId: string, partialId: string, monthKey: string) {
    try {
      const updated = await api.deleteCommitmentPartialPayment(activeShop, commitmentId, partialId, monthKey);
      setCommitmentPayments((prev) => {
        if (!updated) {
          // All partials removed — remove the whole payment entry
          return prev.filter((p) => !(p.commitmentId === commitmentId && p.monthKey === monthKey));
        }
        return prev.map((p) => (p.commitmentId === commitmentId && p.monthKey === monthKey ? updated : p));
      });
      setAllCommitmentPayments((prev) => {
        if (!updated) {
          return prev.filter((p) => !(p.commitmentId === commitmentId && p.monthKey === monthKey));
        }
        return prev.map((p) => (p.commitmentId === commitmentId && p.monthKey === monthKey ? updated : p));
      });
    } catch (error) {
      console.error("Failed to delete partial payment:", error);
    }
  }

  function toggleStockItem(itemName: string) {
    setShopStockList((prev) => {
      const current = prev[activeShop][itemName] ?? "none";
      const next: StockStatus =
        current === "none" ? "in-stock" : current === "in-stock" ? "wanted" : "none";
      return {
        ...prev,
        [activeShop]: { ...prev[activeShop], [itemName]: next },
      };
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

  async function updateStock(items: StockItem[]) {
    const currentList = shopStock[activeShop] || [];

    // Check if item was added
    if (items.length > currentList.length) {
      const addedItem = items.find((i) => !currentList.some((c) => c.id === i.id));
      if (addedItem) {
        try {
          const newS = await api.addStockItem(activeShop, addedItem);
          setShopStock((prev) => ({
            ...prev,
            [activeShop]: [...prev[activeShop], newS],
          }));
        } catch (error) {
          console.error("Failed to add stock item:", error);
        }
      }
      return;
    }

    // Check if item was deleted
    if (items.length < currentList.length) {
      const deletedItem = currentList.find((c) => !items.some((i) => i.id === c.id));
      if (deletedItem) {
        try {
          await api.deleteStockItem(activeShop, deletedItem.id);
          setShopStock((prev) => ({
            ...prev,
            [activeShop]: prev[activeShop].filter((s) => s.id !== deletedItem.id),
          }));
        } catch (error) {
          console.error("Failed to delete stock item:", error);
        }
      }
      return;
    }

    // Check if item was modified
    const changedItem = items.find((item) => {
      const original = currentList.find((o) => o.id === item.id);
      return !original || JSON.stringify(original) !== JSON.stringify(item);
    });

    if (changedItem) {
      try {
        const updated = await api.updateStockItem(activeShop, changedItem.id, changedItem);
        setShopStock((prev) => ({
          ...prev,
          [activeShop]: prev[activeShop].map((s) => (s.id === changedItem.id ? updated : s)),
        }));
      } catch (error) {
        console.error("Failed to update stock item:", error);
      }
    } else {
      setShopStock((prev) => ({ ...prev, [activeShop]: items }));
    }
  }

  // Personal Expenses handlers
  async function handleAddPersonal(p: Omit<PersonalExpense, "id">) {
    try {
      const newP = await api.addPersonalExpense(p);
      setPersonalExpenses((prev) => [newP, ...prev]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeletePersonal(id: string) {
    try {
      await api.deletePersonalExpense(id);
      setPersonalExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  // Debt handlers
  async function handleAddDebt(d: Omit<Debt, "id" | "payments" | "remainingAmount" | "status">) {
    try {
      const newD = await api.addDebt(d);
      setDebts((prev) => [newD, ...prev]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePayDebt(id: string, amount: number, date: string, description: string, paymentMethod?: string) {
    try {
      const updatedD = await api.payDebt(id, amount, date, description, paymentMethod);
      setDebts((prev) => prev.map((d) => (d.id === id ? updatedD : d)));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteDebt(id: string) {
    try {
      await api.deleteDebt(id);
      setDebts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteDebtPayment(debtId: string, paymentId: string) {
    try {
      const updatedD = await api.deleteDebtPayment(debtId, paymentId);
      setDebts((prev) => prev.map((d) => (d.id === debtId ? updatedD : d)));
      // Trigger update of ledger and active transactions too
      const txns = await api.getTransactions(activeShop);
      setShopTransactions((prev) => ({ ...prev, [activeShop]: txns }));
    } catch (err) {
      console.error(err);
    }
  }

  // Staff Attendance handlers
  async function handleAddStaff(s: Omit<Staff, "id">) {
    try {
      const newS = await api.addStaff(s);
      setStaffList((prev) => [...prev, newS]);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteStaff(id: string) {
    try {
      await api.deleteStaff(id);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
      setSalaryPayments((prev) => prev.filter((p) => p.staffId !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpdateStaff(id: string, s: Partial<Staff> & { effectiveDate?: string }) {
    try {
      const updatedS = await api.updateStaff(id, s as any);
      setStaffList((prev) => prev.map((item) => (item.id === id ? updatedS : item)));
    } catch (err) {
      console.error(err);
    }
  }


  async function handleSaveAttendance(staffId: string, date: string, status: "present" | "absent" | "half-day") {
    try {
      const record = await api.saveAttendance(staffId, date, status);
      setAttendanceRecords((prev) => {
        const filtered = prev.filter(
          (r) =>
            r.staffId !== staffId ||
            new Date(r.date).toISOString().split("T")[0] !== date
        );
        return [record, ...filtered];
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePaySalary(p: Omit<SalaryPayment, "id">) {
    try {
      const newP = await api.paySalary(p);
      setSalaryPayments((prev) => [newP, ...prev]);
    } catch (err) {
      console.error("Failed to pay salary:", err);
    }
  }

  async function handleDeleteSalaryPayment(id: string) {
    try {
      await api.deleteSalaryPayment(id);
      setSalaryPayments((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete salary payment:", err);
    }
  }

  async function handleQuickIncomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickIncAmount) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "income",
      paymentMethod: quickIncPayment,
      amount: Math.abs(parseFloat(quickIncAmount)),
      category: "Full Day Income",
      description: quickIncDesc || "Full Day Sales",
      date: new Date(quickIncDate),
    };

    await addTransaction(transaction, quickIncShop);

    setQuickIncAmount("");
    setQuickIncDesc("");
    setQuickIncDate(new Date().toISOString().split("T")[0]);
    setShowQuickIncome(false);
  }

  async function handleQuickExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickExpAmount) return;

    const isInventoryCategory = !!PURCHASE_ITEMS[quickExpCategory as PurchaseCategory];
    const amountVal = Math.abs(parseFloat(quickExpAmount));

    const finalItemName = isInventoryCategory 
      ? (quickExpDesc.trim() || quickExpCategory) 
      : (quickExpDesc.trim() || "Shop Expense");

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "expense",
      paymentMethod: quickExpPayment,
      amount: amountVal,
      category: quickExpCategory || "Miscellaneous",
      description: isInventoryCategory 
        ? `Purchase: ${finalItemName} (${quickExpQty || 1} ${quickExpUnit})` 
        : finalItemName,
      date: new Date(quickExpDate),
    };

    let purchasePayloads = undefined;
    if (isInventoryCategory) {
      purchasePayloads = [{
        itemName: finalItemName,
        category: quickExpCategory as PurchaseCategory,
        quantity: parseFloat(quickExpQty) || 1,
        unit: quickExpUnit || "pcs",
        price: amountVal,
        date: new Date(quickExpDate),
      }];
    }

    await addTransaction(transaction, activeShop, purchasePayloads);

    setQuickExpAmount("");
    setQuickExpCategory("");
    setQuickExpDesc("");
    setQuickExpQty("");
    setQuickExpUnit("pcs");
    setQuickExpDate(new Date().toISOString().split("T")[0]);
    setQuickExpCustomItem(false);
    setShowQuickExpense(false);
  }

  async function handleQuickPersonalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quickPersAmount || !quickPersDesc) return;

    await handleAddPersonal({
      amount: Math.abs(parseFloat(quickPersAmount)),
      category: quickPersCategory,
      description: quickPersDesc,
      date: new Date(quickPersDate),
      paymentMethod: quickPersPayment,
    });

    setQuickPersAmount("");
    setQuickPersDesc("");
    setQuickPersCategory("Home");
    setQuickPersPayment("cash");
    setQuickPersDate(new Date().toISOString().split("T")[0]);
    setShowQuickPersonal(false);
  }

  // Seeding/Reset DB API callbacks
  async function handleResetDatabase() {
    const token = localStorage.getItem("jsf_token") || sessionStorage.getItem("jsf_token") || "";
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Reset failed");
    window.location.reload();
  }

  async function handleSeedDatabase() {
    const token = localStorage.getItem("jsf_token") || sessionStorage.getItem("jsf_token") || "";
    const response = await fetch("/api/auth/seed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Seed failed");
    window.location.reload();
  }

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

  // Compute all wanted items for the global reminder (preset + custom)
  const allWantedItems = useMemo(() => {
    const sl = shopStockList[activeShop];
    const preset = Object.keys(sl).filter((n) => sl[n] === "wanted");
    const custom = (shopCustomItems[activeShop] || []).filter((n) => sl[n] === "wanted");
    return [...preset, ...custom];
  }, [shopStockList, shopCustomItems, activeShop]);

  // Compute reminders across BOTH shops
  const allReminders = useMemo(() => {
    const out: { shopId: ShopId; item: StockItem }[] = [];
    const low: { shopId: ShopId; item: StockItem }[] = [];
    const wanted: { shopId: ShopId; item: StockItem }[] = [];
    (Object.keys(SHOPS) as ShopId[]).forEach((sid) => {
      (shopStock[sid] || []).forEach((item) => {
        const st = stockStatus(item);
        if (st === "out") out.push({ shopId: sid, item });
        else if (st === "low") low.push({ shopId: sid, item });
        if (item.wanted) wanted.push({ shopId: sid, item });
      });
    });
    return { out, low, wanted };
  }, [shopStock]);

  const totalAlerts =
    allReminders.out.length + allReminders.low.length + allReminders.wanted.length;
  const urgentCount = allReminders.out.length;

  // Stock counts for the active shop (for tab badge)
  const activeStockAlerts = useMemo(() => {
    const items = shopStock[activeShop] || [];
    return {
      out: items.filter((i) => stockStatus(i) === "out").length,
      low: items.filter((i) => stockStatus(i) === "low").length,
      wanted: items.filter((i) => i.wanted).length,
    };
  }, [shopStock, activeShop]);

  // Map salary list for reports
  const salaryReportList = useMemo(() => {
    const currentMonth = `${new Date().getFullYear()}-${String(
      new Date().getMonth() + 1
    ).padStart(2, "0")}`;
    const report: { staffName: string; calculatedSalary: number }[] = [];

    staffList.forEach((s) => {
      // Find present days in activeMonth
      const [y, m] = currentMonth.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);

      const presentDays = attendanceRecords.filter(
        (r) =>
          r.staffId === s.id &&
          r.status === "present" &&
          r.date >= start &&
          r.date < end
      ).length;

      const halfDays = attendanceRecords.filter(
        (r) =>
          r.staffId === s.id &&
          r.status === "half-day" &&
          r.date >= start &&
          r.date < end
      ).length;

      report.push({
        staffName: s.name,
        calculatedSalary: (presentDays + halfDays * 0.5) * s.dailyWage,
      });
    });
    return report;
  }, [staffList, attendanceRecords]);

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
    <div className="min-h-screen bg-background font-[Plus_Jakarta_Sans,sans-serif] relative">
      {/* Full-screen semi-transparent background watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.15] select-none" aria-hidden="true">
        <img
          src="/logo.png"
          alt=""
          className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] object-contain filter grayscale dark:invert"
        />
      </div>
      {/* Header */}
      <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-border bg-card shadow-sm gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <img
            src="/logo.png"
            alt="Trending Thamila Logo"
            className="w-9 h-9 rounded-xl object-cover border-2"
            style={{ borderColor: shop.color }}
          />
          <div className="hidden sm:block">
            <h1 className="text-base font-bold leading-tight">Trending Thamila Finance</h1>
            <p className="text-xs text-muted-foreground">{shop.name}</p>
          </div>
        </div>

        {/* Global Executive Roster Navigation */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto max-w-[70%] flex-shrink-0">
          <button
            onClick={() => setMainView("dashboard")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "dashboard"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <LayoutDashboard size={13} /> Dashboard
          </button>
          <button
            onClick={() => setMainView("sales")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "sales"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <BadgeCent size={13} /> Sales
          </button>
          <button
            onClick={() => setMainView("purchases")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "purchases"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <ShoppingCart size={13} /> Purchases
          </button>
          <button
            onClick={() => setMainView("commitments")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "commitments"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <ClipboardList size={13} /> Commitments
          </button>
          <button
            onClick={() => setMainView("personal")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "personal"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <HeartHandshake size={13} /> Personal
          </button>
          <button
            onClick={() => setMainView("debt")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "debt"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <ShieldAlert size={13} /> Debt
          </button>
          <button
            onClick={() => setMainView("attendance")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "attendance"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Users size={13} /> Attendance
          </button>
          <button
            onClick={() => setMainView("reports")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "reports"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <ChartPie size={13} /> Reports
          </button>
          <button
            onClick={() => setMainView("settings")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "settings"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Settings size={13} /> Settings
          </button>
          <button
            onClick={() => setMainView("stock")}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${mainView === "stock"
                ? "bg-card shadow-sm text-foreground font-black"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Boxes size={13} /> Stock
            {activeStockAlerts.out + activeStockAlerts.low > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
                {activeStockAlerts.out + activeStockAlerts.low}
              </span>
            )}
          </button>
        </div>

        {/* Bell Alerts */}
        <div className="relative flex-shrink-0" ref={bellRef}>
          <button
            onClick={() => setShowBell((v) => !v)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${showBell
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
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
                      <span className="text-xs font-bold text-destructive uppercase tracking-wide">
                        Out of Stock
                      </span>
                      <span className="ml-auto text-xs font-bold text-destructive">
                        {allReminders.out.length}
                      </span>
                    </div>
                    {allReminders.out.map(({ shopId, item }) => (
                      <div
                        key={`out-${shopId}-${item.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 border-b border-border/50"
                      >
                        <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {SHOPS[shopId].emoji} {SHOPS[shopId].name.split("—")[0].trim()}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-destructive font-[DM_Mono,monospace]">
                          0 {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Stock */}
                {allReminders.low.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
                      <AlertCircle size={13} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                        Low Stock
                      </span>
                      <span className="ml-auto text-xs font-bold text-amber-700">
                        {allReminders.low.length}
                      </span>
                    </div>
                    {allReminders.low.map(({ shopId, item }) => (
                      <div
                        key={`low-${shopId}-${item.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 border-b border-border/50"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {SHOPS[shopId].emoji} {SHOPS[shopId].name.split("—")[0].trim()}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-amber-700 font-[DM_Mono,monospace]">
                          {item.currentQty % 1 === 0 ? item.currentQty : item.currentQty.toFixed(1)}{" "}
                          {item.unit}
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
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                        Wanted to Buy
                      </span>
                      <span className="ml-auto text-xs font-bold text-amber-600">
                        {allReminders.wanted.length}
                      </span>
                    </div>
                    {allReminders.wanted.map(({ shopId, item }) => (
                      <div
                        key={`want-${shopId}-${item.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 border-b border-border/50"
                      >
                        <Star
                          size={12}
                          className="text-amber-400 flex-shrink-0"
                          fill="currentColor"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-muted-foreground">
                              {SHOPS[shopId].emoji}{" "}
                              {SHOPS[shopId].name.split("—")[0].trim()}
                            </p>
                            {item.wantedNote && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <p className="text-xs text-muted-foreground truncate font-medium">
                                  {item.wantedNote}
                                </p>
                              </>
                            )}
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
                  onClick={() => {
                    setMainView("stock");
                    setShowBell(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={12} /> Go to Stock List
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Urgent Alert Banner */}
      {urgentCount > 0 && !dismissedBanner && (
        <div className="bg-destructive text-white px-4 py-2.5 flex items-center gap-3">
          <CircleAlert size={15} className="flex-shrink-0" />
          <p className="text-sm font-semibold flex-1">
            {urgentCount} item{urgentCount > 1 ? "s are" : " is"} out of stock across your shops —{" "}
            <button
              onClick={() => {
                setMainView("stock");
                setDismissedBanner(true);
              }}
              className="underline underline-offset-2 hover:opacity-80 font-bold"
            >
              check stock list
            </button>
          </p>
          <button
            onClick={() => setDismissedBanner(true)}
            className="text-white/70 hover:text-white transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Shop tabs (only shown if viewing shop-specific data) */}
      {(mainView === "sales" ||
        mainView === "purchases" ||
        mainView === "commitments" ||
        mainView === "stock") && (
          <div className="bg-card border-b border-border px-6">
            <div className="flex gap-0 max-w-6xl mx-auto">
              {(Object.keys(SHOPS) as ShopId[]).map((sid) => {
                const s = SHOPS[sid];
                const isActive = sid === activeShop;
                const shopOut = (shopStock[sid] || []).filter((i) => stockStatus(i) === "out").length;
                return (
                  <button
                    key={sid}
                    onClick={() => setActiveShop(sid)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${isActive
                        ? "border-current"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    style={isActive ? { color: s.color, borderColor: s.color } : {}}
                  >
                    <Store size={14} />
                    {s.name}
                    {shopOut > 0 && (
                      <span className="w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center font-[DM_Mono,monospace]">
                        {shopOut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      {/* Global Shopping lists reminder */}
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
                  style={{
                    backgroundColor: "#fbbf24",
                    color: "#78350f",
                    border: "1px solid #f59e0b",
                  }}
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
        {mainView === "dashboard" && (
          <DashboardView
            transactions={shopTransactions}
            personalExpenses={personalExpenses}
            debts={debts}
            salaryPayments={salaryPayments}
            commitments={commitments}
            commitmentPayments={allCommitmentPayments}
            purchases={shopPurchases}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onNavigateTo={setMainView}
            onSelectShop={setActiveShop}
            onDelete={deleteTransaction}
            onAddIncome={() => setShowQuickIncome(true)}
            onAddExpense={() => setShowQuickExpense(true)}
            onAddPersonal={() => setShowQuickPersonal(true)}
          />
        )}
        {mainView === "sales" && (
          <FinanceView
            shopId={activeShop}
            transactions={shopTransactions[activeShop] || []}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
        {mainView === "purchases" && (
          <PurchasesView
            shopId={activeShop}
            purchases={shopPurchases[activeShop] || []}
            onAdd={(p) => addPurchase(p, activeShop)}
            onDeletePurchase={(id) => deletePurchase(id, activeShop)}
            stockList={shopStockList[activeShop] || {}}
            onStockToggle={toggleStockItem}
            customItems={shopCustomItems[activeShop] || []}
            onAddCustomItem={addCustomStockItem}
            onRemoveCustomItem={removeCustomStockItem}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
        {mainView === "commitments" && (
          <CommitmentsView
            commitments={commitments}
            payments={allCommitmentPayments}
            onAddCommitment={addCommitment}
            onDeleteCommitment={deleteCommitment}
            onMarkPaid={markCommitmentPaid}
            onDeletePartialPayment={deleteCommitmentPartialPayment}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
        {mainView === "personal" && (
          <PersonalView
            expenses={personalExpenses}
            onAdd={handleAddPersonal}
            onDelete={handleDeletePersonal}
            selectedMonth={selectedMonth}
          />
        )}
        {mainView === "debt" && (
          <DebtView
            debts={debts}
            onAddDebt={handleAddDebt}
            onPayDebt={handlePayDebt}
            onDeleteDebt={handleDeleteDebt}
            onDeletePayment={handleDeleteDebtPayment}
          />
        )}
        {mainView === "attendance" && (
          <AttendanceView
            staffList={staffList}
            attendanceRecords={attendanceRecords}
            salaryPayments={salaryPayments}
            onAddStaff={handleAddStaff}
            onDeleteStaff={handleDeleteStaff}
            onUpdateStaff={handleUpdateStaff}
            onSaveAttendance={handleSaveAttendance}
            onPaySalary={handlePaySalary}
            onDeleteSalaryPayment={handleDeleteSalaryPayment}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
        {mainView === "reports" && (
          <ReportsView
            transactions={shopTransactions}
            purchases={shopPurchases}
            debts={debts}
            salaryReport={salaryReportList}
            personalExpenses={personalExpenses}
            selectedMonth={selectedMonth}
          />
        )}
        {mainView === "settings" && (
          <SettingsView
            onResetDatabase={handleResetDatabase}
            onSeedDatabase={handleSeedDatabase}
          />
        )}
        {mainView === "stock" && (
          <StockView
            shopId={activeShop}
            stock={shopStock[activeShop] || []}
            onUpdate={updateStock}
          />
        )}
      </main>

      {/* Floating Quick Entry FAB Button (Only on Dashboard) */}
      {mainView === "dashboard" && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
          {/* Quick Menu Options */}
          {showQuickEntry && (
            <div className="mb-3.5 flex flex-col gap-3 items-end transition-all duration-200">
              <button
                onClick={() => {
                  setShowQuickIncome(true);
                  setShowQuickEntry(false);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-full px-5 py-2.5 text-xs font-extrabold shadow-xl border border-emerald-600/35 hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                💵 Quick Income Entry
              </button>
              <button
                onClick={() => {
                  setShowQuickExpense(true);
                  setShowQuickEntry(false);
                }}
                className="bg-amber-700 hover:bg-amber-800 text-white rounded-full px-5 py-2.5 text-xs font-extrabold shadow-xl border border-amber-600/35 hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                💸 Quick Expense Entry
              </button>
              <button
                onClick={() => {
                  setShowQuickPersonal(true);
                  setShowQuickEntry(false);
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-full px-5 py-2.5 text-xs font-extrabold shadow-xl border border-purple-600/35 hover:scale-105 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                💜 Quick Personal Entry
              </button>
            </div>
          )}

          {/* Main FAB Circle Button */}
          <button
            onClick={() => setShowQuickEntry((v) => !v)}
            className="w-16 h-16 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none border-2 border-white/20 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #047857 0%, #064e3b 100%)",
            }}
          >
            <Plus
              size={28}
              className={`transform transition-transform duration-300 ${showQuickEntry ? "rotate-45" : ""
                }`}
            />
          </button>
        </div>
      )}

      {/* Quick Income Entry Modal */}
      {showQuickIncome && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Quick Income Entry</h3>
                <p className="text-xs text-muted-foreground">Log incoming sales for either branch</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickIncome(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickIncomeSubmit} className="p-5 space-y-4">
              {/* Branch Shop selection */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Shop Branch</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickIncShop("shop1")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${quickIncShop === "shop1"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-400"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                  >
                    🥤 Theppakulam Shop
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickIncShop("shop2")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${quickIncShop === "shop2"
                        ? "bg-sky-50 text-sky-800 border-sky-400"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                  >
                    🍹 Anuppanadi Shop
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickIncPayment("cash")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${quickIncPayment === "cash"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-muted text-muted-foreground border-transparent"
                      }`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickIncPayment("gpay")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${quickIncPayment === "gpay"
                        ? "bg-sky-50 text-sky-700 border-sky-300"
                        : "bg-muted text-muted-foreground border-transparent"
                      }`}
                  >
                    <Smartphone size={14} /> GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickIncPayment("zomato")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${quickIncPayment === "zomato"
                        ? "bg-orange-50 text-orange-600 border-orange-300"
                        : "bg-muted text-muted-foreground border-transparent"
                      }`}
                  >
                    <Flame size={14} /> Zomato
                  </button>
                </div>
              </div>

              {/* Amount (₹) */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={quickIncAmount}
                  onChange={(e) => setQuickIncAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Income"
                  value={quickIncDesc}
                  onChange={(e) => setQuickIncDesc(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  value={quickIncDate}
                  onChange={(e) => setQuickIncDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!quickIncAmount || parseFloat(quickIncAmount) <= 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:opacity-90 disabled:opacity-40 transition-all shadow-md"
              >
                Save Income
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Expense Entry Modal */}
      {showQuickExpense && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Quick Expense Entry</h3>
                <p className="text-xs text-muted-foreground">Log standard outgoing shop expenditures</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickExpense(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickExpenseSubmit} className="p-5 space-y-4">
              {/* Category */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                <select
                  value={quickExpCategory}
                  onChange={(e) => {
                    setQuickExpCategory(e.target.value);
                    setQuickExpDesc("");
                  }}
                  required
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select category...</option>
                  <option value="Fruits & Vegetables">Fruits & Vegetables</option>
                  <option value="Packaging & Plastics">Packaging & Plastics</option>
                  <option value="Other Supplies">Other Supplies</option>
                  <option value="Ice Cream">Ice Cream</option>
                  <option value="Dry Fruits">Dry Fruits</option>
                  <option value="Cleaning Utility">Cleaning Utility</option>
                  <option value="Essence">Essence</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Utilities">Shop Utilities</option>
                  <option value="Staff Wages">Staff Wages</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              {/* Item Selection (Shown only for Inventory Categories) */}
              {quickExpCategory && PURCHASE_ITEMS[quickExpCategory as PurchaseCategory] && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-muted-foreground">Item</label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickExpCustomItem(!quickExpCustomItem);
                          setQuickExpDesc("");
                        }}
                        className="text-xs text-primary font-medium hover:underline cursor-pointer"
                      >
                        {quickExpCustomItem ? "Pick from list" : "+ Custom item"}
                      </button>
                    </div>
                    {quickExpCustomItem ? (
                      <input
                        type="text"
                        placeholder="e.g. Essence Bulk"
                        value={quickExpDesc}
                        onChange={(e) => setQuickExpDesc(e.target.value)}
                        className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    ) : (
                      <select
                        value={PURCHASE_ITEMS[quickExpCategory as PurchaseCategory].some(i => i.name === quickExpDesc) ? quickExpDesc : ""}
                        onChange={(e) => {
                          if (e.target.value) {
                            setQuickExpDesc(e.target.value);
                            // Set the default unit for this item
                            const matched = PURCHASE_ITEMS[quickExpCategory as PurchaseCategory]?.find(i => i.name === e.target.value);
                            if (matched) {
                              setQuickExpUnit(matched.unit);
                            }
                          } else {
                            setQuickExpDesc("");
                          }
                        }}
                        className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">Select item (Optional, defaults to category)...</option>
                        {PURCHASE_ITEMS[quickExpCategory as PurchaseCategory].map((item) => (
                          <option key={item.name} value={item.name}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Quantity and Unit Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Quantity</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={quickExpQty}
                        onChange={(e) => setQuickExpQty(e.target.value)}
                        className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Unit</label>
                      <select
                        value={quickExpUnit}
                        onChange={(e) => setQuickExpUnit(e.target.value as PurchaseUnit)}
                        className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {(["kg", "pcs", "packets", "liters", "dozen", "boxes"] as PurchaseUnit[]).map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickExpPayment("cash")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${quickExpPayment === "cash"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-muted text-muted-foreground border-transparent"
                      }`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickExpPayment("gpay")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${quickExpPayment === "gpay"
                        ? "bg-sky-50 text-sky-700 border-sky-300"
                        : "bg-muted text-muted-foreground border-transparent"
                      }`}
                  >
                    <Smartphone size={14} /> GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickExpPayment("zomato")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${quickExpPayment === "zomato"
                        ? "bg-orange-50 text-orange-600 border-orange-300"
                        : "bg-muted text-muted-foreground border-transparent"
                      }`}
                  >
                    <Flame size={14} /> Zomato
                  </button>
                </div>
              </div>

              {/* Amount (₹) */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={quickExpAmount}
                  onChange={(e) => setQuickExpAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Utility bill"
                  value={quickExpDesc}
                  onChange={(e) => setQuickExpDesc(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  value={quickExpDate}
                  onChange={(e) => setQuickExpDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={!quickExpAmount || parseFloat(quickExpAmount) <= 0}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-amber-700 hover:opacity-90 disabled:opacity-40 transition-all shadow-md"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Personal Entry Modal */}
      {showQuickPersonal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Quick Personal Entry</h3>
                <p className="text-xs text-muted-foreground">Log home or personal expenses</p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickPersonal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickPersonalSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickPersCategory("Home")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border ${
                      quickPersCategory === "Home"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    Home & Family
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickPersCategory("Personal Use")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border ${
                      quickPersCategory === "Personal Use"
                        ? "bg-purple-50 text-purple-700 border-purple-300"
                        : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                    }`}
                  >
                    Personal Use
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Payment Method</label>
                <div className="flex gap-2">
                  {(["cash", "gpay", "zomato"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setQuickPersPayment(method)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider ${
                        quickPersPayment === method
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={quickPersAmount}
                  onChange={(e) => setQuickPersAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Household grocery"
                  required
                  value={quickPersDesc}
                  onChange={(e) => setQuickPersDesc(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  required
                  value={quickPersDate}
                  onChange={(e) => setQuickPersDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={!quickPersAmount || !quickPersDesc}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-purple-700 hover:opacity-90 disabled:opacity-40 transition-all shadow-md cursor-pointer"
              >
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
