<script setup lang="ts">
import { h } from "vue";
import { agentFitSignals, type AgentFitSignal, type AgentFitState } from "./agent";
/**
 * How well the connected agent follows the way Startodel teaches. It is read from behaviour, the
 * Tools the agent calls and the Lessons it writes, and never from the name of a model. It gives
 * the learner advice, not a grade.
 */
const props = withDefaults(
  defineProps<{
    result: AgentFitState;
    /** The state of each signal. A signal left out has no data yet. */
    signals?: Partial<Record<AgentFitSignal, AgentFitState>>;
    /** compact is one line that opens the signals. full lists them with advice and a prompt. */
    size?: "compact" | "full";
    /** Replaces the prompt composed from the signals that are off. */
    prompt?: string;
  }>(),
  { size: "full" },
);
const { t } = useI18n();
const results = computed(() => ({
  good: { bars: 3, word: t("connectedAgent.fitGood"), note: t("connectedAgent.fitGoodNote") },
  attention: {
    bars: 2,
    word: t("connectedAgent.fitAttention"),
    note: t("connectedAgent.fitAttentionNote"),
  },
  poor: { bars: 1, word: t("connectedAgent.fitPoor"), note: t("connectedAgent.fitPoorNote") },
  unknown: {
    bars: 0,
    word: t("connectedAgent.fitUnknown"),
    note: t("connectedAgent.fitUnknownNote"),
  },
}));
const overall = computed(() => results.value[props.result]);
const stateWords = computed(() => ({
  good: t("connectedAgent.signalGood"),
  attention: t("connectedAgent.fitAttention"),
  poor: t("connectedAgent.signalPoor"),
  unknown: t("connectedAgent.signalUnknown"),
}));
const catalog = computed(() => ({
  guide: {
    name: t("connectedAgent.guide"),
    good: t("connectedAgent.guideGood"),
    attention: t("connectedAgent.guideAttention"),
    poor: t("connectedAgent.guidePoor"),
    fix: t("connectedAgent.guideFix"),
  },
  tools: {
    name: t("connectedAgent.tools"),
    good: t("connectedAgent.toolsGood"),
    attention: t("connectedAgent.toolsAttention"),
    poor: t("connectedAgent.toolsPoor"),
    fix: t("connectedAgent.toolsFix"),
  },
  variety: {
    name: t("connectedAgent.variety"),
    good: t("connectedAgent.varietyGood"),
    attention: t("connectedAgent.varietyAttention"),
    poor: t("connectedAgent.varietyPoor"),
    fix: t("connectedAgent.varietyFix"),
  },
  evidence: {
    name: t("connectedAgent.evidence"),
    good: t("connectedAgent.evidenceGood"),
    attention: t("connectedAgent.evidenceAttention"),
    poor: t("connectedAgent.evidencePoor"),
    fix: t("connectedAgent.evidenceFix"),
  },
}));
const rows = computed(() =>
  agentFitSignals.map((id) => {
    const state = props.signals?.[id] ?? "unknown";
    const texts = catalog.value[id];
    return {
      id,
      state,
      off: state === "attention" || state === "poor",
      name: texts.name,
      word: stateWords.value[state],
      advice: state === "unknown" ? undefined : texts[state],
      fix: texts.fix,
    };
  }),
);
const fix = computed(() => {
  if (props.prompt) return props.prompt;
  const off = rows.value.filter((row) => row.off);
  if (!off.length) return undefined;
  return [t("connectedAgent.fixIntro"), ...off.map((row) => "- " + row.fix)].join("\n");
});

