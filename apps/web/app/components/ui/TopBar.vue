<script setup lang="ts">
import type { LinkTarget, NavUser } from "./nav";
withDefaults(
  defineProps<{
    crumbs?: { label: string; to?: LinkTarget }[];
    user?: NavUser;
    home?: LinkTarget;
  }>(),
  { home: "/dashboard" },
);
</script>
<template>
  <header class="s-topbar">
    <NuxtLinkLocale :to="home" class="s-topbar__home" :aria-label="$t('nav.home')">
      <UiLogo variant="mark" :size="22" />
    </NuxtLinkLocale>
    <UiBreadcrumbs v-if="crumbs?.length" :items="crumbs" class="s-topbar__crumbs" />
    <div class="s-topbar__actions">
      <!-- Vue also renders this fallback for empty forwarded or conditional actions. -->
      <slot>
        <span v-if="(crumbs?.length ?? 0) <= 1" class="s-topbar__idle" hidden />
      </slot>
      <span v-if="user" class="s-topbar__user"
        ><UiAvatar :name="user.name || user.login" :src="user.avatarUrl" :size="26"
      /></span>
    </div>
  </header>
</template>
<style scoped>
.s-topbar {
  position: sticky;
  top: var(--s-sticky-top, 0px);
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
@container s-shell (width > 52rem) {
  .s-topbar:has(.s-topbar__idle) {
    display: none;
  }
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
