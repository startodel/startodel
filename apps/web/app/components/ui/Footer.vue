<script setup lang="ts">
import type { RouteLocationRaw } from "vue-router";
/** The page footer: licence line, a few links, and the language and theme controls. */
withDefaults(
  defineProps<{
    links?: { label: string; to?: RouteLocationRaw; href?: string }[];
    note?: string;
    /** Hide the language and theme controls, for pages that show them elsewhere. */
    bare?: boolean;
  }>(),
  { links: () => [], note: "Open source under the MIT licence." },
);
const locale = defineModel<string>("locale", { default: "en" });
</script>
<template>
  <footer class="s-footer">
    <div class="s-footer__inner">
      <div class="s-footer__about">
        <UiLogo variant="mark" :size="20" />
        <p>{{ note }}</p>
      </div>
      <nav v-if="links.length" class="s-footer__links" aria-label="Footer">
        <template v-for="l in links" :key="l.label">
          <NuxtLink v-if="l.to" :to="l.to">{{ l.label }}</NuxtLink>
          <a v-else :href="l.href" rel="noopener">{{ l.label }}</a>
        </template>
      </nav>
      <div v-if="!bare" class="s-footer__controls">
        <UiLanguageSwitcher v-model="locale" />
        <UiThemeToggle />
      </div>
    </div>
  </footer>
</template>
<style scoped>
.s-footer {
  container: s-footer / inline-size;
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-4) var(--s-8);
  max-width: var(--s-page, 72rem);
  margin: 0 auto;
  padding: var(--s-5) var(--s-page-gutter, var(--s-5));
}
.s-footer__about {
  display: flex;
  align-items: center;
  gap: var(--s-3);
}
.s-footer__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-5);
}
.s-footer__links a {
  color: var(--s-ink-2);
  text-decoration: none;
}
.s-footer__links a:hover {
  color: var(--s-ink);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
.s-footer__controls {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-left: auto;
}
@container s-footer (max-width: 34rem) {
  .s-footer__controls {
    margin-left: 0;
  }
}
</style>
