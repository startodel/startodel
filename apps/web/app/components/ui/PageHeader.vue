<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    /** A mono line above the title: a designator, a kind or a count. */
    kicker?: string;
    /** system: a page the product names. content: a title written for the learner. */
    voice?: "system" | "content";
    description?: string;
    clampDescription?: boolean;
  }>(),
  { voice: "system" },
);
</script>
<template>
  <header class="s-page-header">
    <div class="s-page-header__main">
      <p v-if="kicker" class="s-page-header__kicker">{{ kicker }}</p>
      <h1 class="s-page-header__title" :class="'s-page-header__title--' + voice">{{ title }}</h1>
      <UiClampedDescription
        v-if="clampDescription && description && !$slots.default"
        class="s-page-header__description"
        :text="description"
      />
      <p v-else-if="description || $slots.default" class="s-page-header__description">
        <slot>{{ description }}</slot>
      </p>
      <div v-if="$slots.meta" class="s-page-header__meta"><slot name="meta" /></div>
    </div>
    <div v-if="$slots.actions" class="s-page-header__actions"><slot name="actions" /></div>
  </header>
</template>
<style scoped>
.s-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-4) var(--s-8);
  padding-bottom: var(--s-5);
  border-bottom: 1px solid var(--s-line);
}
.s-page-header__main {
  flex: 1 1 20rem;
  min-width: 0;
  display: grid;
  gap: var(--s-3);
}
.s-page-header__kicker {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-copper);
}
.s-page-header__title {
  overflow-wrap: anywhere;
  text-wrap: balance;
}
.s-page-header__title--system {
  font: 600 clamp(1.625rem, 4cqi, var(--s-text-3xl)) / 1.08 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.035em;
}
.s-page-header__title--content {
  font: 500 clamp(1.75rem, 4.6cqi, var(--s-text-4xl)) / 1.12 var(--s-font-read);
  letter-spacing: -0.022em;
}
.s-page-header__description {
  max-width: 62ch;
  color: var(--s-ink-2);
  font-size: var(--s-text-lg);
  text-wrap: pretty;
}
.s-page-header__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-4);
  color: var(--s-ink-3);
  font-size: var(--s-text-sm);
}
.s-page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
</style>
