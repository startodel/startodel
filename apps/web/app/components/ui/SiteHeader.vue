<script setup lang="ts">
import type { LinkTarget, NavUser } from "./nav";
/**
 * The header of public pages: the landing page, Public Tracks, Public Profiles and legal pages.
 * A signed-in learner sees a way back to their dashboard instead of the sign-in action.
 */
withDefaults(
  defineProps<{
    home?: LinkTarget;
    links?: { label: string; to?: LinkTarget; href?: string }[];
    user?: NavUser;
    /** Where sign-in starts. */
    signIn?: LinkTarget;
    /** Where a signed-in learner's dashboard is. */
    dashboard?: LinkTarget;
  }>(),
  { home: "/", links: () => [], dashboard: "/dashboard" },
);
defineEmits<{ signIn: [] }>();
</script>
<template>
  <header class="s-site">
    <div class="s-site__inner">
      <NuxtLinkLocale :to="home" class="s-site__home" :aria-label="$t('nav.home')">
        <UiLogo :size="22" class="s-site__logo" /><UiLogo
          variant="mark"
          :size="22"
          class="s-site__mark"
        />
      </NuxtLinkLocale>
      <nav v-if="links.length" class="s-site__links" :aria-label="$t('nav.site')">
        <template v-for="l in links" :key="l.label">
          <NuxtLinkLocale v-if="l.to" :to="l.to">{{ l.label }}</NuxtLinkLocale>
          <a v-else :href="l.href" rel="noopener">{{ l.label }}</a>
        </template>
      </nav>
      <div class="s-site__actions">
        <UiLanguageSwitcher class="s-site__lang" />
        <UiThemeToggle class="s-site__theme" />
        <UiButton v-if="user" :to="dashboard" size="sm" icon-right="arrow-right">{{
          $t("nav.dashboard")
        }}</UiButton>
        <UiButton
          v-else
          :to="signIn ?? '/signin'"
          target="_self"
          @click="$emit('signIn')"
          size="sm"
          icon-right="arrow-right"
          >{{ $t("nav.signIn") }}</UiButton
        >
      </div>
    </div>
  </header>
</template>
<style scoped>
.s-site {
  container: s-site / inline-size;
  position: sticky;
  top: var(--s-sticky-top, 0px);
  z-index: var(--s-z-nav);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-bg);
}
.s-site__inner {
  display: flex;
  align-items: center;
  gap: var(--s-6);
  max-width: var(--s-page, 72rem);
  min-height: 3.5rem;
  margin: 0 auto;
  padding: 0 var(--s-page-gutter, var(--s-5));
}
.s-site__home {
  display: flex;
  color: var(--s-ink);
  text-decoration: none;
}
.s-site .s-site__mark {
  display: none;
}
.s-site__links {
  display: flex;
  gap: var(--s-5);
  font-size: var(--s-text-sm);
  font-weight: 500;
}
.s-site__links a {
  color: var(--s-ink-2);
  text-decoration: none;
}
.s-site__links a:hover {
  color: var(--s-ink);
}
.s-site__actions {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-left: auto;
}
@container s-site (max-width: 44rem) {
  .s-site__links,
  .s-site .s-site__theme {
    display: none;
  }
}
@container s-site (max-width: 26rem) {
  .s-site__home .s-site__logo {
    display: none;
  }
  .s-site__home .s-site__mark {
    display: inline-flex;
  }
}
</style>
