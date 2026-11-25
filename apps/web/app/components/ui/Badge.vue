<script setup lang="ts">
import type { IconName } from "./icons";
withDefaults(
  defineProps<{
    tone?: "neutral" | "copper" | "verdigris" | "brass" | "oxide" | "steel";
    variant?: "soft" | "outline" | "solid";
    icon?: IconName;
    pad?: boolean;
  }>(),
  { tone: "neutral", variant: "soft" },
);
</script>
<template>
  <span class="s-badge" :class="['s-badge--' + tone, 's-badge--' + variant]">
    <i v-if="pad" class="s-badge__pad" aria-hidden="true" /><UiIcon
      v-if="icon"
      :name="icon"
      :size="12"
    /><slot />
  </span>
</template>
<style scoped>
.s-badge {
  --_ink: var(--s-ink-2);
  --_soft: var(--s-sunken);
  --_line: var(--s-line-strong);
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  min-height: 1.25rem;
  padding: 0 0.4375rem;
  border: 1px solid transparent;
  border-radius: var(--s-radius-xs);
  background: var(--_soft);
  color: var(--_ink);
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
}
.s-badge--copper {
  --_ink: var(--s-copper);
  --_soft: var(--s-copper-soft);
  --_line: var(--s-copper-line);
}
.s-badge--verdigris {
  --_ink: var(--s-verdigris);
  --_soft: var(--s-verdigris-soft);
  --_line: var(--s-verdigris-line);
}
.s-badge--brass {
  --_ink: var(--s-brass);
  --_soft: var(--s-brass-soft);
  --_line: var(--s-brass-line);
}
.s-badge--oxide {
  --_ink: var(--s-oxide);
  --_soft: var(--s-oxide-soft);
  --_line: var(--s-oxide-line);
}
.s-badge--steel {
  --_ink: var(--s-steel);
  --_soft: var(--s-steel-soft);
  --_line: var(--s-steel-line);
}
.s-badge--outline {
  border-color: var(--_line);
  background: transparent;
}
.s-badge--solid {
  background: var(--_ink);
  color: var(--s-bg);
}
.s-badge__pad {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: currentColor;
}
</style>
