import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import type { TabId } from "@/lib/calc/types";

const TABS: TabId[] = [
  "fees",
  "grid",
  "wealth",
  "cascade",
  "history",
  "estimator",
  "reflexivity",
];

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { tab?: TabId } => {
    const t = search.tab;
    if (typeof t === "string" && TABS.includes(t as TabId)) return { tab: t as TabId };
    return {};
  },
  component: Home,
});

function Home() {
  const { tab } = Route.useSearch();
  return <AppShell urlTab={tab} />;
}
