import { useState, useMemo } from "react";
import { Plus, X, HandCoins, AlertCircle, Banknote, Calendar, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, Smartphone, Flame } from "lucide-react";
import type { Debt, PaymentMethod } from "../types";
import { fmt, fmtShort } from "../utils";

interface DebtViewProps {
  debts: Debt[];
  onAddDebt: (d: Omit<Debt, "id" | "payments" | "remainingAmount" | "status">) => void;
  onPayDebt: (id: string, amount: number, date: string, description: string, paymentMethod: PaymentMethod) => void;
  onDeleteDebt: (id: string) => void;
  onDeletePayment: (debtId: string, paymentId: string) => void;
}

export function DebtView({ debts, onAddDebt, onPayDebt, onDeleteDebt, onDeletePayment }: DebtViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [activeDebtId, setActiveDebtId] = useState<string | null>(null);

  // New Debt Form
  const [debtName, setDebtName] = useState("");
  const [creditorName, setCreditorName] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Pay Debt Form
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payDesc, setPayDesc] = useState("Partial Payment");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("gpay");

  // Accordion state to see payment history
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let outstanding = 0;
    let originalTotal = 0;
    let settledTotal = 0;

    debts.forEach((d) => {
      originalTotal += d.originalAmount;
      outstanding += d.remainingAmount;
      settledTotal += (d.originalAmount - d.remainingAmount);
    });

    return { outstanding, originalTotal, settledTotal };
  }, [debts]);

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!debtName || !creditorName || !originalAmount || !dueDate) return;

    onAddDebt({
      debtName,
      creditorName,
      originalAmount: parseFloat(originalAmount),
      dueDate: new Date(dueDate),
    });

    setDebtName("");
    setCreditorName("");
    setOriginalAmount("");
    setDueDate("");
    setShowAddForm(false);
  }

  function handlePaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDebtId || !payAmount) return;

    onPayDebt(
      activeDebtId,
      parseFloat(payAmount),
      payDate,
      payDesc,
      payMethod
    );

    setPayAmount("");
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayDesc("Partial Payment");
    setPayMethod("gpay");
    setShowPayForm(false);
    setActiveDebtId(null);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="space-y-1">
          <span className="bg-teal-600/40 text-teal-300 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-teal-500/20">
            Debt Management & Liabilities
          </span>
          <h2 className="text-xl font-bold tracking-tight">Accounts Payable & Debts</h2>
          <p className="text-teal-100/70 text-xs max-w-md">
            Track business loans, credit accounts, and partial payment history securely in one dashboard.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-teal-900 hover:bg-teal-50 transition-all shadow-md"
        >
          <Plus size={14} /> Add Debt Record
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Outstanding Debt</p>
            <p className="text-xl font-black text-red-600 font-[DM_Mono,monospace]">
              {fmt(stats.outstanding)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Settled Balance</p>
            <p className="text-xl font-black text-emerald-800 font-[DM_Mono,monospace]">
              {fmt(stats.settledTotal)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0">
            <HandCoins size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Original Debt Total</p>
            <p className="text-xl font-black text-teal-800 font-[DM_Mono,monospace]">
              {fmt(stats.originalTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Debts Grid */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground">Registered Liabilities & Loans</h3>

        {debts.length === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-10 font-medium">
            No debts registered in database. Great job!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {debts.map((d) => {
              const pct = Math.round((d.remainingAmount / d.originalAmount) * 100);
              const isExpanded = expandedDebtId === d.id;

              return (
                <div
                  key={d.id}
                  className={`border border-border/70 rounded-2xl overflow-hidden transition-all bg-card flex flex-col justify-between h-full shadow-sm hover:shadow-md hover:border-border/100 ${
                    d.status === "paid" ? "opacity-75 bg-muted/10" : ""
                  }`}
                >
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Top Row: Title, Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <span className="text-sm font-bold text-foreground block truncate" title={d.debtName}>
                          {d.debtName}
                        </span>
                        <p className="text-[10px] text-muted-foreground truncate">
                          Creditor: <span className="font-semibold text-foreground">{d.creditorName}</span>
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border flex-shrink-0 ${
                          d.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse"
                        }`}
                      >
                        {d.status === "paid" ? "Fully Paid" : "Pending"}
                      </span>
                    </div>

                    {/* Financial details row */}
                    <div className="grid grid-cols-3 gap-2 bg-muted/30 p-3 rounded-xl border border-border/30">
                      <div>
                        <p className="text-[8px] text-muted-foreground font-extrabold uppercase tracking-wide">Original</p>
                        <p className="text-xs font-bold text-foreground font-[DM_Mono] mt-0.5">{fmt(d.originalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground font-extrabold uppercase tracking-wide">Remaining</p>
                        <p className="text-xs font-bold text-red-600 font-[DM_Mono] mt-0.5">{fmt(d.remainingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground font-extrabold uppercase tracking-wide">Due Date</p>
                        <p className="text-[10px] font-bold text-foreground mt-0.5 truncate" title={d.dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}>
                          {d.dueDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons and controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpandedDebtId(isExpanded ? null : d.id)}
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors flex items-center gap-1 text-[10px] font-medium"
                          title="View Payment Logs"
                        >
                          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          Logs ({d.payments.length})
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this debt record?")) {
                              onDeleteDebt(d.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors text-[10px] font-medium"
                        >
                          Delete
                        </button>
                      </div>

                      {d.status !== "paid" && (
                        <button
                          onClick={() => {
                            setActiveDebtId(d.id);
                            setShowPayForm(true);
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                        >
                          Pay Debt
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-muted w-full">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${100 - pct}%`,
                        backgroundColor: d.status === "paid" ? "#10b981" : "#f59e0b",
                      }}
                    />
                  </div>

                  {/* Expanded payment logs (date-wise partial payment history) */}
                  {isExpanded && (
                    <div className="bg-muted/40 p-4 border-t border-border/50 text-xs space-y-3">
                      <p className="font-bold text-[9px] text-muted-foreground uppercase tracking-wider">
                        Payment History Log
                      </p>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {d.payments.length === 0 ? (
                          <p className="text-muted-foreground italic py-2 text-[10px]">
                            No payments logged yet for this debt.
                          </p>
                        ) : (
                          d.payments.map((py, idx) => (
                            <div
                              key={py.id || idx}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 text-[11px] gap-2 shadow-sm"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate" title={py.description}>
                                  {py.description}
                                </p>
                                <p className="text-[9px] text-muted-foreground flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span>
                                    {py.date.toLocaleDateString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                  </span>
                                  <span className="text-[8px] px-1 rounded bg-sky-500/10 uppercase font-bold text-sky-700">
                                    {py.paymentMethod}
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold font-[DM_Mono,monospace] text-emerald-700 text-xs">
                                  −{fmt(py.amount)}
                                </span>
                                <button
                                  onClick={() => {
                                    if (window.confirm("Are you sure you want to delete this payment record?")) {
                                      onDeletePayment(d.id, py.id);
                                    }
                                  }}
                                  className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 p-1 rounded transition-colors"
                                  title="Delete Payment Entry"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Debt Popup Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Add Liability / Loan</h3>
                <p className="text-xs text-muted-foreground">Record a new creditor account</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Debt / Loan Name</label>
                <input
                  type="text"
                  placeholder="e.g. Shop Expansion Loan, Vendor Bill"
                  required
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Creditor Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, Venkatesh Fruits"
                  required
                  value={creditorName}
                  onChange={(e) => setCreditorName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Original Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-teal-800 hover:opacity-90 transition-all shadow-md"
              >
                Save Loan Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal Popup */}
      {showPayForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Log Partial Payment</h3>
                <p className="text-xs text-muted-foreground">Reduce outstanding liability</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPayForm(false);
                  setActiveDebtId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaySubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Payment Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Payment Note</label>
                <input
                  type="text"
                  placeholder="e.g. Month 1 Installment, Week clearing"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod("cash")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === "cash"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("gpay")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === "gpay"
                        ? "bg-sky-50 text-sky-700 border-sky-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Smartphone size={14} /> GPay
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod("zomato")}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                      payMethod === "zomato"
                        ? "bg-orange-50 text-orange-600 border-orange-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Flame size={14} /> Zomato
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Date Paid</label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:opacity-90 transition-all shadow-md"
              >
                Submit Partial Payment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
