<script setup lang="ts">
import type { LinkTarget } from "./nav";
/**
 * A page with one job and no navigation: onboarding, connecting an agent. The logo leads home,
 * the actions slot holds a way out, and the content sits in one centred column.
 */
withDefaults(defineProps<{ home?: LinkTarget; width?: "sm" | "md" }>(), {
  home: "/",
  width: "sm",
});
</script>
<template>
  <div class="s-focus">
    <header class="s-focus__bar">
      <NuxtLinkLocale :to="home" class="s-focus__home" :aria-label="$t('nav.home')"
        ><UiLogo :size="22"
      /></NuxtLinkLocale>
      <div class="s-focus__actions"><slot name="actions" /></div>
    </header>
    <main class="s-focus__main" :class="'s-focus__main--' + width"><slot /></main>
    <footer v-if="$slots.footer" class="s-focus__foot"><slot name="footer" /></footer>
  </div>
</template>
<style scoped>
.s-focus {
  display: flex;
  flex-direction: column;
  min-height: var(--s-shell-height, 100dvh);
  background: var(--s-bg);
}
.s-focus__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-height: 3.5rem;
  padding: 0 var(--s-5);
  border-bottom: 1px solid var(--s-line);
}
.s-focus__home {
  display: flex;
  color: var(--s-ink);
  text-decoration: none;
}
.s-focus__actions {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.s-focus__main {
  container: s-main / inline-size;
  flex: 1;
  width: 100%;
  max-width: 40rem;
  margin: 0 auto;
  padding: clamp(var(--s-6), 6vh, var(--s-16)) var(--s-5) var(--s-16);
}
.s-focus__main--md {
  max-width: 52rem;
}
.s-focus__foot {
  padding: var(--s-4) var(--s-5);
  border-top: 1px solid var(--s-line);
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
  text-align: center;
}
</style>
