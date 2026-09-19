import { useMemo } from "react";
import { motion } from "motion/react";
import { ArrowDownLeft, ArrowUpRight, Receipt, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { baht } from "@/lib/razen/format";
import { ymd } from "@/lib/tmnone/dates";
import type { Transaction } from "@/lib/razen/types";

export type PeriodPreset = "week" | "month" | "7d" | "30d" | "custom";

const PRESETS: { id: PeriodPreset; label: string }[] = [
  { id: "week", label: "สัปดาห์นี้" },
  { id: "month", label: "เดือนนี้" },
  { id: "7d", label: "7 วัน" },
  { id: "30d", label: "30 วัน" },
  { id: "custom", label: "กำหนดเอง" },
];

/** Compute start/end (YYYY-MM-DD) for a calendar or rolling preset. */
export function presetRange(preset: Exclude<PeriodPreset, "custom">): { start: string; end: string } {
  const now = new Date();
  const end = ymd(0);
  if (preset === "7d") return { start: ymd(-6), end };
  if (preset === "30d") return { start: ymd(-29), end };
  if (preset === "week") {
    // ISO week — Monday start
    const dow = now.getDay(); // 0=Sun .. 6=Sat
    const back = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - back);
    monday.setHours(0, 0, 0, 0);
    const start = monday.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    return { start, end };
  }
  // month — 1st of current month
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = first.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  return { start, end };
}

/** Detect which preset matches the given start/end, or "custom". */
export function detectPreset(start: string, end: string): PeriodPreset {
  const today = ymd(0);
  if (end !== today) return "custom";
  for (const p of ["week", "month", "7d", "30d"] as const) {
    if (presetRange(p).start === start) return p;
  }
  return "custom";
}

export function PeriodFilter({
  preset,
  onPreset,
  rows,
}: {
  preset: PeriodPreset;
  onPreset: (p: PeriodPreset) => void;
  rows: Transaction[];
}) {
  const summary = useMemo(() => {
    let incoming = 0;
    let outgoing = 0;
    let count = 0;
    for (const t of rows) {
      if (t.status === "failed") continue;
      count += 1;
      if (t.direction === "in" && t.status === "completed") incoming += t.amount;
      else if (t.direction === "out") outgoing += t.amount;
    }
    const net = incoming - outgoing;
    return { incoming, outgoing, net, count };
  }, [rows]);

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="เลือกช่วงเวลา"
        className="glass-frost flex w-full items-center gap-1 rounded-[var(--radius-lg)] p-1.5"
      >
        {PRESETS.map((p) => {
          const active = preset === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onPreset(p.id)}
              className={cn(
                "relative flex-1 rounded-[var(--radius-md)] px-3 py-2 text-xs font-medium transition-colors duration-200",
                active ? "text-brand-fg" : "text-muted hover:text-fg",
              )}
            >
              {active && (
                <motion.span
                  layoutId="period-pill"
                  className="absolute inset-0 rounded-[var(--radius-md)] bg-gradient-to-b from-[#f0d78a] to-[#c4a046] shadow-[var(--shadow-gold)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 whitespace-nowrap">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="stat-strip">
        <div className="stat-cell flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-in/12 text-in">
            <ArrowDownLeft className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] text-subtle">รับเข้า</span>
            <span className="block font-semibold tabular-nums text-in">{baht(summary.incoming)}</span>
          </span>
        </div>
        <div className="stat-cell flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand/12 text-brand">
            <ArrowUpRight className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] text-subtle">จ่ายออก</span>
            <span className="block font-semibold tabular-nums text-brand">{baht(summary.outgoing)}</span>
          </span>
        </div>
        <div className="stat-cell flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              summary.net >= 0 ? "bg-in/12 text-in" : "bg-danger/12 text-danger",
            )}
          >
            <Scale className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] text-subtle">คงเหลือสุทธิ</span>
            <span
              className={cn(
                "block font-semibold tabular-nums",
                summary.net >= 0 ? "text-in" : "text-danger",
              )}
            >
              {baht(summary.net)}
            </span>
          </span>
        </div>
        <div className="stat-cell flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-elevated text-muted">
            <Receipt className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] text-subtle">รายการ</span>
            <span className="block font-semibold tabular-nums text-fg">{summary.count.toLocaleString("th-TH")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
