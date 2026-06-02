import { useState, useMemo } from "react";
import { X, Hash, Weight, Wallet, Calendar, Package } from "lucide-react";
import type { Purchase } from "../types";
import { ALL_ITEMS_FLAT, CATEGORY_ICONS } from "../constants";
import { fmt, fmtShort, monthKey } from "../utils";

interface ItemDetailModalProps {
  itemName: string;
  purchases: Purchase[];
  onClose: () => void;
}

export function ItemDetailModal({
  itemName,
  purchases,
  onClose,
}: ItemDetailModalProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(monthKey(now));

  const months = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach((p) => set.add(monthKey(p.date)));
    return Array.from(set).sort((a, b) => b.localeCompare(a)).slice(0, 6);
  }, [purchases]);

  const monthLabel = (mk: string) => {
    const [y, m] = mk.split("-").map(Number);
    return new Date(y, m, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
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
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
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
              <Hash size={12} />
              <span className="text-xs font-semibold">Times Bought</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground">
              {filtered.length}
            </p>
          </div>
          <div className="bg-muted rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Weight size={12} />
              <span className="text-xs font-semibold">Total Qty</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-foreground">
              {totalQty % 1 === 0 ? totalQty : totalQty.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">{unit}</p>
          </div>
          <div className="bg-primary/10 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Wallet size={12} />
              <span className="text-xs font-semibold">Total Spent</span>
            </div>
            <p className="text-2xl font-bold font-[DM_Mono,monospace] text-primary">
              {fmtShort(totalSpent)}
            </p>
            <p className="text-xs text-muted-foreground">{fmt(totalSpent)}</p>
          </div>
        </div>

        {/* Purchase history */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 pt-4">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-6">
              No purchases in {monthLabel(selectedMonth)}.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Purchase History
              </p>
              {filtered.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-1 text-muted-foreground w-20 flex-shrink-0">
                    <Calendar size={11} />
                    <span className="text-xs">
                      {p.date.toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
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
