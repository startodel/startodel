<script setup lang="ts">
withDefaults(defineProps<{ lines?: number; label?: string }>(), { lines: 3, label: "Loading" });
</script>
<template>
  <div class="s-skeleton" role="status" :aria-label="label">
    <i v-for="n in lines" :key="n" :style="{ width: n === lines && lines > 1 ? '62%' : '100%' }" />
  </div>
</template>
<style scoped>
.s-skeleton {
  display: grid;
  gap: var(--s-2);
}
.s-skeleton i {
  height: 0.75rem;
  border-radius: var(--s-radius-xs);
  background: var(--s-line);
  animation: s-skeleton 1.4s ease-in-out infinite alternate;
}
@keyframes s-skeleton {
  to {
    opacity: 0.45;
  }
}
@media (prefers-reduced-motion: reduce) {
  .s-skeleton i {
    animation: none;
  }
}
</style>
