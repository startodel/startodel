<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
import type { NavUser } from "./nav";
withDefaults(
  defineProps<{
    crumbs?: { label: string; to?: RouteLocationRaw }[];
    user?: NavUser;
    home?: RouteLocationRaw;
  }>(),
  { home: "/" },
);
</script>
<template>
  <header class="s-topbar">
    <NuxtLink :to="home" class="s-topbar__home" aria-label="Startodel home">
      <UiLogo variant="mark" :size="22" />
    </NuxtLink>
    <UiBreadcrumbs v-if="crumbs?.length" :items="crumbs" class="s-topbar__crumbs" />
    <div class="s-topbar__actions">
      <slot />
      <span v-if="user" class="s-topbar__user"
        ><UiAvatar :name="user.name || user.login" :src="user.avatarUrl" :size="26"
      /></span>
    </div>
  </header>
</template>
<style scoped>
.s-topbar {
  position: sticky;
  top: 0;
  z-index: var(--s-z-nav);
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 3rem;
  padding: 0 var(--s-6);
  border-bottom: 1px solid var(--s-line);
  background: color-mix(in srgb, var(--s-bg) 92%, transparent);
  backdrop-filter: blur(6px);
}
.s-topbar__home,
.s-topbar__user {
  display: none;
}
.s-topbar__crumbs {
  flex: 1;
}
.s-topbar__actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-left: auto;
}
@container s-shell (max-width: 52rem) {
  .s-topbar {
    padding: 0 var(--s-4);
  }
  .s-topbar__home,
  .s-topbar__user {
    display: inline-flex;
  }
}
</style>
