<script setup lang="ts">
import type { IconName } from "./icons";
defineProps<{ title: string; icon?: IconName; compact?: boolean }>();
</script>
<template>
  <div class="s-empty s-grid" :class="{ 's-empty--compact': compact }">
    <span class="s-empty__pad" aria-hidden="true"><UiIcon :name="icon ?? 'pad'" :size="18" /></span>
    <h3 class="s-empty__title">{{ title }}</h3>
    <p v-if="$slots.default" class="s-empty__text"><slot /></p>
    <div v-if="$slots.actions" class="s-empty__actions"><slot name="actions" /></div>
  </div>
</template>
<style scoped>
.s-empty {
  display: grid;
  justify-items: center;
  gap: var(--s-3);
  padding: var(--s-12) var(--s-6);
  border: 1px dashed var(--s-line-strong);
  border-radius: var(--s-radius-md);
  text-align: center;
}
.s-empty--compact {
  padding: var(--s-6) var(--s-4);
}
.s-empty__pad {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
  color: var(--s-copper);
  box-shadow: 0 0 0 5px var(--s-bg);
}
.s-empty__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  background: var(--s-bg);
  padding: 0 var(--s-2);
}
.s-empty__text {
  max-width: 44ch;
  padding: 0 var(--s-2);
  background: var(--s-bg);
  color: var(--s-ink-2);
  text-wrap: pretty;
}
.s-empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--s-2);
  max-width: 100%;
  margin-top: var(--s-2);
}
</style>