/** The pad of the Verdict motif, in ink: full, half, hollow, or a dashed ring before any data. */
function Pad({ state }: { state: AgentFitState }) {
  const ring = (r: number, width: number, dash?: string) =>
    h("circle", {
      cx: 8,
      cy: 8,
      r,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": width,
      "stroke-dasharray": dash,
    });
  const shape =
    state === "good"
      ? [h("circle", { cx: 8, cy: 8, r: 6.5, fill: "currentColor" })]
      : state === "attention"
        ? [h("path", { d: "M8 1.5a6.5 6.5 0 0 0 0 13z", fill: "currentColor" }), ring(5.75, 1.5)]
        : state === "poor"
          ? [ring(5.25, 2.5)]
          : [ring(5.75, 1.5, "2.2 2.3")];
  return h("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" }, shape);
}
</script>
<template>
  <UiPopover v-if="size === 'compact'" :title="t('connectedAgent.fitTitle')" align="start">
    <template #trigger>
      <button type="button" class="s-agent-fit-chip" :class="'s-agent-fit-chip--' + result">
        <span class="s-agent-fit__bars" aria-hidden="true">
          <i v-for="n in 3" :key="n" :class="{ 'is-on': n <= overall.bars }" />
        </span>
        <span class="s-sr">{{ t("connectedAgent.fitTitle") }}:</span>
        <span class="s-agent-fit-chip__word">{{ overall.word }}</span>
        <UiIcon name="chevron-down" :size="12" class="s-agent-fit-chip__caret" />
      </button>
    </template>
    <ul class="s-agent-fit__signals s-agent-fit__signals--compact">
      <li v-for="row in rows" :key="row.id" class="s-agent-fit__signal">
        <Pad :state="row.state" class="s-agent-fit__pad" />
        <p class="s-agent-fit__line">
          <span class="s-agent-fit__name">{{ row.name }}</span>
          <span class="s-agent-fit__state">{{ row.word }}</span>
        </p>
        <p v-if="row.off" class="s-agent-fit__advice">{{ row.advice }}</p>
      </li>
    </ul>
  </UiPopover>
  <section v-else class="s-agent-fit" :aria-label="t('connectedAgent.fitTitle')">
    <header class="s-agent-fit__head">
      <span class="s-agent-fit__bars s-agent-fit__bars--lg" aria-hidden="true">
        <i v-for="n in 3" :key="n" :class="{ 'is-on': n <= overall.bars }" />
      </span>
      <div class="s-agent-fit__summary">
        <p class="s-agent-fit__kicker">{{ t("connectedAgent.fitTitle") }}</p>
        <p class="s-agent-fit__result">{{ overall.word }}</p>
        <p class="s-agent-fit__note">{{ overall.note }}</p>
      </div>
    </header>
    <ul class="s-agent-fit__signals">
      <li v-for="row in rows" :key="row.id" class="s-agent-fit__signal">
        <Pad :state="row.state" class="s-agent-fit__pad" />
        <p class="s-agent-fit__line">
          <span class="s-agent-fit__name">{{ row.name }}</span>
          <span class="s-agent-fit__state">{{ row.word }}</span>
        </p>
        <p v-if="row.advice" class="s-agent-fit__advice">{{ row.advice }}</p>
      </li>
    </ul>
    <UiAgentPrompt v-if="fix" :text="fix" :label="t('connectedAgent.fixLabel')" compact />
  </section>
</template>
<style scoped>
.s-agent-fit {
  container: s-agent-fit / inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  min-width: 0;
}
.s-agent-fit__head {
  display: flex;
  align-items: flex-start;
  gap: var(--s-4);
}
.s-agent-fit__summary {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.s-agent-fit__kicker {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-agent-fit__result {
  font: 600 var(--s-text-xl) / 1.15 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.03em;
}
.s-agent-fit__note {
  max-width: 34rem;
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
  text-wrap: pretty;
}
/* Three bars, as on a phone: the count carries the result, the word repeats it. */
.s-agent-fit__bars {
  --_u: 4px;
  flex: none;
  display: inline-flex;
  align-items: flex-end;
  gap: calc(var(--_u) * 0.5);
  height: calc(var(--_u) * 3.5);
}
.s-agent-fit__bars--lg {
  --_u: 8px;
  margin-top: var(--s-1);
}
.s-agent-fit__bars i {
  width: var(--_u);
  border-radius: 0.5px;
  box-shadow: inset 0 0 0 1px var(--s-line-strong);
}
.s-agent-fit__bars i:nth-child(1) {
  height: 44%;
}
.s-agent-fit__bars i:nth-child(2) {
  height: 72%;
}
.s-agent-fit__bars i:nth-child(3) {
  height: 100%;
}
.s-agent-fit__bars i.is-on {
  background: var(--s-copper-fill);
  box-shadow: none;
}
.s-agent-fit__signals {
  display: grid;
  list-style: none;
  border-top: 1px solid var(--s-line);
}
.s-agent-fit__signal {
  display: grid;
  grid-template-columns: 0.75rem minmax(0, 1fr);
  gap: var(--s-1) var(--s-3);
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--s-line);
}
.s-agent-fit__pad {
  width: 0.75rem;
  height: 0.75rem;
  margin-top: 0.25rem;
  color: var(--s-ink-2);
}
.s-agent-fit__line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0 var(--s-3);
}
.s-agent-fit__name {
  font-weight: 600;
  line-height: 1.35;
  color: var(--s-ink);
}
.s-agent-fit__state {
  font: 500 var(--s-text-2xs) / 1.6 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--s-ink-3);
}
.s-agent-fit__advice {
  grid-column: 2;
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
  text-wrap: pretty;
}
@container s-agent-fit (max-width: 30rem) {
  .s-agent-fit__line {
    display: grid;
    justify-content: start;
  }
}
.s-agent-fit__signals--compact {
  margin-top: var(--s-3);
}
.s-agent-fit__signals--compact .s-agent-fit__line {
  display: grid;
  justify-content: start;
}
.s-agent-fit__signals--compact .s-agent-fit__signal {
  padding: var(--s-2) 0;
}
.s-agent-fit__signals--compact .s-agent-fit__signal:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.s-agent-fit__signals--compact .s-agent-fit__name {
  font-weight: 500;
}
.s-agent-fit-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--s-control-sm);
  padding: 0 var(--s-2);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  color: var(--s-ink);
  font-size: var(--s-text-sm);
  font-weight: 600;
  white-space: nowrap;
  transition: border-color var(--s-dur-1) var(--s-ease);
}
.s-agent-fit-chip:hover,
.s-agent-fit-chip[data-state="open"] {
  border-color: var(--s-ink);
}
.s-agent-fit-chip--unknown .s-agent-fit-chip__word {
  color: var(--s-ink-2);
}
.s-agent-fit-chip__caret {
  color: var(--s-ink-3);
}
</style>
