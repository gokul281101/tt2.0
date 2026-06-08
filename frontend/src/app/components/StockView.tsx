import { useState, useMemo } from "react";
import {
  Plus,
  X,
  CircleAlert,
  AlertCircle,
  Boxes,
  Star,
  StarOff,
  BookMarked,
  CheckCheck,
  ChevronDown,
  Trash2,
  Leaf,
  Package,
  ShoppingCart,
  IceCream,
  Nut,
  Sparkles,
  Droplet,
} from "lucide-react";
import type {
  ShopId,
  StockItem,
  InventoryLevel,
  PurchaseCategory,
  PurchaseUnit,
} from "../types";
import { SHOPS, PURCHASE_ITEMS } from "../constants";
import { fmt } from "../utils";

export function stockStatus(item: StockItem): InventoryLevel {
  if (item.currentQty <= 0) return "out";
  if (item.currentQty < item.minThreshold) return "low";
  return "ok";
}

const STATUS_CONFIG: Record<
  InventoryLevel,
  { label: string; bg: string; text: string; border: string }
> = {
  ok: { label: "In Stock", bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0" },
  low: { label: "Low", bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  out: { label: "Out", bg: "#fef2f2", text: "#dc2626", border: "#fecaca" },
};

const CAT_ICONS: Record<string, typeof Leaf> = {
  "Fruits & Vegetables": Leaf,
  "Packaging & Plastics": Package,
  "Other Supplies": ShoppingCart,
  "Ice Cream": IceCream,
  "Dry Fruits": Nut,
  "Cleaning Utility": Sparkles,
  "Essence": Droplet,
};

interface StockViewProps {
  shopId: ShopId;
  stock: StockItem[];
  onUpdate: (items: StockItem[]) => void;
}

export function StockView({ shopId, stock, onUpdate }: StockViewProps) {
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

  // Edit form states
  const [showEditForm, setShowEditForm] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [eName, setEName] = useState("");
  const [eCat, setECat] = useState<PurchaseCategory>("Fruits & Vegetables");
  const [eQty, setEQty] = useState("");
  const [eUnit, setEUnit] = useState<PurchaseUnit>("kg");
  const [eMin, setEMin] = useState("");

  function update(id: string, patch: Partial<StockItem>) {
    onUpdate(stock.map((s) => (s.id === id ? { ...s, ...patch } : s)));
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
    setFName("");
    setFQty("");
    setFMin("");
    setShowAddForm(false);
  }

  function submitEdit() {
    if (!editItem || !eName || !eQty) return;
    update(editItem.id, {
      name: eName,
      category: eCat,
      currentQty: parseFloat(eQty),
      unit: eUnit,
      minThreshold: eMin ? parseFloat(eMin) : 0,
    });
    setEditItem(null);
    setShowEditForm(false);
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

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* LEFT: Stock List */}
      <div className="flex-1 space-y-4">
        {/* Summary + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {outCount > 0 && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#fef2f2", color: "#dc2626" }}
              >
                <CircleAlert size={12} /> {outCount} Out of stock
              </span>
            )}
            {lowCount > 0 && (
              <span
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ backgroundColor: "#fffbeb", color: "#b45309" }}
              >
                <AlertCircle size={12} /> {lowCount} Low stock
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: shop.color }}
          >
            <Plus size={14} /> Add Item
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-40 bg-card rounded-xl px-4 py-2 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["all", ...Object.keys(PURCHASE_ITEMS)] as (PurchaseCategory | "all")[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize ${
                  filterCat === cat ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                {cat === "all" ? "All" : cat.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Stock by category */}
        {Object.entries(byCategory).map(([cat, items]) => {
          const Icon = CAT_ICONS[cat] || Package;
          return (
            <div
              key={cat}
              className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
                <Icon size={14} className="text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  {cat}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{items.length} items</span>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => {
                  const st = stockStatus(item);
                  const cfg = STATUS_CONFIG[st];
                  const isEditingQty = editQtyId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Status dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cfg.text }}
                      />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Editable current qty */}
                          {isEditingQty ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                type="number"
                                value={editQtyVal}
                                onChange={(e) => setEditQtyVal(e.target.value)}
                                onBlur={() => {
                                  if (editQtyVal !== "") {
                                    update(item.id, { currentQty: parseFloat(editQtyVal) });
                                  }
                                  setEditQtyId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (editQtyVal !== "") {
                                      update(item.id, { currentQty: parseFloat(editQtyVal) });
                                    }
                                    setEditQtyId(null);
                                  }
                                }}
                                className="w-16 bg-input-background rounded-lg px-2 py-0.5 text-xs font-[DM_Mono,monospace] border border-primary focus:outline-none"
                              />
                              <span className="text-xs text-muted-foreground">{item.unit}</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditQtyId(item.id);
                                setEditQtyVal(String(item.currentQty));
                              }}
                              className="text-xs font-[DM_Mono,monospace] font-semibold hover:underline"
                              style={{ color: cfg.text }}
                            >
                              {item.currentQty % 1 === 0
                                ? item.currentQty
                                : item.currentQty.toFixed(1)}{" "}
                              {item.unit}
                            </button>
                          )}
                          <span className="text-muted-foreground/40 text-xs">·</span>
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                            style={{ backgroundColor: cfg.bg, color: cfg.text }}
                          >
                            {cfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            min {item.minThreshold} {item.unit}
                          </span>
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
                        {item.wanted ? (
                          <Star size={12} fill="currentColor" className="text-amber-500" />
                        ) : (
                          <StarOff size={12} />
                        )}
                        {item.wanted ? "Wanted" : "Want"}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditItem(item);
                          setEName(item.name);
                          setECat(item.category);
                          setEQty(String(item.currentQty));
                          setEUnit(item.unit);
                          setEMin(String(item.minThreshold));
                          setShowEditForm(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border text-muted-foreground bg-card hover:bg-muted/50 cursor-pointer"
                      >
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-muted-foreground opacity-70 md:opacity-0 md:group-hover:opacity-100 hover:text-destructive hover:bg-red-50 hover:opacity-100 transition-all cursor-pointer"
                      >
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
              <button
                onClick={clearAllWanted}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {wantedItems.length === 0 ? (
            <div className="py-12 text-center px-5">
              <Star size={28} className="mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground font-medium">
                No items marked as wanted.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Click ★ Want on any stock item to add it here.
              </p>
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
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: cfg.text }}
                          />
                          <p className="text-sm font-semibold text-foreground truncate">
                            {item.name}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 ml-3">
                          Have:{" "}
                          <span
                            className="font-[DM_Mono,monospace] font-semibold"
                            style={{ color: cfg.text }}
                          >
                            {item.currentQty % 1 === 0
                              ? item.currentQty
                              : item.currentQty.toFixed(1)}{" "}
                            {item.unit}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => toggleWanted(item.id)}
                        className="text-amber-500 hover:text-muted-foreground transition-colors flex-shrink-0 mt-0.5"
                      >
                        <Star size={14} fill="currentColor" />
                      </button>
                    </div>

                    {/* Wanted qty */}
                    <div className="mt-2 flex items-center gap-2 ml-3">
                      <span className="text-xs text-muted-foreground">Need:</span>
                      {isEditingWanted ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            type="number"
                            value={editWantedQtyVal}
                            onChange={(e) => setEditWantedQtyVal(e.target.value)}
                            onBlur={() => {
                              if (editWantedQtyVal !== "") {
                                update(item.id, { wantedQty: parseFloat(editWantedQtyVal) });
                              }
                              setEditWantedQtyId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                if (editWantedQtyVal !== "") {
                                  update(item.id, { wantedQty: parseFloat(editWantedQtyVal) });
                                }
                                setEditWantedQtyId(null);
                              }
                            }}
                            className="w-14 bg-input-background rounded-lg px-2 py-0.5 text-xs font-[DM_Mono,monospace] border border-primary focus:outline-none"
                          />
                          <span className="text-xs text-muted-foreground">{item.unit}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditWantedQtyId(item.id);
                            setEditWantedQtyVal(String(item.wantedQty));
                          }}
                          className="text-xs font-[DM_Mono,monospace] font-bold text-primary hover:underline"
                        >
                          {item.wantedQty} {item.unit}
                        </button>
                      )}
                    </div>

                    {/* Note */}
                    <input
                      type="text"
                      placeholder="Add note…"
                      value={item.wantedNote}
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
                <span className="flex items-center gap-1 text-[10px]">
                  <CheckCheck size={12} />
                  tap ★ to clear
                </span>
              </div>
              <div className="space-y-1">
                {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                  const catWanted = wantedItems.filter((i) => i.category === cat);
                  if (catWanted.length === 0) return null;
                  const CIcon = CAT_ICONS[cat] || Package;
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                      <CIcon size={10} />
                      <span>
                        {catWanted.length} {cat.split(" ")[0].toLowerCase()}
                      </span>
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
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitAdd();
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Category
                </label>
                <div className="flex flex-col gap-1.5">
                  {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                    const Icon = CAT_ICONS[cat] || Package;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFCat(cat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                          fCat === cat
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-muted border-transparent text-muted-foreground"
                        }`}
                      >
                        <Icon size={13} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dragon Fruit"
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Current Qty
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={fQty}
                    onChange={(e) => setFQty(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      value={fUnit}
                      onChange={(e) => setFUnit(e.target.value as PurchaseUnit)}
                      className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      {(["kg", "gram", "liter", "packet", "packets", "box", "boxes", "pcs", "dozen"] as PurchaseUnit[]).map(
                        (u) => (
                          <option key={u}>{u}</option>
                        )
                      )}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Min Threshold (alert when below)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={fMin}
                  onChange={(e) => setFMin(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={!fName || !fQty}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90"
                style={{ backgroundColor: shop.color }}
              >
                Add to Stock
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Edit Stock Item Modal */}
      {showEditForm && editItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-bold">Edit Stock Item</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditItem(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitEdit();
              }}
              className="p-5 space-y-4"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(PURCHASE_ITEMS) as PurchaseCategory[]).map((cat) => {
                    const Icon = CAT_ICONS[cat] || Package;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setECat(cat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                          eCat === cat
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-muted border-transparent text-muted-foreground"
                        }`}
                      >
                        <Icon size={13} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Item Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dragon Fruit"
                  value={eName}
                  onChange={(e) => setEName(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Current Qty
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={eQty}
                    onChange={(e) => setEQty(e.target.value)}
                    className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="w-28">
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                    Unit
                  </label>
                  <div className="relative">
                    <select
                      value={eUnit}
                      onChange={(e) => setEUnit(e.target.value as PurchaseUnit)}
                      className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring appearance-none animate-none"
                    >
                      {(["kg", "gram", "liter", "packet", "packets", "box", "boxes", "pcs", "dozen"] as PurchaseUnit[]).map(
                        (u) => (
                          <option key={u}>{u}</option>
                        )
                      )}
                    </select>
                    <ChevronDown
                      size={12}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                  Min Threshold (alert when below)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={eMin}
                  onChange={(e) => setEMin(e.target.value)}
                  className="w-full bg-input-background rounded-xl px-4 py-2.5 text-sm font-[DM_Mono,monospace] border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                type="submit"
                disabled={!eName || !eQty}
                className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: shop.color }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
