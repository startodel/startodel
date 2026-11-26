<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const displayDate = useDisplayDate();
useHead({ title: t("nav.grills") });
const { data, error, refresh } = await useFetch("/api/grills");
</script>
<template>
  <div class="s-stack">
    <UiPageHeader :title="$t('nav.grills')" :description="$t('grill.intro')">
      <template #actions
        ><UiPopover :title="$t('grill.start')" align="end">
          <template #trigger
            ><UiButton variant="primary" icon="plus">{{ $t("grill.start") }}</UiButton></template
          >
          <UiAgentPrompt compact :text="$t('grill.prompt')" tool="start_grill" /> </UiPopover
      ></template>
    </UiPageHeader>
    <UiNotice v-if="error" tone="danger" :title="$t('grill.load')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <UiEmptyState v-else-if="!data.length" :title="$t('grill.none')" icon="grill" />
    <ul v-else class="sessions">
      <li v-for="g in data" :key="g.id">
        <NuxtLinkLocale class="sessions__row" :to="'/grills/' + g.id" :aria-label="g.title">
          <div class="sessions__main">
            <p class="s-label">
              {{ displayDate(g.createdAt) }} ·
              {{ g.status === "open" ? $t("grill.open") : $t("grill.finished") }}
            </p>
            <h2 class="sessions__title">{{ g.title }}</h2>
            <p class="s-muted">
              {{ g.track || $t("grill.across") }} ·
              {{ $t("grill.stats", { answered: $n(g.answered), judged: $n(g.judged) }) }}
            </p>
          </div>
          <UiProgress
            class="sessions__progress"
            v-if="g.total"
            :value="g.judged"
            :max="g.total"
            segmented
            show-value
            :tone="g.status === 'open' ? 'copper' : 'neutral'"
            :label="$t('grill.judged')"
          />
          <p class="sessions__verdicts">
            <span v-for="verdict in ['strong', 'partial', 'weak'] as const" :key="verdict"
              ><UiVerdict :verdict="verdict" glyph-only size="sm" />{{ $n(g[verdict]) }}</span
            >
          </p>
          <UiIcon class="sessions__go" name="chevron-right" :size="14" />
        </NuxtLinkLocale>
      </li>
    </ul>
  </div>
</template>
<style scoped>
.sessions {
  display: grid;
  gap: var(--s-3);
  list-style: none;
}
.sessions__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 14rem) auto auto;
  align-items: center;
  gap: var(--s-3) var(--s-6);
  padding: var(--s-4) var(--s-5);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  color: var(--s-ink);
  text-decoration: none;
}
.sessions__row:hover {
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.sessions__main {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.sessions__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
}
.sessions__verdicts {
  display: flex;
  gap: var(--s-4);
  font: 500 var(--s-text-sm) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.sessions__verdicts span {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}
.sessions__go {
  color: var(--s-ink-3);
}
@container s-main (max-width: 44rem) {
  .sessions__row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .sessions__progress {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .sessions__verdicts {
    grid-column: 1;
    grid-row: 3;
  }
  .sessions__go {
    grid-row: 1;
    grid-column: 2;
  }
}
</style>
