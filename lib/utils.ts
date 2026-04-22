export const formatPrice = (n: number) =>
  n >= 10000000 ? `PKR ${(n / 10000000).toFixed(1)} Cr`
  : n >= 100000 ? `PKR ${(n / 100000).toFixed(1)} Lac`
  : `PKR ${n.toLocaleString()}`;

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

export const statusColor = (s: string) =>
  s === "ACTIVE" || s === "CONVERTED" ? "bg-green-100 text-green-700"
  : s === "PENDING" || s === "NEW" ? "bg-yellow-100 text-yellow-700"
  : s === "SUSPENDED" || s === "CLOSED" ? "bg-red-100 text-red-700"
  : "bg-gray-100 text-gray-600";
