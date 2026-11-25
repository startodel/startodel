<script setup lang="ts">
/** The result of a GrillSession or a Practice Quiz: how many answers got each Verdict. */
const props = defineProps<{
  strong: number;
  partial: number;
  weak: number;
  /** Answers still waiting for a Verdict. */
  pending?: number;
  /** Questions that were never answered. */
  unanswered?: number;
  label?: string;
}>();
const rows = computed(() =>
  (
    [
      { state: "strong", count: props.strong },
      { state: "partial", count: props.partial },
      { state: "weak", count: props.weak },
      { state: "pending", count: props.pending ?? 0 },
      { state: "none", count: props.unanswered ?? 0 },
    ] as const
  ).filter((row) => row.count > 0 || ["strong", "partial", "weak"].includes(row.state)),
);
const total = computed(() => rows.value.reduce((sum, row) => sum + row.count, 0));
</script>
<template>
  <div class="s-tally" role="group" :aria-label="label ?? $t('grill.verdicts')">
    <div class="s-tally__bar" aria-hidden="true">
      <i
        v-for="row in rows"
        :key="row.state"
        :class="'is-' + row.state"
        :style="{ flexGrow: row.count }"
      />
    </div>
    <dl class="s-tally__rows">
      <div v-for="row in rows" :key="row.state" class="s-tally__row">
        <dt><UiVerdict :verdict="row.state" /></dt>
        <dd>
          <strong>{{ row.count }}</strong>
          <span>{{ total ? Math.round((row.count / total) * 100) : 0 }}%</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
<style scoped>
.s-tally {
  display: grid;
  gap: var(--s-4);
  min-width: 0;
}
.s-tally__bar {
  display: flex;
  gap: 2px;
  height: 0.75rem;
}
.s-tally__bar i {
  flex: 0 0 0;
  min-width: 0;
  border-radius: 1px;
}
.s-tally__bar .is-strong {
  background: var(--s-verdigris);
}
.s-tally__bar .is-partial {
  background: repeating-linear-gradient(90deg, var(--s-brass) 0 4px, transparent 4px 6px);
}
.s-tally__bar .is-weak {
  box-shadow: inset 0 0 0 1.5px var(--s-oxide);
}
.s-tally__bar .is-pending,
.s-tally__bar .is-none {
  box-shadow: inset 0 0 0 1px var(--s-line-strong);
}
.s-tally__rows {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: var(--s-3) var(--s-5);
}
.s-tally__row {
  display: grid;
  gap: var(--s-1);
}
.s-tally__row dd {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.s-tally__row strong {
  font-size: var(--s-text-2xl);
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--s-ink);
}
</style>
