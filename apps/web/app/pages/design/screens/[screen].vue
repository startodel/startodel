<script setup lang="ts">
import { screens } from "../../../components/showcase/screens";
import {
  ShowcaseScreensConnect,
  ShowcaseScreensDashboard,
  ShowcaseScreensGrill,
  ShowcaseScreensLanding,
  ShowcaseScreensLegal,
  ShowcaseScreensLesson,
  ShowcaseScreensOnboarding,
  ShowcaseScreensProgress,
  ShowcaseScreensPublicProfile,
  ShowcaseScreensPublicTrack,
  ShowcaseScreensReviews,
  ShowcaseScreensSettings,
  ShowcaseScreensTrack,
} from "#components";
definePageMeta({ middleware: "design" });
const views = {
  landing: ShowcaseScreensLanding,
  "public-track": ShowcaseScreensPublicTrack,
  "public-profile": ShowcaseScreensPublicProfile,
  legal: ShowcaseScreensLegal,
  onboarding: ShowcaseScreensOnboarding,
  connect: ShowcaseScreensConnect,
  dashboard: ShowcaseScreensDashboard,
  track: ShowcaseScreensTrack,
  lesson: ShowcaseScreensLesson,
  grill: ShowcaseScreensGrill,
  reviews: ShowcaseScreensReviews,
  progress: ShowcaseScreensProgress,
  settings: ShowcaseScreensSettings,
} as const;
const route = useRoute();
const screen = computed(() => screens.find((s) => s.id === route.params.screen));
if (!screen.value) throw createError({ statusCode: 404, statusMessage: "No such screen" });
const state = computed({
  get: () => {
    const wanted = String(route.query.state ?? "");
    return screen.value?.states?.some((s) => s.id === wanted)
      ? wanted
      : screen.value?.states?.[0]?.id;
  },
  set: (next) => navigateTo({ query: { ...route.query, state: next } }, { replace: true }),
});
/** ?chrome=0 hides the showcase bar, for screenshots. */
const chrome = computed(() => route.query.chrome !== "0");
useHead({ title: () => "Screen · " + (screen.value?.title ?? "") });
</script>
<template>
  <ShowcaseRoot>
    <div v-if="screen" class="screen" :class="{ 'screen--bare': !chrome }">
      <header v-if="chrome" class="screen__bar">
        <NuxtLinkLocale to="/design/screens" class="screen__back"
          ><UiIcon name="arrow-left" :size="14" />Screens</NuxtLinkLocale
        >
        <p class="screen__name">
          <strong>{{ screen.title }}</strong><span>{{ screen.route }}</span>
        </p>
        <UiSelect
          v-if="screen.states"
          v-model="state"
          class="screen__state"
          size="sm"
          label="State"
          :options="screen.states.map((s) => ({ value: s.id, label: s.label }))"
        />
        <UiThemeToggle />
      </header>
      <div class="screen__view">
        <component
          :is="views[screen.id as keyof typeof views]"
          :key="screen.id + state"
          :state="state"
        />
      </div>
    </div>
  </ShowcaseRoot>
</template>
<style scoped>
.screen {
  --_bar: 2.75rem;
  /* Sticky parts of a screen sit below the showcase bar. */
  --s-sticky-top: var(--_bar);
  --s-shell-height: calc(100dvh - var(--_bar));
}
.screen--bare {
  --_bar: 0rem;
}
.screen__bar {
  position: sticky;
  top: 0;
  z-index: calc(var(--s-z-nav) + 1);
  display: flex;
  align-items: center;
  gap: var(--s-4);
  height: var(--_bar);
  padding: 0 var(--s-4);
  border-bottom: 1px solid var(--s-line-strong);
  background:
    repeating-linear-gradient(-45deg, transparent 0 6px, var(--s-line) 6px 7px), var(--s-surface);
  font-size: var(--s-text-sm);
}
.screen__back {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--s-ink);
  font-weight: 600;
  text-decoration: none;
}
.screen__name {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
  min-width: 0;
  margin-right: auto;
  white-space: nowrap;
  overflow: hidden;
}
.screen__name span {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.04em;
  color: var(--s-ink-3);
}
.screen .screen__state {
  flex: none;
  width: 11rem;
}
.screen__view {
  min-height: calc(100dvh - var(--_bar));
}
@media (max-width: 34rem) {
  .screen__name span {
    display: none;
  }
}
</style>
