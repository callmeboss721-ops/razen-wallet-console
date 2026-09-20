import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Clock3,
  Gift,
  Home,
  Send,
  Settings2,
  Wallet,
} from "lucide-react";
import { Toaster } from "sonner";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RazenWordmark } from "@/components/razen/logo";
import { enterEase, exitEase } from "@/components/razen/motion";
import { BrandMark } from "@/components/razen/brand-mark";
import { Glyph, type GlyphTone } from "@/components/razen/glyph";
import { NoticeBell } from "@/components/razen/notice-bell";
import { ReceiptSheet } from "@/components/razen/receipt-sheet";
import { SyncOverlay } from "@/components/razen/sync-overlay";
import { useRazen } from "@/lib/razen/store";
import { unlockAudio, playSound } from "@/lib/razen/audio";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/desk", label: "ภาพรวม", short: "ภาพรวม", icon: Home, tone: "gold" },
  { to: "/transfer", label: "โอน", short: "โอน", icon: Send, tone: "teal" },
  { to: "/history", label: "ประวัติ", short: "ประวัติ", icon: Clock3, tone: "warn" },
  { to: "/accounts", label: "กระเป๋า", short: "กระเป๋า", icon: Wallet, tone: "in" },
  { to: "/gifts", label: "ซองอั่งเปา", short: "ซอง", icon: Gift, tone: "danger" },
  { to: "/tools", label: "ตั้งค่า", short: "ตั้งค่า", icon: Settings2, tone: "muted" },
] as const;

const TITLE: Record<string, { kicker: string; title: string }> = {
  "/desk": { kicker: "วันนี้", title: "ภาพรวม" },
  "/transfer": { kicker: "โอน", title: "จ่าย" },
  "/history": { kicker: "ตรวจ", title: "ประวัติ" },
  "/accounts": { kicker: "วอลเล็ต", title: "กระเป๋า" },
  "/gifts": { kicker: "ซอง", title: "อั่งเปา" },
  "/tools": { kicker: "ระบบ", title: "ตั้งค่า" },
};

const MOBILE_NAV = NAV.filter((n) =>
  ["/", "/desk", "/transfer", "/history", "/gifts", "/tools"].includes(n.to),
);

export function Shell({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState("");
  const mark = useRazen((s) => s.markHydrated);
  const tick = useRazen((s) => s.tickPending);
  const syncWallet = useRazen((s) => s.syncWallet);
  const mode = useRazen((s) => s.settings.mode);
  const accounts = useRazen((s) => s.accounts);
  const activeId = useRazen((s) => s.activeAccountId);
  const acc = accounts.find((a) => a.id === activeId) ?? accounts[0];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    try {
      void useRazen.persist.rehydrate();
    } catch {
      /* ignore */
    }
    mark();
    tick();
    void syncWallet();
    setMounted(true);
    const id = window.setInterval(() => tick(), 2500);
    const c = window.setInterval(() => {
      setClock(
        new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    setClock(
      new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
    const unlock = () => {
      unlockAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.clearInterval(id);
      window.clearInterval(c);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [mark, tick, syncWallet]);

  const heading = TITLE[pathname] ?? TITLE["/desk"];

  useEffect(() => {
    if (mounted) playSound("whoosh");
  }, [pathname, mounted]);

  if (pathname === "/") {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <a href="#main" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <div className="atmosphere pointer-events-none fixed inset-0 z-0" aria-hidden />
      <aside
        className="glass-frost fixed inset-y-0 left-0 z-[var(--z-nav)] hidden w-56 flex-col border-r md:flex"
        aria-label="เมนูหลัก"
      >
        <div className="px-5 pt-7 pb-5">
          <RazenWordmark />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active =
              item.to === "/desk"
                ? pathname === "/desk"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                onClick={() => playSound("tap")}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-xl px-2 text-sm transition-colors duration-200",
                  active ? "bg-brand/12 text-brand" : "text-muted hover:bg-white/5 hover:text-fg",
                )}
              >
                <Glyph icon={item.icon} tone={item.tone as GlyphTone} size="sm" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 flex items-center gap-2 rounded-lg bg-elevated px-3 py-2.5 shadow-[var(--shadow-border)]">
          <BrandMark id="truemoney" alt="TrueMoney" className="size-8 rounded-full" />
          <div className="min-w-0">
            <p className="truncate text-sm">{acc?.nickname || "ยังไม่เชื่อมกระเป๋า"}</p>
            <p className="font-mono text-[10px] text-brand">
              {acc?.masked || "ตั้งค่ากระเป๋า"} · {mode === "live" ? "LIVE" : "SIM"}
            </p>
          </div>
        </div>
      </aside>

      <div className="relative z-10 md:pl-56">
        <header className="glass-frost sticky top-0 z-[var(--z-header)] flex items-center gap-3 border-b px-4 py-3 md:px-8">
          <div className="md:hidden">
            <RazenWordmark compact />
          </div>
          <div className="hidden min-w-0 items-center gap-3 md:flex">
            <Glyph
              icon={(NAV.find((n) => n.to === pathname) ?? NAV[0]).icon}
              tone={(NAV.find((n) => n.to === pathname) ?? NAV[0]).tone}
            />
            <div>
              <p className="kicker">{heading.kicker}</p>
              <h1 className="text-xl font-semibold leading-none tracking-tight">{heading.title}</h1>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-3">
            <NoticeBell />
            <span className="hidden items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-brand sm:inline-flex">
              <i className="size-1.5 rounded-full bg-brand pulse-ring" />
              {mode === "live" ? "LIVE" : "SIM"}
            </span>
            <div className="font-mono text-[11px] tabular-nums text-subtle">{clock}</div>
          </div>
        </header>
        <div className="razen-hud-line" aria-hidden />
        <main id="main" className="min-h-[calc(100dvh-56px)] w-full px-4 py-5 pb-24 md:px-8 md:py-6 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, transition: exitEase }}
              transition={enterEase}
            >
              {mounted ? children : <SkeletonDash />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <nav className="glass-frost fixed inset-x-0 bottom-0 z-[var(--z-nav)] md:hidden" aria-label="เมนูล่าง">
        <div className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {MOBILE_NAV.map((item) => {
            const active =
              item.to === "/desk"
                ? pathname === "/desk"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? "page" : undefined}
                onClick={() => playSound("tap")}
                className={cn(
                  "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] transition-colors duration-200",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <Glyph icon={item.icon} tone={active ? item.tone : "muted"} size="sm" />
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>

      {mounted && (
        <>
          <ReceiptSheet />
          <SyncOverlay />
        </>
      )}
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "glass-frost text-fg",
          },
        }}
      />
    </div>
  );
}

function SkeletonDash() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="shimmer h-40 rounded-[var(--radius-xl)]" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-20 rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,1fr)]">
        <div className="shimmer h-72 rounded-[var(--radius-lg)]" />
        <div className="shimmer h-72 rounded-[var(--radius-lg)]" />
      </div>
    </div>
  );
}
