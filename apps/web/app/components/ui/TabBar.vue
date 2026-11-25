<script setup lang="ts">
import type { NavItem } from "./nav";
defineProps<{ items: NavItem[]; current?: string }>();
</script>
<template>
  <nav class="s-tabbar" :aria-label="$t('nav.main')">
    <NuxtLink
      v-for="item in items.slice(0, 5)"
      :key="item.id"
      :to="item.to"
      class="s-tabbar__item"
      :class="{ 'is-current': item.id === current }"
      :aria-current="item.id === current ? 'page' : undefined"
    >
      <span class="s-tabbar__icon">
        <UiIcon :name="item.icon" :size="18" />
        <span v-if="item.count" class="s-tabbar__count"
          >{{ item.count }}<span class="s-sr">{{ " " + $t("nav.pending") }}</span></span
        >
      </span>
      <span class="s-tabbar__label">{{ item.short ?? item.label }}</span>
    </NuxtLink>
  </nav>
</template>
<style scoped>
.s-tabbar {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  padding: 0 var(--s-1) env(safe-area-inset-bottom);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
.s-tabbar__item {
  position: relative;
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.625rem var(--s-1) var(--s-2);
  color: var(--s-ink-3);
  font: 500 0.625rem / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-tabbar__item::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 50%;
  width: 1.5rem;
  height: 2px;
  background: var(--s-copper-fill);
  translate: -50% 0;
  scale: 0 1;
  transition: scale var(--s-dur-2) var(--s-ease);
}
.s-tabbar__item.is-current {
  color: var(--s-ink);
}
.s-tabbar__item.is-current::before {
  scale: 1 1;
}
.s-tabbar__item.is-current .s-tabbar__icon {
  color: var(--s-copper);
}
.s-tabbar__icon {
  position: relative;
}
.s-tabbar__count {
  position: absolute;
  top: -0.375rem;
  left: 0.75rem;
  min-width: 0.9375rem;
  padding: 0.125rem 0.1875rem;
  border-radius: var(--s-radius-xs);
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
  font-size: 0.5625rem;
  letter-spacing: 0;
  text-align: center;
}
.s-tabbar__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
