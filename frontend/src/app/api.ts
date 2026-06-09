import type {
  Transaction,
  Purchase,
  Commitment,
  CommitmentPayment,
  PartialPayment,
  StockItem,
  ShopId,
  TransactionType,
  PaymentMethod,
  PurchaseCategory,
  PurchaseUnit,
  PersonalExpense,
  Debt,
  Staff,
  AttendanceRecord,
  SalaryPayment,
} from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Helper to retrieve auth header
function getHeaders(shopId?: ShopId): HeadersInit {
  const token = localStorage.getItem("jsf_token") || sessionStorage.getItem("jsf_token") || "";
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (shopId) {
    headers["x-shop"] = shopId === "shop2" ? "Shop 2" : "Shop 1";
  }
  return headers;
}

// Translate Income/Expense to Transaction
function mapIncomeToTransaction(inc: any): Transaction {
  return {
    id: inc._id,
    type: "income",
    paymentMethod: inc.paymentMethod === "gpay" ? "gpay" : inc.paymentMethod === "zomato" ? "zomato" : "cash",
    amount: inc.amount,
    category: inc.category || "Fresh Juices",
    description: inc.description || "",
    date: new Date(inc.date),
  };
}

function mapExpenseToTransaction(exp: any): Transaction {
  return {
    id: exp._id,
    type: "expense",
    paymentMethod: exp.paymentMethod === "gpay" ? "gpay" : exp.paymentMethod === "zomato" ? "zomato" : "cash",
    amount: exp.amount,
    category: exp.type || "Miscellaneous",
    description: exp.description || "",
    date: new Date(exp.date),
  };
}

// Translate Purchase
function mapPurchaseToFrontend(p: any): Purchase {
  return {
    id: p._id,
    itemName: p.productName,
    category: p.category as PurchaseCategory,
    quantity: p.quantity,
    unit: p.unit as PurchaseUnit,
    pricePerUnit: p.pricePerUnit,
    totalPrice: p.totalAmount,
    date: new Date(p.purchaseDate),
    expenseId: p.expenseId || undefined,
  };
}

// Translate Commitment
function mapCommitmentToFrontend(c: any): Commitment {
  return {
    id: c._id,
    name: c.name,
    emoji: c.emoji || "🏪",
    amount: c.amount,
    dueDay: c.dueDay,
    color: c.color || "#7c3aed",
  };
}

// Translate CommitmentPayment
function mapCommitmentPaymentToFrontend(p: any): CommitmentPayment {
  return {
    id: p._id,
    commitmentId: p.commitmentId,
    monthKey: p.monthKey,
    paidAmount: p.paidAmount,
    paymentMethod: p.paymentMethod === "gpay" ? "gpay" : p.paymentMethod === "zomato" ? "zomato" : "cash",
    paidDate: new Date(p.paidDate),
    note: p.note || "",
    partialPayments: (p.partialPayments || []).map((pp: any): PartialPayment => ({
      id: pp._id,
      amount: pp.amount,
      paymentMethod: pp.paymentMethod === "gpay" ? "gpay" : pp.paymentMethod === "zomato" ? "zomato" : "cash",
      paidDate: new Date(pp.paidDate),
      note: pp.note || "",
    })),
  };
}

// Translate Inventory to StockItem
function mapStockToFrontend(i: any): StockItem {
  return {
    id: i._id,
    name: i.productName,
    category: (i.category || "Fruits & Vegetables") as PurchaseCategory,
    currentQty: i.remainingQty !== undefined ? i.remainingQty : i.availableQty || 0,
    unit: (i.unit || "kg") as PurchaseUnit,
    minThreshold: i.minStockLevel || 0,
    wanted: i.isWanted || false,
    wantedQty: 1,
    wantedNote: "",
  };
}

function mapPersonalToFrontend(p: any): PersonalExpense {
  return {
    id: p._id,
    amount: p.amount,
    category: p.category,
    description: p.description,
    date: new Date(p.date),
    paymentMethod: p.paymentMethod || "cash",
  };
}

function mapDebtToFrontend(d: any): Debt {
  return {
    id: d._id,
    debtName: d.debtName,
    creditorName: d.creditorName,
    originalAmount: d.originalAmount,
    remainingAmount: d.remainingAmount,
    dueDate: new Date(d.dueDate),
    payments: (d.payments || []).map((py: any) => ({
      id: py._id,
      amount: py.amount,
      date: new Date(py.date),
      description: py.description,
      paymentMethod: py.paymentMethod || "cash",
    })),
    status: d.status,
  };
}

