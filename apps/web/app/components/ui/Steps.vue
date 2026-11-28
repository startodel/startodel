<script setup lang="ts">
/**
 * Short instructions in order. Each UiStep is a pad on a trace. A step that is done carries
 * signal, so the list also reads as progress.
 */
defineProps<{ label?: string }>();
</script>
<template>
  <ol class="s-steps" :aria-label="label">
    <slot />
  </ol>
</template>
<style scoped>
.s-steps {
  display: grid;
  list-style: none;
  counter-reset: s-step;
}
</style>
