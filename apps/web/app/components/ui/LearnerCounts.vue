<script setup lang="ts">
import type { LearnerChange, LearnerCounts } from "./analytics";
/**
 * The headline readouts of a Track for its author: how many learners started, how many are
 * active, and how many read it to the end. A change from the previous period is an arrow and a
 * number.
 */
const props = withDefaults(
  defineProps<{
    counts?: LearnerCounts;
    change?: LearnerChange;
    state?: "ready" | "loading" | "empty";
    /** How many learners a Track needs before the readouts mean anything. */
    min?: number;
  }>(),
  { state: "ready", min: 5 },
);
const { t, n } = useI18n();
const countArgs = useCountArgs();
const readouts = computed(() => {
  const counts = props.counts;
  if (!counts) return [];
  const rate = counts.started ? Math.round((counts.completed / counts.started) * 100) : 0;
  const delta = (value: number | undefined, points = false) => {
    if (value === undefined) return undefined;
    const size = points ? t("analytics.points", { n: n(Math.abs(value)) }) : n(Math.abs(value));
    return {
      icon:
        value > 0 ? ("sort-up" as const) : value < 0 ? ("sort-down" as const) : ("steady" as const),
      size: value ? size : undefined,
      text:
        value > 0
          ? t("analytics.up", { n: size })
          : value < 0
            ? t("analytics.down", { n: size })
            : t("analytics.same"),
    };
  };
  return [
    {
      id: "started",
      label: t("analytics.started"),
      value: n(counts.started),
      hint: t("analytics.startedHint"),
      change: delta(props.change?.started),
    },
    {
      id: "active7",
      label: t("analytics.active7"),
      value: n(counts.active7),
      hint: t("analytics.active7Hint"),
      change: delta(props.change?.active7),
    },
    {
      id: "active30",
      label: t("analytics.active30"),
      value: n(counts.active30),
      hint: t("analytics.active30Hint"),
      change: delta(props.change?.active30),
    },
    {
      id: "completion",
      label: t("analytics.completion"),
      value: n(rate),
      unit: "%",
      hint: t("analytics.completionHint", {
        done: n(counts.completed),
        total: n(counts.started),
      }),
      change: delta(props.change?.completion, true),
    },
  ];
});
</script>
<template>
  <UiEmptyState v-if="state === 'empty'" compact icon="user" :title="t('analytics.tooFew')">
    {{ t("analytics.tooFewHint", countArgs(min)) }}
  </UiEmptyState>
  <div
    v-else-if="state === 'loading' || !counts"
    class="s-learner-counts"
    role="status"
    :aria-label="t('ui.loading')"
  >
    <div v-for="i in 4" :key="i" class="s-learner-counts__wait" aria-hidden="true">
      <UiSkeleton :lines="3" />
    </div>
  </div>
  <dl v-else class="s-learner-counts">
    <UiStat v-for="r in readouts" :key="r.id" :label="r.label" :value="r.value" :unit="r.unit">
      <span class="s-learner-counts__hint">{{ r.hint }}</span>
      <span v-if="r.change" class="s-learner-counts__change">
        <span class="s-sr">{{ r.change.text }}</span>
        <span aria-hidden="true" class="s-learner-counts__delta"
          ><UiIcon :name="r.change.icon" :size="12" />{{ r.change.size }}</span
        >
        <span aria-hidden="true">{{
          r.change.size ? t("analytics.vsPrevious") : t("analytics.same")
        }}</span>
      </span>
    </UiStat>
  </dl>
</template>
<style scoped>
.s-learner-counts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr));
  gap: var(--s-5) var(--s-4);
  margin: 0;
}
.s-learner-counts__hint {
  display: block;
}
.s-learner-counts__change {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  margin-top: var(--s-1);
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
.s-learner-counts__delta {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  font: 600 var(--s-text-xs) / 1.4 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
.s-learner-counts__wait {
  padding-left: var(--s-3);
  border-left: 1px solid var(--s-line-strong);
}
</style>
