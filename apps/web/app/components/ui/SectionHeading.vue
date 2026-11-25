<script setup lang="ts">
withDefaults(defineProps<{ title: string; count?: number | string; level?: 2 | 3 | 4 }>(), {
  level: 2,
});
</script>
<template>
  <header class="s-section">
    <component :is="'h' + level" class="s-section__title"
      >{{ title
      }}<span v-if="count !== undefined" class="s-section__count">{{ count }}</span></component
    >
    <span class="s-section__trace" aria-hidden="true" />
    <div v-if="$slots.default" class="s-section__actions"><slot /></div>
  </header>
</template>
<style scoped>
.s-section {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 1.75rem;
}
.s-section__title {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  font: 600 var(--s-text-xs) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-ink);
}
.s-section__count {
  font-variant-numeric: tabular-nums;
  color: var(--s-copper);
}
.s-section__trace {
  position: relative;
  flex: 1;
  height: 1px;
  min-width: var(--s-6);
  margin-right: 3px;
  background: var(--s-line-strong);
}
.s-section__trace::after {
  content: "";
  position: absolute;
  right: -3px;
  top: -3px;
  width: 7px;
  height: 7px;
  border: 1px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
}
.s-section__actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
}
</style>
