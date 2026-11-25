<script setup lang="ts">
/** A placeholder for a list or a grid that is still loading. Match the shape of what will arrive. */
withDefaults(
  defineProps<{ rows?: number; variant?: "rows" | "cards" | "table"; label?: string }>(),
  { rows: 4, variant: "rows", label: "Loading" },
);
const widths = ["72%", "54%", "64%", "46%", "68%", "58%"];
</script>
<template>
  <div
    class="s-skeleton-list"
    :class="'s-skeleton-list--' + variant"
    role="status"
    :aria-label="label"
  >
    <div v-for="n in rows" :key="n" class="s-skeleton-list__row" aria-hidden="true">
      <i class="s-skeleton-list__ref" />
      <span class="s-skeleton-list__text">
        <i :style="{ width: widths[(n - 1) % widths.length] }" />
        <i v-if="variant !== 'table'" :style="{ width: widths[(n + 2) % widths.length] }" />
      </span>
      <i class="s-skeleton-list__end" />
    </div>
  </div>
</template>
<style scoped>
.s-skeleton-list {
  display: grid;
}
.s-skeleton-list--cards {
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
  gap: var(--s-4);
}
.s-skeleton-list__row {
  display: flex;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-4) 0;
  border-bottom: 1px solid var(--s-line);
}
.s-skeleton-list--table .s-skeleton-list__row {
  padding: var(--s-3) 0;
}
.s-skeleton-list--cards .s-skeleton-list__row {
  align-items: flex-start;
  min-height: 6.5rem;
  padding: var(--s-4);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
}
.s-skeleton-list i {
  display: block;
  height: 0.75rem;
  border-radius: var(--s-radius-xs);
  background: var(--s-line);
  animation: s-skeleton-list 1.4s ease-in-out infinite alternate;
}
.s-skeleton-list__ref {
  flex: none;
  width: 2rem;
}
.s-skeleton-list__text {
  flex: 1;
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}
.s-skeleton-list__text i + i {
  height: 0.5rem;
  opacity: 0.7;
}
.s-skeleton-list__end {
  flex: none;
  width: 3rem;
}
.s-skeleton-list--cards .s-skeleton-list__end {
  display: none;
}
.s-skeleton-list__row:nth-child(2n) i {
  animation-delay: 0.2s;
}
@keyframes s-skeleton-list {
  to {
    opacity: 0.45;
  }
}
@media (prefers-reduced-motion: reduce) {
  .s-skeleton-list i {
    animation: none;
  }
}
</style>
