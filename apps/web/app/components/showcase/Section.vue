<script setup lang="ts">
defineProps<{ id: string; title: string; index?: number }>();
</script>
<template>
  <section :id="id" class="section">
    <header class="section__head">
      <p v-if="index" class="section__index">{{ String(index).padStart(2, "0") }}</p>
      <h2 class="section__title">{{ title }}</h2>
      <p v-if="$slots.lead" class="section__lead"><slot name="lead" /></p>
    </header>
    <div class="section__body"><slot /></div>
  </section>
</template>
<style scoped>
.section {
  scroll-margin-top: 4.5rem;
  padding-top: var(--s-12);
}
.section:first-of-type {
  padding-top: var(--s-8);
}
.section__head {
  display: grid;
  gap: var(--s-2);
  padding-bottom: var(--s-4);
  border-bottom: 1px solid var(--s-line-strong);
}
.section__index {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  color: var(--s-copper);
}
.section__title {
  font: 600 var(--s-text-2xl) / 1.1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.03em;
}
.section__lead {
  max-width: 68ch;
  color: var(--s-ink-2);
  text-wrap: pretty;
}
.section__body {
  display: grid;
  gap: var(--s-6);
  padding-top: var(--s-6);
}
</style>
