import { createFileRoute } from "@tanstack/react-router";
import { BalanceSummary } from "@/components/razen/balance-summary";

export const Route = createFileRoute("/summary")({ component: SummaryPage });

function SummaryPage() {
  return <BalanceSummary />;
}