function mapSalaryPaymentToFrontend(p: any): SalaryPayment {
  return {
    id: p._id,
    staffId: p.staffId,
    staffName: p.staffName,
    monthKey: p.monthKey,
    amount: p.amount,
    paymentMethod: p.paymentMethod || "cash",
    paidDate: new Date(p.paidDate),
    note: p.note || "",
  };
}

function mapStaffToFrontend(s: any): Staff {
  return {
    id: s._id,
    name: s.name,
    dailyWage: s.dailyWage,
    wageHistory: (s.wageHistory || []).map((h: any) => ({
      dailyWage: h.dailyWage,
      effectiveDate: h.effectiveDate,
    })),
  };
}

function mapAttendanceToFrontend(a: any): AttendanceRecord {
  return {
    id: a._id,
    staffId: a.staffId?._id || a.staffId,
    date: new Date(a.date),
    status: a.status,
  };
}


export const api = {
  // Auth API
  async login(password: string): Promise<{ success: boolean; token: string; email: string }> {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@jsfinance.com", password }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Login failed");
    return {
      success: true,
      token: result.token,
      email: result.user.email,
    };
  },

  // Finance API
  async getTransactions(shopId: ShopId): Promise<Transaction[]> {
    const [incRes, expRes] = await Promise.all([
      fetch(`${BASE_URL}/income?limit=1000`, { headers: getHeaders(shopId) }),
      fetch(`${BASE_URL}/expenses?limit=1000`, { headers: getHeaders(shopId) }),
    ]);
    const incJson = await incRes.json();
    const expJson = await expRes.json();

    const incomes = (incJson.data || []).map(mapIncomeToTransaction);
    const expenses = (expJson.data || []).map(mapExpenseToTransaction);

    return [...incomes, ...expenses].sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  async addTransaction(shopId: ShopId, t: Omit<Transaction, "id">): Promise<Transaction> {
    const url = t.type === "income" ? `${BASE_URL}/income` : `${BASE_URL}/expenses`;
    const payload = t.type === "income" ? {
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      category: t.category,
      description: t.description,
      date: t.date,
    } : {
      amount: t.amount,
      type: t.category,
      paymentMethod: t.paymentMethod,
      description: t.description,
      date: t.date,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: getHeaders(shopId),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to add entry");
    return t.type === "income" ? mapIncomeToTransaction(result.data) : mapExpenseToTransaction(result.data);
  },

  // Purchases API
  async getPurchases(shopId: ShopId): Promise<Purchase[]> {
    const response = await fetch(`${BASE_URL}/purchases?limit=1000`, { headers: getHeaders(shopId) });
    const result = await response.json();
    return (result.data || []).map(mapPurchaseToFrontend);
  },

  async addPurchase(shopId: ShopId, p: Omit<Purchase, "id">): Promise<Purchase> {
    const response = await fetch(`${BASE_URL}/purchases`, {
      method: "POST",
      headers: getHeaders(shopId),
      body: JSON.stringify({
        productName: p.itemName,
        quantity: p.quantity,
        unit: p.unit,
        pricePerUnit: p.pricePerUnit,
        category: p.category,
        purchaseDate: p.date,
        expenseId: p.expenseId || null,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to save purchase");
    return mapPurchaseToFrontend(result.data);
  },

  async deletePurchase(shopId: ShopId, id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: "DELETE",
      headers: getHeaders(shopId),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete purchase");
  },

  // Commitments API
  async getCommitments(shopId: ShopId, monthKey: string): Promise<{ commitments: Commitment[]; payments: CommitmentPayment[] }> {
    const response = await fetch(`${BASE_URL}/commitments?monthKey=${monthKey}`, { headers: getHeaders(shopId) });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to load commitments");
    
    const commitments: Commitment[] = [];
    const payments: CommitmentPayment[] = [];

    (result.data || []).forEach((c: any) => {
      commitments.push(mapCommitmentToFrontend(c));
      if (c.payment) {
        payments.push(mapCommitmentPaymentToFrontend(c.payment));
      }
    });

    return { commitments, payments };
  },

  async addCommitment(shopId: ShopId, c: Omit<Commitment, "id">): Promise<Commitment> {
    const response = await fetch(`${BASE_URL}/commitments`, {
      method: "POST",
      headers: getHeaders(shopId),
      body: JSON.stringify({
        name: c.name,
        emoji: c.emoji,
        amount: c.amount,
        dueDay: c.dueDay,
        color: c.color,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to add commitment");
    return mapCommitmentToFrontend(result.data);
  },

  async deleteCommitment(shopId: ShopId, id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/commitments/${id}`, {
      method: "DELETE",
      headers: getHeaders(shopId),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete commitment");
  },

  async payCommitment(shopId: ShopId, commitmentId: string, p: Omit<CommitmentPayment, "id">): Promise<CommitmentPayment> {
    const response = await fetch(`${BASE_URL}/commitments/${commitmentId}/pay`, {
      method: "POST",
      headers: getHeaders(shopId),
      body: JSON.stringify({
        monthKey: p.monthKey,
        paidAmount: p.paidAmount,
        paymentMethod: p.paymentMethod,
        paidDate: p.paidDate,
        note: p.note,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to save payment");
    return mapCommitmentPaymentToFrontend(result.data);
  },

  async deleteCommitmentPartialPayment(shopId: ShopId, commitmentId: string, partialId: string, monthKey: string): Promise<CommitmentPayment | null> {
    const response = await fetch(`${BASE_URL}/commitments/${commitmentId}/pay/${partialId}?monthKey=${monthKey}`, {
      method: "DELETE",
      headers: getHeaders(shopId),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete partial payment");
    return result.data ? mapCommitmentPaymentToFrontend(result.data) : null;
  },

  async getCommitmentHistory(shopId: ShopId, commitmentId: string): Promise<CommitmentPayment[]> {
    const response = await fetch(`${BASE_URL}/commitments/${commitmentId}/history`, { headers: getHeaders(shopId) });
    const result = await response.json();
    return (result.data || []).map(mapCommitmentPaymentToFrontend);
  },

  // Inventory/Stock API
  async getStock(shopId: ShopId): Promise<StockItem[]> {
    const response = await fetch(`${BASE_URL}/inventory`, { headers: getHeaders(shopId) });
    const result = await response.json();
    return (result.data || []).map(mapStockToFrontend);
  },

  async addStockItem(shopId: ShopId, s: Omit<StockItem, "id">): Promise<StockItem> {
    const response = await fetch(`${BASE_URL}/inventory`, {
      method: "POST",
      headers: getHeaders(shopId),
      body: JSON.stringify({
        productName: s.name,
        availableQty: s.currentQty,
        minStockLevel: s.minThreshold,
        category: s.category,
        unit: s.unit,
        isWanted: s.wanted,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to add stock item");
    return mapStockToFrontend(result.data);
  },

  async updateStockItem(shopId: ShopId, id: string, s: Partial<StockItem>): Promise<StockItem> {
    const payload: any = {};
    if (s.name !== undefined) payload.productName = s.name;
    if (s.currentQty !== undefined) payload.availableQty = s.currentQty; // Backend recalculates remainingQty
    if (s.minThreshold !== undefined) payload.minStockLevel = s.minThreshold;
    if (s.wanted !== undefined) payload.isWanted = s.wanted;
    if (s.category !== undefined) payload.category = s.category;
    if (s.unit !== undefined) payload.unit = s.unit;

    const response = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: "PUT",
      headers: getHeaders(shopId),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to update stock item");
    return mapStockToFrontend(result.data);
  },

  async deleteStockItem(shopId: ShopId, id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/inventory/${id}`, {
      method: "DELETE",
      headers: getHeaders(shopId),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete stock item");
  },

  // Personal Expenses API
  async getPersonalExpenses(from?: string, to?: string): Promise<PersonalExpense[]> {
    let url = `${BASE_URL}/personal`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    const response = await fetch(url, { headers: getHeaders() });
    const result = await response.json();
    return (result.data || []).map(mapPersonalToFrontend);
  },

  async addPersonalExpense(p: Omit<PersonalExpense, "id">): Promise<PersonalExpense> {
    const response = await fetch(`${BASE_URL}/personal`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(p),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to add personal expense");
    return mapPersonalToFrontend(result.data);
  },

  async deletePersonalExpense(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/personal/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete personal expense");
  },

  // Debt API
  async getDebts(): Promise<Debt[]> {
    const response = await fetch(`${BASE_URL}/debts`, { headers: getHeaders() });
    const result = await response.json();
    return (result.data || []).map(mapDebtToFrontend);
  },

  async addDebt(d: Omit<Debt, "id" | "payments" | "remainingAmount" | "status">): Promise<Debt> {
    const response = await fetch(`${BASE_URL}/debts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(d),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to create debt");
    return mapDebtToFrontend(result.data);
  },

  async payDebt(id: string, amount: number, date: string, description: string, paymentMethod?: string): Promise<Debt> {
    const response = await fetch(`${BASE_URL}/debts/${id}/pay`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ amount, date, description, paymentMethod: paymentMethod || "cash" }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to submit partial payment");
    return mapDebtToFrontend(result.data);
  },

  async deleteDebt(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/debts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete debt record");
  },

  async deleteDebtPayment(debtId: string, paymentId: string): Promise<Debt> {
    const response = await fetch(`${BASE_URL}/debts/${debtId}/payments/${paymentId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete payment record");
    return mapDebtToFrontend(result.data);
  },

  // Staff & Attendance API
  async getStaff(): Promise<Staff[]> {
    const response = await fetch(`${BASE_URL}/attendance/staff`, { headers: getHeaders() });
    const result = await response.json();
    return (result.data || []).map(mapStaffToFrontend);
  },

  async addStaff(s: Omit<Staff, "id">): Promise<Staff> {
    const response = await fetch(`${BASE_URL}/attendance/staff`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(s),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to create staff member");
    return mapStaffToFrontend(result.data);
  },

  async updateStaff(id: string, s: Partial<Staff>): Promise<Staff> {
    const response = await fetch(`${BASE_URL}/attendance/staff/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(s),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to update staff member");
    return mapStaffToFrontend(result.data);
  },

  async deleteStaff(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/attendance/staff/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete staff member");
  },

  async getAttendance(from?: string, to?: string): Promise<AttendanceRecord[]> {
    let url = `${BASE_URL}/attendance`;
    const params: string[] = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length > 0) url += `?${params.join("&")}`;

    const response = await fetch(url, { headers: getHeaders() });
    const result = await response.json();
    return (result.data || []).map(mapAttendanceToFrontend);
  },

  async saveAttendance(staffId: string, date: string, status: "present" | "absent" | "half-day"): Promise<AttendanceRecord> {
    const response = await fetch(`${BASE_URL}/attendance`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ staffId, date, status }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to log attendance");
    return mapAttendanceToFrontend(result.data);
  },

  async getSalaryReport(monthKey: string): Promise<any[]> {
    const response = await fetch(`${BASE_URL}/attendance/salary?monthKey=${monthKey}`, { headers: getHeaders() });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to retrieve salary report");
    return (result.data || []).map((r: any) => ({
      ...r,
      staff: mapStaffToFrontend(r.staff)
    }));
  },

  async deleteTransaction(shopId: ShopId, id: string, type: TransactionType): Promise<void> {
    const url = type === "income" ? `${BASE_URL}/income/${id}` : `${BASE_URL}/expenses/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: getHeaders(shopId),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete entry");
  },

  async getSalaryPayments(monthKey?: string): Promise<SalaryPayment[]> {
    let url = `${BASE_URL}/attendance/salaries/payments`;
    if (monthKey) url += `?monthKey=${monthKey}`;
    const response = await fetch(url, { headers: getHeaders() });
    const result = await response.json();
    return (result.data || []).map(mapSalaryPaymentToFrontend);
  },

  async paySalary(p: Omit<SalaryPayment, "id">): Promise<SalaryPayment> {
    const response = await fetch(`${BASE_URL}/attendance/salaries/pay`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        staffId: p.staffId,
        staffName: p.staffName,
        monthKey: p.monthKey,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paidDate: p.paidDate,
        note: p.note,
      }),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to pay salary");
    return mapSalaryPaymentToFrontend(result.data);
  },

  async deleteSalaryPayment(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/attendance/salaries/payments/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || "Failed to delete salary record");
  },
};
