import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: string | Date): string {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(d);
  } catch {
    return "—";
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export function getRoleBadgeClass(role: string): string {
  const map: Record<string, string> = {
    SUPER_ADMIN: "bg-red-500/20 text-red-400 border-red-500/30",
    ADMIN: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    PROFESSOR: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    STUDENT: "bg-green-500/20 text-green-400 border-green-500/30",
  };
  return map[role] ?? "bg-gray-500/20 text-gray-400";
}

export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    PAID: "bg-green-500/20 text-green-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    OVERDUE: "bg-red-500/20 text-red-400",
    WAIVED: "bg-gray-500/20 text-gray-400",
    PRESENT: "bg-green-500/20 text-green-400",
    ABSENT: "bg-red-500/20 text-red-400",
    LATE: "bg-yellow-500/20 text-yellow-400",
    EXCUSED: "bg-blue-500/20 text-blue-400",
  };
  return map[status] ?? "bg-gray-500/20 text-gray-400";
}
