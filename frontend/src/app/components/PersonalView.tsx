import { useState, useMemo } from "react";
import { Plus, X, HeartHandshake, Home, User, Banknote, Calendar, Trash2 } from "lucide-react";
import type { PersonalExpense, PaymentMethod } from "../types";
import { fmt } from "../utils";

interface PersonalViewProps {
  expenses: PersonalExpense[];
  onAdd: (exp: Omit<PersonalExpense, "id">) => void;
  onDelete: (id: string) => void;
}

export function PersonalView({ expenses, onAdd, onDelete }: PersonalViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<"Home" | "Personal Use">("Home");
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>("cash");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  const [filterPeriod, setFilterPeriod] = useState<"all" | "90d" | "30d" | "this_month">("all");

  // Filtered expenses based on selected duration preset
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      if (filterPeriod === "this_month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === "30d") {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 30);
        return d >= cutoff;
      }
      if (filterPeriod === "90d") {
        const cutoff = new Date();
        cutoff.setDate(now.getDate() - 90);
        return d >= cutoff;
      }
      return true; // "all"
    });
  }, [expenses, filterPeriod]);

  // Combined totals calculations based on filtered expenses
  const totals = useMemo(() => {
    let home = 0;
    let personal = 0;

    filteredExpenses.forEach((e) => {
      if (e.category === "Home") home += e.amount;
      else personal += e.amount;
    });

    return { home, personal, total: home + personal };
  }, [filteredExpenses]);

  // Static current month summary independent of period filters
  const currentMonthSummary = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formAmount || !formDesc) return;

    onAdd({
      amount: Math.abs(parseFloat(formAmount)),
      category: formCategory,
      description: formDesc,
      date: new Date(formDate),
      paymentMethod: formPaymentMethod,
    });

    setFormAmount("");
    setFormDesc("");
    setFormPaymentMethod("cash");
    setFormDate(new Date().toISOString().split("T")[0]);
    setShowForm(false);
  }

  const periodLabel = useMemo(() => {
    if (filterPeriod === "all") return "All Time";
    if (filterPeriod === "90d") return "90 Days";
    if (filterPeriod === "30d") return "30 Days";
    return "This Month";
  }, [filterPeriod]);

  return (
    <div className="space-y-6">
      {/* Upper info panel */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-lg flex flex-wrap gap-4 items-center justify-between">
        <div className="space-y-1">
          <span className="bg-emerald-600/40 text-emerald-300 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-500/20">
            Personal Bookkeeper
          </span>
          <h2 className="text-xl font-bold tracking-tight">Personal Expenses Ledger</h2>
          <p className="text-emerald-100/70 text-xs max-w-md">
            Separate your household and personal spendings entirely from your commercial juice shop finances.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-white text-emerald-800 hover:bg-emerald-50 transition-all shadow-md"
        >
          <Plus size={14} /> Log Personal Expense
        </button>
      </div>

      {/* Period Filter Selector */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-emerald-700" />
          <span className="text-xs font-bold text-foreground">Filter Ledger Period:</span>
        </div>
        <div className="flex bg-muted rounded-xl p-1 w-full sm:w-auto">
          {[
            { id: "all", label: "All Time" },
            { id: "90d", label: "Last 90 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "this_month", label: "This Month" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterPeriod(item.id as any)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterPeriod === item.id
                  ? "bg-card shadow-sm text-emerald-800"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <HeartHandshake size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Total Personal Outgoings ({periodLabel})</p>
            <p className="text-xl font-black text-emerald-800 font-[DM_Mono,monospace]">
              {fmt(totals.total)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Home size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Home & Family Spend ({periodLabel})</p>
            <p className="text-xl font-black text-blue-700 font-[DM_Mono,monospace]">
              {fmt(totals.home)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0">
            <User size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">Personal Leisure Spend ({periodLabel})</p>
            <p className="text-xl font-black text-purple-700 font-[DM_Mono,monospace]">
              {fmt(totals.personal)}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">This Month's Summary</p>
            <p className="text-xl font-black text-amber-800 font-[DM_Mono,monospace]">
              {fmt(currentMonthSummary)}
            </p>
          </div>
        </div>
      </div>

      {/* Date-wise entries log list */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground">Date-wise Spendings History</h3>

        <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
          {filteredExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-10 font-medium">
              No personal expenses found for the selected period.
            </p>
          ) : (
            filteredExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs`}
                    style={{
                      backgroundColor: e.category === "Home" ? "#dbeafe" : "#f3e8ff",
                      color: e.category === "Home" ? "#1e40af" : "#6b21a8",
                    }}
                  >
                    {e.category === "Home" ? <Home size={14} /> : <User size={14} />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{e.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      <span className="font-bold px-1 rounded bg-muted text-muted-foreground">
                        {e.category}
                      </span>
                      <span className={`font-bold px-1 rounded uppercase tracking-wider ${
                        e.paymentMethod === "cash"
                          ? "bg-amber-50 text-amber-800 border border-amber-200/50"
                          : e.paymentMethod === "gpay"
                          ? "bg-sky-50 text-sky-800 border border-sky-200/50"
                          : "bg-purple-50 text-purple-800 border border-purple-200/50"
                      }`}>
                        {e.paymentMethod}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {e.date.toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black font-[DM_Mono,monospace] text-emerald-800">
                    {fmt(e.amount)}
                  </span>
                  <button
                    onClick={() => onDelete(e.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entry Modal Popup */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-foreground">Log Personal Expense</h3>
                <p className="text-xs text-muted-foreground">Home & Personal outlays</p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormCategory("Home")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border ${
                      formCategory === "Home"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <Home size={14} /> Home & Family
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory("Personal Use")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border ${
                      formCategory === "Personal Use"
                        ? "bg-purple-50 text-purple-700 border-purple-300"
                        : "bg-muted text-muted-foreground border-transparent"
                    }`}
                  >
                    <User size={14} /> Personal Use
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
                      onClick={() => setFormPaymentMethod(method)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider ${
                        formPaymentMethod === method
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
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity bill, movie ticket"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground mb-1 block">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-xs border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                type="submit"
                disabled={!formAmount || !formDesc}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:opacity-90 disabled:opacity-40 transition-all shadow-md"
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
