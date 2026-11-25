<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
defineProps<{ items: { label: string; to?: RouteLocationRaw }[] }>();
</script>
<template>
  <nav class="s-crumbs" aria-label="Breadcrumb">
    <ol class="s-crumbs__list">
      <li v-for="(item, i) in items" :key="i" class="s-crumbs__item">
        <span v-if="i" class="s-crumbs__sep" aria-hidden="true">/</span>
        <NuxtLink v-if="item.to && i < items.length - 1" class="s-crumbs__link" :to="item.to">{{
          item.label
        }}</NuxtLink>
        <span
          v-else
          class="s-crumbs__here"
          :aria-current="i === items.length - 1 ? 'page' : undefined"
          >{{ item.label }}</span
        >
      </li>
    </ol>
  </nav>
</template>
<style scoped>
.s-crumbs {
  min-width: 0;
  font: 500 var(--s-text-xs) / 1.4 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.s-crumbs__list {
  display: flex;
  align-items: center;
  min-width: 0;
}
.s-crumbs__item {
  display: flex;
  align-items: center;
  min-width: 0;
}
.s-crumbs__item:last-child {
  flex: 0 1 auto;
  overflow: hidden;
}
.s-crumbs__sep {
  margin: 0 var(--s-2);
  color: var(--s-line-strong);
}
.s-crumbs__link {
  white-space: nowrap;
  color: var(--s-ink-3);
  transition: color var(--s-dur-1) var(--s-ease);
}
.s-crumbs__link:hover {
  color: var(--s-copper);
}
.s-crumbs__here {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--s-ink);
}
</style>
