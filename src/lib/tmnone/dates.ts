/**
 * Pure date helpers used by both client and server code.
 *
 * Split out of `bootstrap.ts` so client modules can import `ymd` / `addYmd`
 * without pulling in `TMNOne.js` (which imports `node:fs` and breaks the
 * browser bundle). Server-only code that also needs `configureTmn` /
 * `runOfficialExample` imports those from `bootstrap.ts` instead.
 */

export function ymd(offsetDays: number, at = Date.now()) {
  const t = new Date(at + offsetDays * 86_400_000);
  return t.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

/** Calendar add on a YYYY-MM-DD string — no UTC parse of the date-only form. */
export function addYmd(iso: string, days: number) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return dt.toISOString().slice(0, 10);
}

export function firstReportId(transactions: unknown): string {
  const walk = (v: unknown): string => {
    if (!v) return "";
    if (Array.isArray(v)) {
      for (const item of v) {
        const hit = walk(item);
        if (hit) return hit;
      }
      return "";
    }
    if (typeof v === "object") {
      const rec = v as Record<string, unknown>;
      const id = rec.report_id ?? rec.reportId;
      if (typeof id === "string" && id.trim()) return id.trim();
      for (const val of Object.values(rec)) {
        const hit = walk(val);
        if (hit) return hit;
      }
    }
    return "";
  };
  return walk(transactions);
}
