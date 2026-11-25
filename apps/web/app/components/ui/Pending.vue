<script setup lang="ts">
defineProps<{ label?: string }>();
</script>
<template>
  <span
    class="s-pending"
    :role="label ? 'status' : undefined"
    :aria-hidden="label ? undefined : true"
  >
    <i /><i /><i /><span v-if="label" class="s-sr">{{ label }}</span>
  </span>
</template>
<style scoped>
.s-pending {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  vertical-align: middle;
}
.s-pending i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px currentColor;
  animation: s-pending 1.05s var(--s-ease) infinite;
}
.s-pending i:nth-child(2) {
  animation-delay: 0.15s;
}
.s-pending i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes s-pending {
  0%,
  60%,
  100% {
    background: transparent;
  }
  30% {
    background: currentColor;
  }
}
@media (prefers-reduced-motion: reduce) {
  .s-pending i {
    animation: none;
  }
  .s-pending i:nth-child(2) {
    background: currentColor;
  }
}
</style>
