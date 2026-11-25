<script setup lang="ts">
import { MASTERY_LABELS } from "@startodel/core";
const props = withDefaults(
  defineProps<{
    level: number;
    size?: "sm" | "md" | "lg";
    /** bars: the meter only. level: meter and numeral. full: meter, numeral and name. */
    show?: "bars" | "level" | "full";
  }>(),
  { size: "md", show: "level" },
);
const level = computed(() => Math.min(Math.max(Math.trunc(props.level) || 0, 0), 4));
const name = computed(() => MASTERY_LABELS[level.value]!);
</script>
<template>
  <span
    class="s-mastery"
    :class="['s-mastery--' + size, 's-mastery--l' + level]"
    role="img"
    :aria-label="`Mastery ${level} of 4, ${name}`"
  >
    <span class="s-mastery__bars" aria-hidden="true">
      <i v-for="n in 4" :key="n" :class="{ 'is-on': n <= level }" />
    </span>
    <span v-if="show !== 'bars'" class="s-mastery__level" aria-hidden="true">{{ level }}</span>
    <span v-if="show === 'full'" class="s-mastery__name" aria-hidden="true">{{ name }}</span>
  </span>
</template>
<style scoped>
.s-mastery {
  --_u: 3px;
  display: inline-flex;
  align-items: baseline;
  gap: 0.375rem;
  color: var(--s-ink-2);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  white-space: nowrap;
}
.s-mastery--sm {
  --_u: 2px;
  font-size: var(--s-text-2xs);
}
.s-mastery--lg {
  --_u: 5px;
  gap: var(--s-2);
  font-size: var(--s-text-md);
}
.s-mastery__bars {
  display: inline-flex;
  align-items: flex-end;
  gap: calc(var(--_u) * 0.67);
  height: calc(var(--_u) * 4.67);
}
.s-mastery__bars i {
  width: var(--_u);
  border-radius: 0.5px;
  box-shadow: inset 0 0 0 1px var(--s-line-strong);
}
.s-mastery__bars i:nth-child(1) {
  height: 40%;
}
.s-mastery__bars i:nth-child(2) {
  height: 60%;
}
.s-mastery__bars i:nth-child(3) {
  height: 80%;
}
.s-mastery__bars i:nth-child(4) {
  height: 100%;
}
.s-mastery__bars i.is-on {
  background: var(--s-copper-fill);
  box-shadow: none;
}
.s-mastery__level {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--s-ink);
}
.s-mastery--l0 .s-mastery__level {
  color: var(--s-ink-3);
}
.s-mastery__name {
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
</style>
