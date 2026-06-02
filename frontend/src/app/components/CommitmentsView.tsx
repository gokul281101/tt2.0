import { useState, useMemo } from "react";
import {
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  History,
  Trash2,
  Banknote,
  Smartphone,
  Calendar,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import type { ShopId, Commitment, CommitmentPayment, PaymentMethod } from "../types";
import { SHOPS } from "../constants";
import { fmt, mkFromDate, mkLabel } from "../utils";

interface CommitmentsViewProps {
  commitments: Commitment[];
  payments: CommitmentPayment[];
  onAddCommitment: (c: Commitment) => void;
  onDeleteCommitment: (id: string) => void;
  onMarkPaid: (p: CommitmentPayment) => void;
  onDeletePartialPayment: (commitmentId: string, partialId: string, monthKey: string) => void;
}

export function CommitmentsView({
  commitments,
  payments,
  onAddCommitment,
  onDeleteCommitment,
  onMarkPaid,
  onDeletePartialPayment,
}: CommitmentsViewProps) {
  const globalColor = "#7c3aed";
  const now = new Date();
  const currentMk = mkFromDate(now);

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
  // Which commitment card has its partial log expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add commitment form
  const [fName, setFName] = useState("");
  const [fEmoji, setFEmoji] = useState("🏪");
  const [fAmount, setFAmount] = useState("");
  const [fDueDay, setFDueDay] = useState("1");

  // Partial payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState(now.toISOString().split("T")[0]);

  const EMOJI_OPTIONS = ["🏪", "⚡", "👨‍💼", "📋", "💧", "📶", "🔥", "🛡️", "🏦", "🚗", "📦", "🔧"];

  const paymentsInMonth = useMemo(
    () => payments.filter((p) => p.monthKey === selectedMk),
    [payments, selectedMk]
  );

  // Map commitmentId -> payment for selected month
  const paymentMap = useMemo(() => {
    const map: Record<string, CommitmentPayment> = {};
    paymentsInMonth.forEach((p) => { map[p.commitmentId] = p; });
    return map;
  }, [paymentsInMonth]);

  const totalCommitted = commitments.reduce((s, c) => s + c.amount, 0);
  const totalPaid = paymentsInMonth.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = Math.max(0, totalCommitted - totalPaid);

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
      partialPayments: [],
    });
    setPayAmount(""); setPayNote(""); setPayDate(now.toISOString().split("T")[0]);
    setPayModal(null);
  }

  const historyPayments = useMemo(
    () =>
      historyModal
        ? payments
            .filter((p) => p.commitmentId === historyModal.id)
            .sort((a, b) => b.paidDate.getTime() - a.paidDate.getTime())
        : [],
    [payments, historyModal]
  );

  function payMethodIcon(m: PaymentMethod) {
    if (m === "cash") return <Banknote size={11} />;
    if (m === "gpay") return <Smartphone size={11} />;
    return <Flame size={11} />;
  }
  function payMethodLabel(m: PaymentMethod) {
    if (m === "cash") return "Cash";
    if (m === "gpay") return "GPay";
    return "Zomato";
  }
  function payMethodColor(m: PaymentMethod) {
    if (m === "cash") return "text-amber-600";
    if (m === "gpay") return "text-sky-600";
    return "text-orange-500";
  }

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            Month:
          </span>
          {months.map((mk) => (
            <button
              key={mk}
              onClick={() => setSelectedMk(mk)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                selectedMk === mk
                  ? "text-white border-transparent"
                  : "bg-card text-foreground border-border"
              }`}
              style={selectedMk === mk ? { backgroundColor: globalColor } : {}}
            >
              {mkLabel(mk)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: globalColor }}
        >
          <Plus size={15} /> Add Commitment
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Total Committed</p>
          <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground">
            {fmt(totalCommitted)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{commitments.length} items</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} className="text-green-600" />
            <p className="text-xs font-semibold text-muted-foreground">Paid This Month</p>
          </div>
          <p className="text-2xl font-bold font-[DM_Mono,monospace] text-green-600">{fmt(totalPaid)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {paymentsInMonth.length} of {commitments.length} started
          </p>
        </div>
        <div
          className="rounded-2xl p-5 border shadow-sm"
          style={{
            backgroundColor: totalPending > 0 ? "#fef2f2" : "#f0fdf4",
            borderColor: totalPending > 0 ? "#fecaca" : "#bbf7d0",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} style={{ color: totalPending > 0 ? "#dc2626" : "#16a34a" }} />
            <p className="text-xs font-semibold text-muted-foreground">Remaining</p>
          </div>
          <p
            className="text-2xl font-bold font-[DM_Mono,monospace]"
            style={{ color: totalPending > 0 ? "#dc2626" : "#16a34a" }}
          >
            {fmt(totalPending)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Still to clear</p>
        </div>
      </div>

      {/* Commitment cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {commitments.map((c) => {
          const pmt = paymentMap[c.id];
          const paidSoFar = pmt ? pmt.paidAmount : 0;
          const isFullyPaid = paidSoFar >= c.amount;
          const isPartial = paidSoFar > 0 && !isFullyPaid;
          const isDue = !isFullyPaid && now.getDate() >= c.dueDay && selectedMk === currentMk;
          const pct = Math.min(100, Math.round((paidSoFar / c.amount) * 100));
          const isExpanded = expandedId === c.id;

          return (
            <div
              key={c.id}
              className={`bg-card rounded-2xl border shadow-sm flex flex-col transition-all overflow-hidden ${
                isFullyPaid ? "border-green-200" : isPartial ? "border-amber-200" : isDue ? "border-red-200" : "border-border"
              }`}
            >
              <div className="p-5 flex flex-col gap-4">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: c.color + "18" }}
                    >
                      {c.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {c.dueDay}
                        {["st", "nd", "rd"][((c.dueDay % 10) - 1)] || "th"} of month
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistoryModal(c)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Payment history"
                    >
                      <History size={13} />
                    </button>
                    <button
                      onClick={() => onDeleteCommitment(c.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Amount row */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold">Expected</p>
                    <p className="text-xl font-bold font-[DM_Mono,monospace]" style={{ color: c.color }}>
                      {fmt(c.amount)}
                    </p>
                  </div>
                  {pmt && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {isFullyPaid ? "Fully Paid" : "Paid so far"}
                      </p>
                      <p className={`text-sm font-bold font-[DM_Mono,monospace] ${isFullyPaid ? "text-green-600" : "text-amber-600"}`}>
                        {fmt(paidSoFar)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                {pmt && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: isFullyPaid ? "#16a34a" : "#f59e0b",
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground font-semibold">{pct}% paid</p>
                  </div>
                )}

                {/* Status / action buttons */}
                <div className="flex gap-2">
                  {/* Add Partial Payment button — always shown if not fully paid */}
                  {!isFullyPaid && (
                    <button
                      onClick={() => {
                        setPayModal(c);
                        setPayAmount(String(Math.max(0, c.amount - paidSoFar)));
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        isDue
                          ? "bg-red-50 text-destructive border-red-200 hover:bg-red-100"
                          : isPartial
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                      }`}
                    >
                      {isDue ? "⚠️ Overdue — Add Payment" : isPartial ? "+ Add Partial Payment" : "Mark as Paid"}
                    </button>
                  )}

                  {/* Expand/collapse partial log */}
                  {pmt && pmt.partialPayments.length > 0 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      className="px-3 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1 text-[10px] font-semibold"
                      title="View payments"
                    >
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      {pmt.partialPayments.length}
                    </button>
                  )}

                  {isFullyPaid && (
                    <div className="flex-1 flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-semibold">Fully Paid ✓</span>
                      </div>
                      {pmt && pmt.partialPayments.length > 0 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : c.id)}
                          className="text-[10px] text-green-700 font-semibold flex items-center gap-0.5"
                        >
                          {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {pmt.partialPayments.length} payment{pmt.partialPayments.length > 1 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded partial payments log */}
              {isExpanded && pmt && pmt.partialPayments.length > 0 && (
                <div className="border-t border-border/50 bg-muted/30 p-4 space-y-2">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
                    Payment Installments
                  </p>
                  {pmt.partialPayments.map((pp) => (
                    <div
                      key={pp.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/40 text-xs gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">
                          {pp.paidDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </p>
                        {pp.note && (
                          <p className="text-[10px] text-muted-foreground/70 truncate">{pp.note}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${payMethodColor(pp.paymentMethod)}`}>
                        {payMethodIcon(pp.paymentMethod)} {payMethodLabel(pp.paymentMethod)}
                      </span>
                      <span className="font-bold font-[DM_Mono,monospace] text-emerald-700 text-xs">
                        {fmt(pp.amount)}
                      </span>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this payment installment?")) {
                            onDeletePartialPayment(c.id, pp.id, selectedMk);
                          }
                        }}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 p-1 rounded transition-colors flex-shrink-0"
                        title="Delete installment"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
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
              <button type="button" onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submitAdd(); }} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e} type="button" onClick={() => setFEmoji(e)}
                      className={`w-9 h-9 rounded-xl text-lg transition-all border ${fEmoji === e ? "border-primary bg-primary/10" : "border-border bg-muted"}`}
                    >
                      {e}
                    </button>
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
              <button type="submit" disabled={!fName || !fAmount}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: globalColor }}>
                Save Commitment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Partial Payment Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-bold">Add Payment</h3>
                <p className="text-xs text-muted-foreground">
                  {payModal.emoji} {payModal.name} · {mkLabel(selectedMk)}
                </p>
                {/* Show how much is still remaining */}
                {(() => {
                  const pmt = paymentMap[payModal.id];
                  const paid = pmt ? pmt.paidAmount : 0;
                  const remaining = Math.max(0, payModal.amount - paid);
                  return paid > 0 ? (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5">
                      Paid so far: {fmt(paid)} · Remaining: {fmt(remaining)}
                    </p>
                  ) : null;
                })()}
              </div>
              <button type="button" onClick={() => setPayModal(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); submitPay(); }} className="p-5 space-y-4">
              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Payment Method</label>
                <div className="flex gap-2">
                  {(["cash", "gpay", "zomato"] as PaymentMethod[]).map((m) => (
                    <button
                      key={m} type="button" onClick={() => setPayMethod(m)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        payMethod === m
                          ? m === "cash" ? "bg-amber-50 text-amber-700 border-amber-300"
                            : m === "gpay" ? "bg-sky-50 text-sky-700 border-sky-300"
                            : "bg-orange-50 text-orange-600 border-orange-300"
                          : "bg-muted text-muted-foreground border-transparent"
                      }`}
                    >
                      {m === "cash" ? <Banknote size={14} /> : m === "gpay" ? <Smartphone size={14} /> : <Flame size={14} />}
                      {m === "cash" ? "Cash" : m === "gpay" ? "GPay" : "Zomato"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Amount Paid (₹)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
                {payAmount && parseFloat(payAmount) !== payModal.amount && (
                  <p className="text-xs mt-1" style={{ color: parseFloat(payAmount) > payModal.amount ? "#16a34a" : "#f59e0b" }}>
                    Expected total: {fmt(payModal.amount)}
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date Paid</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Note (optional)</label>
                <input type="text" placeholder="e.g. First installment" value={payNote} onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>

              <button type="submit" disabled={!payAmount}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: globalColor }}>
                Add Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal — shows all months' payments with partials */}
      {historyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
              <div>
                <h3 className="text-base font-bold">{historyModal.emoji} {historyModal.name}</h3>
                <p className="text-xs text-muted-foreground">Full payment history</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {historyPayments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8 font-medium">No payment history.</p>
              ) : (
                historyPayments.map((p) => (
                  <div key={p.id} className="bg-muted/40 rounded-xl p-3 space-y-2">
                    {/* Month header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar size={11} />
                        <span className="text-xs font-bold">{mkLabel(p.monthKey)}</span>
                      </div>
                      <span className="text-sm font-bold font-[DM_Mono,monospace] text-green-600">
                        {fmt(p.paidAmount)}
                      </span>
                    </div>
                    {/* Individual partial payments */}
                    {p.partialPayments.length > 0 && (
                      <div className="space-y-1 pl-2 border-l-2 border-border/50">
                        {p.partialPayments.map((pp) => (
                          <div key={pp.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {pp.paidDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                              {pp.note ? ` · ${pp.note}` : ""}
                            </span>
                            <span className={`font-semibold flex items-center gap-0.5 ${payMethodColor(pp.paymentMethod)}`}>
                              {payMethodIcon(pp.paymentMethod)} {fmt(pp.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
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
