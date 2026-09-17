// ============================================================
// FORMATTING HELPERS
// ============================================================
// Small, shared formatting functions. Before this file existed, the same
// `new Date(x).toLocaleDateString()` and `x.toLocaleString()} XAF` lines
// were copy-pasted across half the pages — change the format once here.
// ============================================================

// 75000 → "75,000 XAF"
export function formatXAF(amount: number): string {
  return `${amount.toLocaleString()} XAF`;
}

// ISO date string → "17/09/2026" (whatever the browser's locale is)
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

// ISO date string → date AND time
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

// The proposedTimes column is a JSON array of ISO strings. Turn it into
// one readable line: "6 Sep, 10:00 · 7 Sep, 14:00"
export function formatTimes(times: string[] | null): string {
  if (!times || times.length === 0) return "No times proposed";
  return times.map((time) => formatDateTime(time)).join(" · ");
}

// "APARTMENT" → "Apartment" (the backend sends SCREAMING_SNAKE enums)
export function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}