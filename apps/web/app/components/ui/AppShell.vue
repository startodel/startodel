<script setup lang="ts">
import type { LinkTarget, NavItem, NavTrack, NavUser } from "./nav";
withDefaults(
  defineProps<{
    items: NavItem[];
    current?: string;
    tracks?: NavTrack[];
    currentTrack?: string;
    user?: NavUser;
    crumbs?: { label: string; to?: LinkTarget }[];
    /** Lets the content run edge to edge, for a canvas such as the Track board. */
    flush?: boolean;
    /** Where the logo leads. */
    home?: LinkTarget;
  }>(),
  { home: "/" },
);
defineEmits<{ logout: [] }>();
const collapsed = defineModel<boolean>("collapsed", { default: false });
</script>
<template>
  <div class="s-shell">
    <div class="s-shell__frame" :class="{ 'is-collapsed': collapsed }">
      <a class="s-shell__skip" href="#s-main">{{ $t("nav.skip") }}</a>
      <UiNavRail
        v-model:collapsed="collapsed"
        class="s-shell__rail"
        :items="items"
        :current="current"
        :tracks="tracks"
        :current-track="currentTrack"
        :user="user"
        :home="home"
        @logout="$emit('logout')"
      >
        <template #foot><slot name="rail-foot" /></template>
      </UiNavRail>
      <div class="s-shell__column">
        <UiTopBar :crumbs="crumbs" :user="user" :home="home"><slot name="actions" /></UiTopBar>
        <main
          id="s-main"
          class="s-shell__main"
          :class="{ 's-shell__main--flush': flush }"
          tabindex="-1"
        >
          <slot />
        </main>
      </div>
      <UiTabBar class="s-shell__tabs" :items="items" :current="current" />
    </div>
  </div>
</template>
<style scoped>
.s-shell {
  container: s-shell / inline-size;
  min-height: var(--s-shell-height, 100dvh);
  background: var(--s-bg);
}
.s-shell__frame {
  display: grid;
  grid-template-columns: var(--s-rail) minmax(0, 1fr);
  min-height: var(--s-shell-height, 100dvh);
}
.s-shell__frame.is-collapsed {
  grid-template-columns: var(--s-rail-collapsed) minmax(0, 1fr);
}
.s-shell__skip {
  position: absolute;
  left: var(--s-3);
  top: var(--s-3);
  z-index: var(--s-z-overlay);
  padding: var(--s-2) var(--s-3);
  border-radius: var(--s-radius-sm);
  background: var(--s-inverse);
  color: var(--s-on-inverse);
  font-size: var(--s-text-sm);
  font-weight: 600;
  translate: 0 -200%;
}
.s-shell__skip:focus-visible {
  translate: 0;
}
.s-shell .s-shell__rail {
  position: sticky;
  top: var(--s-sticky-top, 0px);
  height: var(--s-shell-height, 100dvh);
}
.s-shell__column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.s-shell__main {
  container: s-main / inline-size;
  flex: 1;
  width: 100%;
  max-width: 76rem;
  margin: 0 auto;
  padding: var(--s-8) var(--s-8) var(--s-16);
}
.s-shell__main:focus-visible {
  outline: none;
}
.s-shell__main--flush {
  max-width: none;
  padding: 0;
}
.s-shell .s-shell__tabs {
  display: none;
}
@container s-shell (max-width: 52rem) {
  .s-shell__frame,
  .s-shell__frame.is-collapsed {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 1fr auto;
  }
  .s-shell .s-shell__rail {
    display: none;
  }
  .s-shell__main {
    padding: var(--s-5) var(--s-4) var(--s-10);
  }
  .s-shell__main--flush {
    padding: 0;
  }
  .s-shell .s-shell__tabs {
    display: grid;
    position: sticky;
    bottom: 0;
    z-index: var(--s-z-nav);
  }
}
</style>
