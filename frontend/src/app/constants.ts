import {
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
  Period,
  PurchaseCategory,
  PurchaseUnit,
} from "./types";

export const SHOPS: Record<ShopId, { name: string; color: string; emoji: string }> = {
  shop1: { name: "Shop 1 — Theppakulam", color: "#1a7a3c", emoji: "🥤" },
  shop2: { name: "Shop 2 — Anuppanandi", color: "#0ea5e9", emoji: "🍹" },
};

export const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  all: "All Time",
};

export const PURCHASE_ITEMS: Record<PurchaseCategory, { name: string; unit: PurchaseUnit; basePrice: number }[]> = {
  "Fruits & Vegetables": [
    { name: "Watermelon", unit: "pcs", basePrice: 90 },
    { name: "Papaya", unit: "kg", basePrice: 18 },
    { name: "Guava", unit: "kg", basePrice: 35 },
    { name: "Pineapple", unit: "kg", basePrice: 55 },
    { name: "Grapes", unit: "kg", basePrice: 120 },
    { name: "Amla", unit: "kg", basePrice: 80 },
    { name: "Mosambi", unit: "pcs", basePrice: 45 },
    { name: "Apple", unit: "kg", basePrice: 150 },
    { name: "Orange", unit: "kg", basePrice: 80 },
    { name: "Pomegranate", unit: "boxes", basePrice: 250 },
    { name: "Fig fruit", unit: "boxes", basePrice: 180 },
    { name: "Red banana", unit: "pcs", basePrice: 10 },
    { name: "Pacha banana", unit: "pcs", basePrice: 6 },
    { name: "Nentheram pazham", unit: "pcs", basePrice: 8 },
    { name: "Musk melon", unit: "pcs", basePrice: 100 },
    { name: "Lemon", unit: "pcs", basePrice: 4 },
    { name: "Mint leaves", unit: "packets", basePrice: 15 },
  ],
  "Packaging & Plastics": [
    { name: "300 ml cup with lid", unit: "packets", basePrice: 120 },
    { name: "350 ml cup with lid", unit: "packets", basePrice: 140 },
    { name: "750 ml cup", unit: "packets", basePrice: 180 },
    { name: "Hand gloves", unit: "packets", basePrice: 50 },
    { name: "Tissue paper", unit: "packets", basePrice: 45 },
    { name: "Straw", unit: "packets", basePrice: 90 },
    { name: "spoon", unit: "packets", basePrice: 60 },
    { name: "PVC fork", unit: "packets", basePrice: 70 },
    { name: "Big bowl", unit: "packets", basePrice: 200 },
    { name: "Salad box G plate", unit: "packets", basePrice: 150 },
    { name: "Printing roll (2 inch)", unit: "packets", basePrice: 80 },
    { name: "Cellotape roll (1 inch)", unit: "pcs", basePrice: 20 },
    { name: "Rubber band", unit: "packets", basePrice: 40 },
    { name: "250ml rc parsal cup", unit: "packets", basePrice: 110 },
    { name: "Silver cover – 6×9", unit: "kg", basePrice: 130 },
    { name: "Silver cover – 8×10", unit: "kg", basePrice: 130 },
    { name: "350ml pet bottele", unit: "pcs", basePrice: 6 },
  ],
  "Other Supplies": [
    { name: "Milk", unit: "liters", basePrice: 60 },
    { name: "Sugar", unit: "kg", basePrice: 42 },
    { name: "Curd", unit: "liters", basePrice: 50 },
    { name: "Ice cubes", unit: "kg", basePrice: 10 },
    { name: "RO Water", unit: "liters", basePrice: 5 },
    { name: "Soda", unit: "pcs", basePrice: 20 },
    { name: "7Up", unit: "pcs", basePrice: 40 },
    { name: "Oreo", unit: "packets", basePrice: 30 },
    { name: "KitKat", unit: "boxes", basePrice: 250 },
    { name: "Boost", unit: "packets", basePrice: 15 },
    { name: "wipping cream", unit: "packets", basePrice: 180 },
    { name: "fresh cream", unit: "packets", basePrice: 120 },
    { name: "custard powder", unit: "pcs", basePrice: 45 },
  ],
  "Ice Cream": [
    { name: "Vanilla", unit: "pcs", basePrice: 150 },
    { name: "Strawberry", unit: "pcs", basePrice: 160 },
    { name: "Black currant", unit: "boxes", basePrice: 220 },
    { name: "Chocolate", unit: "boxes", basePrice: 180 },
    { name: "Falooda sev", unit: "packets", basePrice: 40 },
    { name: "Sabja seeds", unit: "kg", basePrice: 280 },
    { name: "Strawberry jelly", unit: "boxes", basePrice: 90 },
    { name: "Pineapple jelly", unit: "boxes", basePrice: 90 },
  ],
  "Dry Fruits": [
    { name: "Dry grapes (black and yellow)", unit: "kg", basePrice: 350 },
    { name: "Cashew", unit: "kg", basePrice: 900 },
    { name: "Badam", unit: "kg", basePrice: 850 },
    { name: "Dates", unit: "kg", basePrice: 240 },
  ],
  "Cleaning Utility": [
    { name: "Scrubber", unit: "packets", basePrice: 30 },
    { name: "Vim bar liquid", unit: "packets", basePrice: 45 },
    { name: "Cleaning cloth", unit: "packets", basePrice: 40 },
    { name: "Dustbin cover(small and extra large)", unit: "packets", basePrice: 50 },
  ],
  "Essence": [
    { name: "Rose milk Syrup", unit: "pcs", basePrice: 180 },
    { name: "Yellow sarbath", unit: "pcs", basePrice: 140 },
    { name: "Milk sarbath", unit: "pcs", basePrice: 150 },
    { name: "Red sarbath", unit: "pcs", basePrice: 140 },
    { name: "Strawberry syrup", unit: "pcs", basePrice: 160 },
    { name: "Chocolate syrup", unit: "pcs", basePrice: 130 },
    { name: "Black currant syrup", unit: "pcs", basePrice: 170 },
    { name: "Butterscotch syrup", unit: "pcs", basePrice: 170 },
    { name: "Litchi syrup", unit: "pcs", basePrice: 160 },
    { name: "Blueberry syrup", unit: "pcs", basePrice: 180 },
    { name: "Mango syrup", unit: "pcs", basePrice: 160 },
    { name: "Blue curacao (mojito)", unit: "pcs", basePrice: 220 },
    { name: "Green mint", unit: "pcs", basePrice: 160 },
    { name: "Jaljira powder", unit: "packets", basePrice: 50 },
  ],
};

