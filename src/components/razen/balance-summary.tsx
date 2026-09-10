import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock3,
  Eye,
  EyeOff,
  Landmark,
  QrCode,
  RefreshCw,
  Send,
  Wallet,
} from "lucide-react";
import { BrandMark } from "@/components/razen/brand-mark";
import { Glyph } from "@/components/razen/glyph";
import { fadeUp, stagger, enterEase } from "@/components/razen/motion";
import { baht } from "@/lib/razen/format";
import { useRazen } from "@/lib/razen/store";
import { cn } from "@/lib/utils";

export function BalanceSummary() {
  const accounts = useRazen((s) => s.accounts);
  const activeId = useRazen((s) => s.activeAccountId);
  const getBalance = useRazen((s) => s.balance);
  const getStats = useRazen((s) => s.stats);
  const dailySpent = useRazen((s) => s.dailySpent);
  const limit = useRazen((s) => s.settings.dailyLimit);
  const refreshBalance = useRazen((s) => s.refreshBalance);
  const setActiveAccount = useRazen((s) => s.setActiveAccount);

  const [hidden, setHidden] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const reduce = useReducedMotion();

  const acc = accounts.find((a) => a.id === activeId) ?? accounts[0];
  const synced = acc?.walletBalance != null;
  const balance = getBalance();
  const stats = getStats();
  const spent = dailySpent();
  const remain = Math.max(0, limit - spent);
  const usedPct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;

  async function handleRefresh() {
    if (syncing) return;
    setSyncing(true);
    await refreshBalance();
    setSyncing(false);
  }

  const quickActions = [
    { to: "/transfer" as const, search: { method: "p2p" as const }, icon: Send, label: "โอน" },
    { to: "/transfer" as const, search: { method: "promptpay" as const }, icon: QrCode, label: "สแกน" },
    { to: "/transfer" as const, search: { method: "bank" as const }, icon: Landmark, label: "ธนาคาร" },
    { to: "/history" as const, icon: Clock3, label: "ประวัติ" },
  ];

  return (
    <motion.div
      className="stack-dense mx-auto max-w-3xl"
      initial={reduce ? false : "hidden"}
      animate="visible"
      variants={stagger}
    >
      {/* Hero balance card */}
      <motion.section className="tmn-card px-5 py-6 sm:px-8 sm:py-8" variants={fadeUp}>
        <div className="flex items-center gap-3">
          <img
            src="/landing/hostess.webp"
            alt=""
            width={44}
            height={44}
            className="size-10 rounded-full object-cover object-top ring-2 ring-white/50 sm:size-12"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs opacity-80">สวัสดี</p>
            <p className="truncate text-sm font-medium sm:text-base">
              {acc?.nickname || "ยังไม่เชื่อมกระเป๋า"}
            </p>
          </div>
          <BrandMark id="truemoney" alt="TrueMoney" className="size-8 rounded-full bg-white p-0.5 sm:size-10" />
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs opacity-80">ยอดคงเหลือในกระเป๋า</p>
            <p className="mt-1 font-sans text-4xl font-bold leading-none tracking-tight tabular-nums sm:text-6xl">
              {synced ? (hidden ? "฿ • • • •" : baht(balance)) : "—"}
            </p>
            <p className="mt-2 font-mono text-xs opacity-70">{acc?.masked || "ตั้งค่ากระเป๋า"}</p>
          </div>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            className="shrink-0 rounded-full bg-white/20 p-2.5 text-brand-fg transition-colors hover:bg-white/30"
            aria-label={hidden ? "แสดงยอด" : "ซ่อนยอด"}
          >
            {hidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={syncing}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-medium text-brand-fg transition-colors hover:bg-white/30 disabled:opacity-50"
        >
          <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
          {syncing ? "กำลังซิงก์…" : "รีเฟรชยอด"}
        </button>
      </motion.section>

      {/* Daily quota */}
      <motion.section className="panel p-4 sm:p-5" variants={fadeUp}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">โควต้าวันนี้</span>
          <span className="font-mono text-xs text-muted">
            ใช้ {baht(spent)} · เหลือ {baht(remain)}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
          <motion.div
            className="h-full rounded-full bg-brand-fg"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${usedPct}%` }}
            transition={enterEase}
          />
        </div>
        <p className="mt-1.5 text-right text-[11px] text-subtle">{usedPct}% ของวงเงิน {baht(limit)}</p>
      </motion.section>

      {/* Quick stats */}
      <motion.div className="grid grid-cols-3 gap-2 sm:gap-3" variants={fadeUp}>
        <StatCard icon={ArrowDownLeft} tone="in" label="รับเข้า" value={baht(stats.incoming)} />
        <StatCard icon={ArrowUpRight} tone="gold" label="จ่ายออก" value={baht(stats.outgoing)} />
        <StatCard icon={Clock3} tone="warn" label="ค้างส่ง" value={String(stats.pending)} />
      </motion.div>

      {/* Quick actions */}
      <motion.div className="grid grid-cols-4 gap-2" variants={fadeUp}>
        {quickActions.map((a) => (
          <motion.div key={a.label} variants={fadeUp} whileTap={{ scale: 0.96 }}>
            <Link
              to={a.to}
              search={a.search}
              className="panel flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted transition-opacity hover:opacity-90 sm:text-xs"
            >
              <a.icon className="size-5 text-brand" strokeWidth={1.75} />
              {a.label}
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Multiple accounts */}
      {accounts.length > 1 && (
        <motion.section className="panel p-4 sm:p-5" variants={fadeUp}>
          <div className="mb-3 flex items-center gap-2">
            <Glyph icon={Wallet} tone="gold" size="sm" />
            <h2 className="text-sm font-semibold">กระเป๋าทั้งหมด</h2>
          </div>
          <ul className="space-y-2">
            {accounts.map((a) => {
              const isActive = a.id === activeId;
              const bal = getBalance(a.id);
              const aSynced = a.walletBalance != null;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setActiveAccount(a.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isActive ? "bg-brand/12" : "hover:bg-white/5",
                    )}
                  >
                    <BrandMark id="truemoney" alt="" className="size-8 shrink-0 rounded-full bg-white p-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.nickname}</p>
                      <p className="font-mono text-[11px] text-subtle">{a.masked}</p>
                    </div>
                    <p className="shrink-0 font-sans text-sm font-semibold tabular-nums">
                      {aSynced ? baht(bal) : "—"}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>
      )}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof Send;
  tone: "in" | "gold" | "warn";
  label: string;
  value: string;
}) {
  const gTone = tone === "in" ? "in" : tone === "warn" ? "warn" : "gold";
  const valCls = tone === "in" ? "text-in" : "";
  return (
    <div className="panel flex flex-col items-center gap-1.5 px-2 py-3.5 sm:px-4">
      <Glyph icon={Icon} tone={gTone} size="sm" />
      <p className="text-[10px] tracking-wide text-subtle sm:text-[11px]">{label}</p>
      <p className={cn("font-sans text-base font-semibold tabular-nums sm:text-xl", valCls)}>{value}</p>
    </div>
  );
}
