import type { AgentFitSignal, AgentFitState } from "../../ui/agent";

/**
 * Sample data for the planned components about people: the connected agent, comments, access,
 * analytics and points. One Track about PostgreSQL runs through all of it. Nothing here is read
 * from or written to the database.
 */
type Localized<T> = { ru: T; en: T };

function usePick() {
  const { locale } = useI18n();
  return <T>(value: Localized<T>): T => (locale.value === "ru" ? value.ru : value.en);
}

/** Dates count back from the day the page is rendered, so the sample never looks stale. */
function useDaysAgo() {
  const today = useState("planned-people-day", () => new Date().toISOString().slice(0, 10));
  return (days: number, hour = 9) =>
    new Date(Date.parse(today.value) - days * 86400000 + hour * 3600000).toISOString();
}

export function useSampleAgents() {
  const pick = usePick();
  const daysAgo = useDaysAgo();
  return computed(() => [
    {
      id: "claude",
      name: "Claude Code",
      version: "2.1.4",
      via: "oauth" as const,
      status: "active" as const,
      lastActiveAt: daysAgo(0),
    },
    {
      id: "cursor",
      name: "Cursor",
      version: "1.9",
      via: "token" as const,
      tokenName: pick({ ru: "Рабочий ноутбук", en: "Work laptop" }),
      status: "idle" as const,
      lastActiveAt: daysAgo(3),
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      via: "oauth" as const,
      status: "idle" as const,
      lastActiveAt: daysAgo(12),
    },
    {
      id: "unknown",
      name: null,
      via: "token" as const,
      tokenName: pick({ ru: "Домашний сервер", en: "Home server" }),
      status: "unused" as const,
    },
  ]);
}

export const sampleAgentFit: Record<
  AgentFitState,
  { result: AgentFitState; signals?: Partial<Record<AgentFitSignal, AgentFitState>> }
> = {
  good: {
    result: "good",
    signals: { guide: "good", tools: "good", variety: "good", evidence: "good" },
  },
  attention: {
    result: "attention",
    signals: { guide: "good", tools: "good", variety: "attention", evidence: "attention" },
  },
  poor: {
    result: "poor",
    signals: { guide: "poor", tools: "attention", variety: "poor", evidence: "unknown" },
  },
  unknown: { result: "unknown" },
};
