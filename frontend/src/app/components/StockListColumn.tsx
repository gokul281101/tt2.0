import { useState } from "react";
import { ClipboardList, Plus, X } from "lucide-react";
import type { ShopId, StockStatus, PurchaseCategory } from "../types";
import {
  SHOPS,
  PURCHASE_ITEMS,
  ALL_ITEMS_FLAT,
  CATEGORY_ICONS,
  CATEGORY_COLORS_BG,
  CATEGORY_COLORS_TEXT,
} from "../constants";

interface StockListColumnProps {
  shopId: ShopId;
  stockList: Record<string, StockStatus>;
  customItems: string[];
  onToggle: (itemName: string) => void;
  onAddCustomItem: (name: string) => void;
  onRemoveCustomItem: (name: string) => void;
}

export function StockListColumn({
  shopId,
  stockList,
  customItems,
  onToggle,
  onAddCustomItem,
  onRemoveCustomItem,
}: StockListColumnProps) {
  const shop = SHOPS[shopId];
  const [newItem, setNewItem] = useState("");

  const allTracked = [...ALL_ITEMS_FLAT.map((i) => i.name), ...customItems];
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
      <div
        className="bg-card rounded-2xl border border-border shadow-sm sticky top-4 flex flex-col"
        style={{ maxHeight: "calc(100vh - 6rem)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-border flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: shop.color + "20" }}
          >
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
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Tap item to cycle: ⬜ → ✅ → ⭐ → ⬜
          </p>
        </div>

        {/* Scrollable item list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {/* Custom items section */}
          {customItems.length > 0 && (
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: shop.color }}
              >
                Custom Items
              </p>
              <div className="space-y-1">
                {customItems.map((name) => {
                  const status = stockList[name] ?? "none";
                  return (
                    <div key={name} className="flex items-center gap-1">
                      <button
                        onClick={() => onToggle(name)}
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor:
                            status === "in-stock"
                              ? "#dcfce7"
                              : status === "wanted"
                              ? "#fef3c7"
                              : "var(--muted)",
                          border:
                            status === "in-stock"
                              ? "1px solid #86efac"
                              : status === "wanted"
                              ? "1px solid #fde68a"
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
                              status === "in-stock"
                                ? "#166534"
                                : status === "wanted"
                                ? "#92400e"
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
          {(Object.entries(PURCHASE_ITEMS) as [PurchaseCategory, typeof ALL_ITEMS_FLAT[0][]][]).map(
            ([cat, items]) => (
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
                            status === "in-stock"
                              ? "#dcfce7"
                              : status === "wanted"
                              ? "#fef3c7"
                              : "var(--muted)",
                          border:
                            status === "in-stock"
                              ? "1px solid #86efac"
                              : status === "wanted"
                              ? "1px solid #fde68a"
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
                              status === "in-stock"
                                ? "#166534"
                                : status === "wanted"
                                ? "#92400e"
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
