<script setup lang="ts">
/** A Verdict, or the two states before one exists. Shape and word carry it; colour repeats it. */
import type { VerdictState } from "./grill";
const props = withDefaults(
  defineProps<{ verdict: VerdictState; size?: "sm" | "md" | "lg"; glyphOnly?: boolean }>(),
  { size: "md" },
);
const { verdictWord } = useStateWords();
const word = computed(() => verdictWord(props.verdict));
</script>
<template>
  <span
    class="s-verdict"
    :class="['s-verdict--' + verdict, 's-verdict--' + size]"
    :role="glyphOnly ? 'img' : undefined"
    :aria-label="glyphOnly ? word : undefined"
  >
    <svg class="s-verdict__glyph" viewBox="0 0 16 16" aria-hidden="true">
      <circle v-if="verdict === 'strong'" cx="8" cy="8" r="6.5" fill="currentColor" />
      <template v-else-if="verdict === 'partial'">
        <path d="M8 1.5a6.5 6.5 0 0 0 0 13z" fill="currentColor" />
        <circle cx="8" cy="8" r="5.75" fill="none" stroke="currentColor" stroke-width="1.5" />
      </template>
      <circle
        v-else-if="verdict === 'weak'"
        cx="8"
        cy="8"
        r="5.25"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
      />
      <circle
        v-else-if="verdict === 'pending'"
        cx="8"
        cy="8"
        r="5.75"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-dasharray="2.2 2.3"
      />
      <circle v-else cx="8" cy="8" r="1.75" fill="currentColor" />
    </svg>
    <span v-if="!glyphOnly" class="s-verdict__word">{{ word }}</span>
  </span>
</template>
<style scoped>
.s-verdict {
  --_size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--s-ink-3);
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-verdict--sm {
  --_size: 0.625rem;
}
.s-verdict--lg {
  --_size: 1.125rem;
  gap: var(--s-2);
  font-size: var(--s-text-md);
  letter-spacing: 0.06em;
}
.s-verdict--strong {
  color: var(--s-verdigris);
}
.s-verdict--partial {
  color: var(--s-brass);
}
.s-verdict--weak {
  color: var(--s-oxide);
}
.s-verdict__glyph {
  flex: none;
  width: var(--_size);
  height: var(--_size);
}
</style>