export const ALL_ITEMS_FLAT = Object.entries(PURCHASE_ITEMS).flatMap(([cat, items]) =>
  items.map((i) => ({ ...i, category: cat as PurchaseCategory }))
);

export const CATEGORY_ICONS: Record<PurchaseCategory, typeof Leaf> = {
  "Fruits & Vegetables": Leaf,
  "Packaging & Plastics": Package,
  "Other Supplies": ShoppingCart,
  "Ice Cream": IceCream,
  "Dry Fruits": Nut,
  "Cleaning Utility": Sparkles,
  "Essence": Droplet,
};

export const CATEGORY_COLORS_BG: Record<PurchaseCategory, string> = {
  "Fruits & Vegetables": "#dcfce7",
  "Packaging & Plastics": "#dbeafe",
  "Other Supplies": "#fef3c7",
  "Ice Cream": "#fae8ff",
  "Dry Fruits": "#ffedd5",
  "Cleaning Utility": "#e0f2fe",
  "Essence": "#f3e8ff",
};

export const CATEGORY_COLORS_TEXT: Record<PurchaseCategory, string> = {
  "Fruits & Vegetables": "#166534",
  "Packaging & Plastics": "#1e40af",
  "Other Supplies": "#92400e",
  "Ice Cream": "#86198f",
  "Dry Fruits": "#9a3412",
  "Cleaning Utility": "#0369a1",
  "Essence": "#6b21a8",
};

export const INCOME_CATEGORIES = ["Full Day Income"];
export const EXPENSE_CATEGORIES = [
  "Fruits & Vegetables",
  "Packaging & Plastics",
  "Other Supplies",
  "Ice Cream",
  "Dry Fruits",
  "Cleaning Utility",
  "Essence",
  "Rent",
  "Utilities",
  "Staff Wages",
  "Equipment",
  "Marketing",
  "Miscellaneous",
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Full Day Income": "#1a7a3c",
  "Fresh Juices": "#1a7a3c",
  Smoothies: "#34d399",
  "Shots & Boosters": "#a3e635",
  "Combo Meals": "#fbbf24",
  Catering: "#f97316",
  "Online Orders": "#60a5fa",
  "Fruits & Vegetables": "#10b981",
  "Packaging & Plastics": "#3b82f6",
  "Other Supplies": "#f59e0b",
  "Ice Cream": "#ec4899",
  "Dry Fruits": "#f97316",
  "Cleaning Utility": "#06b6d4",
  "Essence": "#8b5cf6",
  "Fruits & Produce": "#ef4444",
  Equipment: "#8b5cf6",
  Rent: "#ec4899",
  Utilities: "#f59e0b",
  "Staff Wages": "#0ea5e9",
  Packaging: "#14b8a6",
  Marketing: "#e879f9",
  Miscellaneous: "#94a3b8",
};
