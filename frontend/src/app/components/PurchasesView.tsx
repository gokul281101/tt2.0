import { useState, useMemo } from "react";
import { Plus, ChevronDown, ChevronRight, ChevronLeft, BarChart3 } from "lucide-react";
import type {
  ShopId,
  Purchase,
  StockStatus,
  PurchaseCategory,
  PurchaseUnit,
} from "../types";
import {
  SHOPS,
  PURCHASE_ITEMS,
  ALL_ITEMS_FLAT,
  CATEGORY_ICONS,
  CATEGORY_COLORS_BG,
  CATEGORY_COLORS_TEXT,
} from "../constants";
import { fmt, monthKey } from "../utils";
import { ItemDetailModal } from "./ItemDetailModal";
import { StockListColumn } from "./StockListColumn";

interface PurchasesViewProps {
  shopId: ShopId;
  purchases: Purchase[];
  onAdd: (p: Purchase) => void;
  onDeletePurchase: (id: string) => void;
  stockList: Record<string, StockStatus>;
  onStockToggle: (itemName: string) => void;
  customItems: string[];
  onAddCustomItem: (name: string) => void;
  onRemoveCustomItem: (name: string) => void;
}

export function PurchasesView({
  shopId,
  purchases,
  onAdd,
  onDeletePurchase,
  stockList,
  onStockToggle,
  customItems,
  onAddCustomItem,
  onRemoveCustomItem,
}: PurchasesViewProps) {
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

  // Month filter state for KPI / chart / categories
  const [filterMonthKey, setFilterMonthKey] = useState(currentMonthKey);

  // Navigate months
  function shiftMonth(delta: number) {
    const [y, m] = filterMonthKey.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setFilterMonthKey(monthKey(d));
  }

  const filterMonthLabel = (() => {
    const [y, m] = filterMonthKey.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  })();

  const isCurrentMonth = filterMonthKey === currentMonthKey;

  // Group purchases by item for the SELECTED filter month
  const itemSummary = useMemo(() => {
    const map: Record<
      string,
      {
        count: number;
        totalQty: number;
        totalPrice: number;
        unit: string;
        category: PurchaseCategory;
        allPurchases: Purchase[];
      }
    > = {};
    purchases.forEach((p) => {
      if (!map[p.itemName]) {
        map[p.itemName] = {
          count: 0,
          totalQty: 0,
          totalPrice: 0,
          unit: p.unit,
          category: p.category,
          allPurchases: [],
        };
      }
      map[p.itemName].allPurchases.push(p);
      if (monthKey(p.date) === filterMonthKey) {
        map[p.itemName].count += 1;
        map[p.itemName].totalQty += p.quantity;
        map[p.itemName].totalPrice += p.totalPrice;
      }
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.totalPrice - a.totalPrice);
  }, [purchases, filterMonthKey]);

  const byCategory = useMemo(() => {
    const cats: Record<PurchaseCategory, typeof itemSummary> = {
      "Fruits & Vegetables": [],
      "Packaging & Plastics": [],
      "Other Supplies": [],
      "Ice Cream": [],
      "Dry Fruits": [],
      "Cleaning Utility": [],
      "Essence": [],
    };
    itemSummary.forEach((item) => {
      const cat = cats[item.category] ? item.category : "Other Supplies";
      cats[cat].push(item);
    });
    return cats;
  }, [itemSummary]);

  const thisMonthTotal = useMemo(
    () =>
      purchases
        .filter((p) => monthKey(p.date) === filterMonthKey)
        .reduce((s, p) => s + p.totalPrice, 0),
    [purchases, filterMonthKey]
  );

  const catItems = PURCHASE_ITEMS[formCat];

  function handleItemSelect(name: string) {
    const item = ALL_ITEMS_FLAT.find((i) => i.name === name);
    if (item) {
      setFormUnit(item.unit);
      const qty = parseFloat(formQty) || 1;
      if (!formQty) setFormQty("1");
      setFormPpu(String(item.basePrice * qty));
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
    const totalPrice = parseFloat(formPpu);
    const ppu = totalPrice / qty;
    onAdd({
      id: Date.now().toString(),
      itemName: formItem,
      category: formCat,
      quantity: qty,
      unit: formUnit,
      pricePerUnit: Math.round(ppu * 100) / 100,
      totalPrice: Math.round(totalPrice),
      date: new Date(formDate),
    });
    setFormItem("");
    setFormQty("");
    setFormPpu("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setCustomItem(false);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT: Add Purchase Form */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sticky top-4">
          <div className="flex items-center gap-2 mb-5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: shop.color + "20" }}
            >
              <Plus size={14} style={{ color: shop.color }} />
            </div>
            <h2 className="text-sm font-bold">Add Purchase</h2>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="space-y-4"
          >
            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Category
              </label>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                  const Icon = CATEGORY_ICONS[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCatChange(cat)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border text-left ${
                        formCat === cat
                          ? "border-current"
                          : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                      style={
                        formCat === cat
                          ? {
                              color: CATEGORY_COLORS_TEXT[cat],
                              backgroundColor: CATEGORY_COLORS_BG[cat],
                              borderColor: CATEGORY_COLORS_TEXT[cat] + "40",
                            }
                          : {}
                      }
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
                  type="button"
                  onClick={() => {
                    setCustomItem(!customItem);
                    setFormItem("");
                  }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {customItem ? "Pick from list" : "+ Custom item"}
                </button>
              </div>
              {customItem ? (
                <input
                  type="text"
                  placeholder="e.g. Dragon Fruit"
                  value={formItem}
                  onChange={(e) => setFormItem(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <div className="relative">
                  <select
                    value={formItem}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    <option value="">Select item…</option>
                    {catItems.map((i) => (
                      <option key={i.name} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={13}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                </div>
              )}
            </div>

            {/* Qty + Unit */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Quantity
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formQty}
                  onChange={(e) => setFormQty(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="w-24">
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Unit
                </label>
                <div className="relative">
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as PurchaseUnit)}
                    className="w-full bg-input-background rounded-xl px-2 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                  >
                    {(["kg", "gram", "liter", "packet", "packets", "box", "boxes", "pcs", "dozen"] as PurchaseUnit[]).map(
                      (u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      )
                    )}
                  </select>
                  <ChevronDown
                    size={11}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Total Amount Spent */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Total Amount Spent (₹)
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={formPpu}
                onChange={(e) => setFormPpu(e.target.value)}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {formQty && formPpu && (
                <p className="text-xs text-primary font-semibold mt-1.5 font-[DM_Mono,monospace]">
                  Price per {formUnit || "unit"}:{" "}
                  {fmt(Math.round((parseFloat(formPpu) / parseFloat(formQty)) * 100) / 100)}
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={!formItem || !formQty || !formPpu}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: shop.color }}
            >
              Save Purchase
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Item List */}
      <div className="flex-1 space-y-5">
        {/* Month Filter + KPI Cards */}
        {(() => {
          const topCategory = Object.entries(
            itemSummary.reduce<Record<string, number>>((acc, item) => {
              acc[item.category] = (acc[item.category] || 0) + item.totalPrice;
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1])[0];

          const filterMonthCount = purchases.filter(
            (p) => monthKey(p.date) === filterMonthKey
          ).length;

          return (
            <div className="space-y-3">
              {/* Month Switcher */}
              <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-4 py-3 shadow-sm">
                <button
                  onClick={() => shiftMonth(-1)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{filterMonthLabel}</p>
                  {!isCurrentMonth && (
                    <button
                      onClick={() => setFilterMonthKey(currentMonthKey)}
                      className="text-[10px] text-primary font-semibold hover:underline mt-0.5"
                    >
                      Back to current month
                    </button>
                  )}
                </div>
                <button
                  onClick={() => shiftMonth(1)}
                  disabled={isCurrentMonth}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Expenses */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ backgroundColor: shop.color + "22" }}
                  >
                    {shop.emoji}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                      Total Expenses
                    </p>
                    <p className="text-xl font-black font-[DM_Mono,monospace]" style={{ color: shop.color }}>
                      {fmt(thisMonthTotal)}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {filterMonthLabel}
                    </p>
                  </div>
                </div>

                {/* Top Category — wrap text instead of truncate */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                    <BarChart3 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                      Top Category
                    </p>
                    <p className="text-xs font-black text-foreground leading-tight break-words">
                      {topCategory ? topCategory[0] : "—"}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {topCategory ? fmt(topCategory[1]) : "No data"}
                    </p>
                  </div>
                </div>

                {/* Total Purchases Count */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-black">#</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                      Purchases Made
                    </p>
                    <p className="text-xl font-black text-foreground">{filterMonthCount}</p>
                    <p className="text-[9px] text-muted-foreground">{filterMonthLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Purchase Bar Chart — always visible */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 size={15} className="text-emerald-700" />
              Product Spend Distribution
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visual breakdown of purchase expenditures per item — {filterMonthLabel}.
            </p>
          </div>

          {itemSummary.filter((i) => i.totalPrice > 0).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6 italic">
              No purchase data for this month yet. Add your first purchase!
            </p>
          ) : (
            <div className="space-y-4 pt-2">
              {itemSummary
                .filter((i) => i.totalPrice > 0)
                .slice(0, 8)
                .map((item) => {
                  const percent =
                    thisMonthTotal > 0
                      ? Math.round((item.totalPrice / thisMonthTotal) * 100)
                      : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                        <span className="truncate pr-4">{item.name}</span>
                        <span className="font-[DM_Mono,monospace] flex-shrink-0">
                          {fmt(item.totalPrice)}
                        </span>
                      </div>
                      {/* Straight bar */}
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: shop.color,
                          }}
                        />
                      </div>
                      {/* Percent shown under bar */}
                      <div className="text-[10px] text-muted-foreground font-medium flex justify-between">
                        <span className="text-primary font-semibold">
                          {percent}% of total spend
                        </span>
                        <span>
                          {item.totalQty % 1 === 0
                            ? item.totalQty
                            : item.totalQty.toFixed(1)}{" "}
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
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
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: CATEGORY_COLORS_BG[cat] }}
                  >
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
                              <span className="font-[DM_Mono,monospace] font-semibold text-foreground">
                                {item.count}×
                              </span>{" "}
                              this month
                            </span>
                            <span className="text-muted-foreground/40">·</span>
                            <span className="text-xs text-muted-foreground">
                              <span className="font-[DM_Mono,monospace] font-semibold text-foreground">
                                {item.totalQty % 1 === 0
                                  ? item.totalQty
                                  : item.totalQty.toFixed(1)}{" "}
                                {item.unit}
                              </span>
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">
                            No purchases this month
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {item.count > 0 && (
                        <p className="text-sm font-bold font-[DM_Mono,monospace] text-primary">
                          {fmt(item.totalPrice)}
                        </p>
                      )}
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground group-hover:text-foreground transition-colors ml-auto mt-0.5"
                      />
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
          onDeletePurchase={onDeletePurchase}
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
