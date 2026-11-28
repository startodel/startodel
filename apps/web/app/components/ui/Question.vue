<script setup lang="ts">
/**
 * One question of a form that asks several: a title in plain words, a hint, the controls and
 * the reason the answer was not accepted. The control inside names itself for assistive technology.
 */
defineProps<{ title: string; hint?: string; error?: string; id?: string }>();
</script>
<template>
  <section :id="id" class="s-question" :class="{ 'is-invalid': error }" tabindex="-1">
    <header class="s-question__head">
      <h2 class="s-question__title">{{ title }}</h2>
      <p v-if="hint" class="s-question__hint">{{ hint }}</p>
    </header>
    <slot />
    <p v-if="error" class="s-question__error" role="alert">
      <UiIcon name="alert" :size="14" /><span>{{ error }}</span>
    </p>
  </section>
</template>
<style scoped>
.s-question {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  scroll-margin-top: var(--s-16);
}
.s-question:focus-visible {
  outline: none;
}
.s-question__head {
  display: grid;
  gap: var(--s-1);
}
.s-question__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.3;
  text-wrap: balance;
}
.s-question__hint {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-question__error {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: var(--s-text-sm);
  line-height: 1.35;
  color: var(--s-oxide);
}
.s-question__error svg {
  flex: none;
  margin-top: 0.125rem;
}
</style>
