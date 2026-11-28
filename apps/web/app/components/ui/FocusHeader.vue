<script setup lang="ts">
/**
 * The head of a page with one job: where the learner is in a short flow, what the page asks for,
 * and one line that says why. The title is the only heading in the system voice on such a page.
 */
defineProps<{ title: string; kicker?: string; lead?: string }>();
</script>
<template>
  <header class="s-focus-header">
    <p v-if="kicker" class="s-label">{{ kicker }}</p>
    <h1 class="s-title">{{ title }}</h1>
    <p v-if="lead || $slots.default" class="s-focus-header__lead">
      <slot>{{ lead }}</slot>
    </p>
  </header>
</template>
<style scoped>
.s-focus-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-2);
}
.s-focus-header__lead {
  color: var(--s-ink-2);
  text-wrap: pretty;
}
</style>
