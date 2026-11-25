<script setup lang="ts">
defineProps<{ label: string; value: string | number; unit?: string; live?: boolean }>();
</script>
<template>
  <div class="s-stat" :class="{ 's-stat--live': live }">
    <dt class="s-stat__label">{{ label }}</dt>
    <dd class="s-stat__value">
      {{ value }}<span v-if="unit" class="s-stat__unit">{{ unit }}</span>
    </dd>
    <dd v-if="$slots.default" class="s-stat__hint"><slot /></dd>
  </div>
</template>
<style scoped>
.s-stat {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
  padding-left: var(--s-3);
  border-left: 1px solid var(--s-line-strong);
}
.s-stat--live {
  border-left: 2px solid var(--s-copper-fill);
}
.s-stat__label {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-stat__value {
  margin: 0;
  font: 600 var(--s-text-3xl) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  color: var(--s-ink);
}
.s-stat--live .s-stat__value {
  color: var(--s-copper);
}
.s-stat__unit {
  margin-left: 0.25rem;
  font-size: var(--s-text-sm);
  font-weight: 500;
  letter-spacing: 0;
  color: var(--s-ink-3);
}
.s-stat__hint {
  margin: 0;
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
</style>
