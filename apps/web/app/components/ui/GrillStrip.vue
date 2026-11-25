<script setup lang="ts">
import type { VerdictState } from "./grill";
/**
 * Every Grill Question of a GrillSession as a row of test pads. Each pad shows its state:
 * unanswered, awaiting a Verdict, or the Verdict. Press a pad to go to that question.
 */
const props = defineProps<{ questions: { id: string; state: VerdictState }[]; label?: string }>();
const current = defineModel<number>("current", { default: 0 });
const { verdictWord } = useStateWords();
function move(event: KeyboardEvent) {
  const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;
  event.preventDefault();
  current.value = Math.min(Math.max(current.value + step, 0), props.questions.length - 1);
  const list = event.currentTarget as HTMLElement;
  nextTick(() => list.querySelector<HTMLElement>("[aria-current]")?.focus());
}
</script>
<template>
  <ol class="s-strip" :aria-label="label ?? $t('grill.questions')" @keydown="move">
    <li v-for="(q, i) in questions" :key="q.id" class="s-strip__cell">
      <button
        type="button"
        class="s-strip__pad"
        :class="['is-' + q.state, { 'is-current': current === i }]"
        :aria-current="current === i ? 'step' : undefined"
        :aria-label="$t('grill.pad', { index: i + 1, state: verdictWord(q.state) })"
        :tabindex="current === i ? 0 : -1"
        @click="current = i"
      >
        <UiVerdict :verdict="q.state" glyph-only aria-hidden="true" />
        <span class="s-strip__number" aria-hidden="true">{{ String(i + 1).padStart(2, "0") }}</span>
      </button>
    </li>
  </ol>
</template>
<style scoped>
.s-strip {
  display: flex;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
  padding: 2px;
}
.s-strip__cell {
  position: relative;
  flex: 1 0 2rem;
  display: grid;
  justify-items: center;
}
/* The bus bar that joins the pads. */
.s-strip__cell::before {
  content: "";
  position: absolute;
  top: 0.9375rem;
  left: 0;
  right: 0;
  border-top: 1px solid var(--s-line-strong);
}
.s-strip__cell:first-child::before {
  left: 50%;
}
.s-strip__cell:last-child::before {
  right: 50%;
}
.s-strip__pad {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.25rem 0.25rem;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-strip__pad :deep(.s-verdict) {
  background: var(--s-bg);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--s-bg);
}
.s-strip__number {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.s-strip__pad:hover .s-strip__number {
  color: var(--s-ink);
}
.s-strip__pad.is-current .s-strip__number {
  color: var(--s-ink);
  font-weight: 700;
}
.s-strip__pad.is-current::after {
  content: "";
  position: absolute;
  inset: auto 0.25rem -2px;
  height: 2px;
  background: var(--s-copper-fill);
}
</style>
