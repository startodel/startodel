<script setup lang="ts">
import type { VerdictState } from "./grill";
/**
 * Every Grill Question of a GrillSession as a row of test pads. Each pad shows its state:
 * unanswered, awaiting a Verdict, or the Verdict. Press a pad to go to that question.
 */
const props = defineProps<{ questions: { id: string; state: VerdictState }[]; label?: string }>();
const current = defineModel<number>("current", { default: 0 });
const { verdictWord } = useStateWords();
const { t } = useI18n();
const indexTag = useIndexTag();
const pads = computed(() =>
  props.questions.map((q, i) => ({
    ...q,
    label: t("grill.pad", { tag: indexTag("question", i + 1), state: verdictWord(q.state) }),
  })),
);
const strip = useTemplateRef("strip");
function revealCurrent() {
  const list = strip.value;
  const pad = list?.querySelector("[aria-current]");
  if (!list || !pad) return;
  const frame = list.getBoundingClientRect();
  const { left, right } = pad.getBoundingClientRect();
  list.scrollLeft += Math.min(0, left - frame.left) + Math.max(0, right - frame.right);
}
onMounted(revealCurrent);
watch(current, revealCurrent, { flush: "post" });
function focusCurrent() {
  strip.value?.querySelector<HTMLElement>("[aria-current]")?.focus();
}
defineExpose({ focusCurrent });
function move(event: KeyboardEvent) {
  const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;
  event.preventDefault();
  current.value = Math.min(Math.max(current.value + step, 0), props.questions.length - 1);
  nextTick(focusCurrent);
}
</script>
<template>
  <ol ref="strip" class="s-strip" :aria-label="label ?? $t('grill.questions')" @keydown="move">
    <li v-for="(q, i) in pads" :key="q.id" class="s-strip__cell">
      <button
        type="button"
        class="s-strip__pad"
        :class="['is-' + q.state, { 'is-current': current === i }]"
        :title="q.label"
        :aria-current="current === i ? 'step' : undefined"
        :aria-label="q.label"
        :tabindex="current === i ? 0 : -1"
        @click="current = i"
      >
        <UiVerdict :verdict="q.state" glyph-only aria-hidden="true" />
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
  flex: 1 0 var(--s-6);
  display: grid;
  justify-items: center;
}
/* The bus bar that joins the pads. */
.s-strip__cell::before {
  content: "";
  position: absolute;
  top: 50%;
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
  place-items: center;
  width: var(--s-6);
  min-height: var(--s-control-sm);
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-strip__pad :deep(.s-verdict) {
  background: var(--s-bg);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--s-bg);
}
.s-strip__pad:hover {
  background: var(--s-sunken);
}
.s-strip__pad.is-current::after {
  content: "";
  position: absolute;
  inset: auto var(--s-1) 0;
  height: 2px;
  background: var(--s-copper-fill);
}
</style>
