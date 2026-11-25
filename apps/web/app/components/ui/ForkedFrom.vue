<script setup lang="ts">
import type { LinkTarget } from "./nav";
/**
 * The Forked From line of a Fork. It links to the source while the source is public, and
 * stays as plain text once it is not.
 */
defineProps<{ login: string; slug: string; to?: LinkTarget }>();
</script>
<template>
  <p class="s-forked">
    <UiIcon name="fork" :size="14" />
    <span>{{ $t("public.from") }}</span>
    <NuxtLinkLocale v-if="to" :to="to" class="s-forked__source"
      >@{{ login }}/{{ slug }}</NuxtLinkLocale
    >
    <span v-else class="s-forked__source s-forked__source--gone" :title="$t('public.sourceGone')"
      >@{{ login }}/{{ slug }}</span
    >
  </p>
</template>
<style scoped>
.s-forked {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.s-forked__source {
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
  text-decoration: underline;
  text-decoration-color: var(--s-copper-line);
  text-underline-offset: 0.2em;
}
a.s-forked__source:hover {
  text-decoration-color: var(--s-copper-fill);
}
.s-forked__source--gone {
  color: var(--s-ink-3);
  text-decoration: none;
}
</style>
