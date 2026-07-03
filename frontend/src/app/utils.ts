export function fmt(n: number) {
  if (Math.abs(n) < 0.01) return "₹0";
  const val = n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  if (val === "-0") return "₹0";
  return "₹" + val;
}

export function fmtShort(n: number) {
  if (Math.abs(n) < 0.01) return "₹0";
  const absVal = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (absVal >= 100000) return "₹" + sign + (absVal / 100000).toFixed(1) + "L";
  if (absVal >= 1000) return "₹" + sign + (absVal / 1000).toFixed(1) + "K";
  return "₹" + sign + absVal.toFixed(1).replace(/\.0$/, "");
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export function mkFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function mkLabel(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
