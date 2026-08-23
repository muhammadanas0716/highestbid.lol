export function money(value: number): string {
  const n = Number(value) || 0;
  const whole = Math.round(n * 100) / 100;
  return Number.isInteger(whole)
    ? `$${whole.toLocaleString("en-US")}`
    : `$${whole.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function compact(value: number): string {
  return (Number(value) || 0).toLocaleString("en-US");
}

/** "just now" / "3 mins ago" / "2 hours ago" / "4 days ago" */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 45) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}
