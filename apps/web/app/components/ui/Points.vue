<script setup lang="ts">
import type { PointsBreakdown } from "./ranking";
/**
 * A learner's points: the total, what this week added, and what earned them. `compact` is one
 * inline readout for a header or a table cell.
 */
const props = withDefaults(
  defineProps<{
    total: number;
    /** Points earned this week. */
    week?: number;
    breakdown?: PointsBreakdown;
    size?: "full" | "compact";
  }>(),
  { size: "full" },
);
const { t, n } = useI18n();
const countArgs = useCountArgs();
const id = useId();
const parts = computed(() =>
  props.breakdown
    ? [
        { id: "lessons", label: t("points.lessons"), value: props.breakdown.lessons },
        { id: "quizzes", label: t("points.quizzes"), value: props.breakdown.quizzes },
        { id: "grills", label: t("points.grills"), value: props.breakdown.grills },
        { id: "reviews", label: t("points.reviews"), value: props.breakdown.reviews },
      ]
    : [],
);
</script>
<template>
  <span v-if="size === 'compact'" class="s-points-inline">
    <span class="s-sr">{{ t("points.total", countArgs(total)) }}</span>
    <span aria-hidden="true" class="s-points-inline__value">{{ n(total) }}</span>
    <span aria-hidden="true" class="s-points-inline__word">{{ t("points.word", total) }}</span>
    <span v-if="week" class="s-points-inline__week"
      ><UiIcon name="sort-up" :size="12" /><span class="s-sr">{{
        t("points.week", { n: n(week) })
      }}</span
      ><span aria-hidden="true">{{ n(week) }}</span></span
    >
  </span>
  <section v-else class="s-points" :aria-labelledby="id">
    <h3 :id="id" class="s-points__label">{{ t("points.title") }}</h3>
    <p class="s-points__total">
      <span class="s-points__value">{{ n(total) }}</span>
      <span v-if="week !== undefined" class="s-points__week">
        <UiIcon v-if="week" name="sort-up" :size="14" />{{
          week ? t("points.week", { n: n(week) }) : t("points.weekNone")
        }}
      </span>
    </p>
    <dl v-if="parts.length" class="s-points__parts" :aria-label="t('points.breakdown')">
      <div v-for="part in parts" :key="part.id" class="s-points__part">
        <dt>{{ part.label }}</dt>
        <dd>{{ n(part.value) }}</dd>
      </div>
    </dl>
  </section>
</template>
<style scoped>
.s-points {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-2);
  min-width: 0;
}
.s-points__label {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-points__total {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-1) var(--s-4);
}
.s-points__value {
  font: 600 var(--s-text-4xl) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  color: var(--s-ink);
}
.s-points__week {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-2);
}
.s-points__parts {
  margin: var(--s-2) 0 0;
  border-top: 1px solid var(--s-line-strong);
}
.s-points__part {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-2) 0;
  border-bottom: 1px solid var(--s-line);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-points__part dd {
  margin: 0;
  font: 600 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
.s-points-inline {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3125rem;
  white-space: nowrap;
}
.s-points-inline__value {
  font: 600 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
.s-points-inline__word {
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
.s-points-inline__week {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  margin-left: var(--s-1);
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-2);
}
</style>
