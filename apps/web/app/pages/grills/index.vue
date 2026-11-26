<script setup lang="ts">
definePageMeta({ layout: "app" });
const countArgs = useCountArgs();
const { t } = useI18n();
const displayDate = useDisplayDate();
useHead({ title: t("nav.grills") });
const { data, error, refresh } = await useFetch("/api/grills");
</script>
<template>
  <div class="s-stack">
    <UiPageHeader :title="$t('nav.grills')" :description="$t('grill.intro')" />
    <UiNotice v-if="error" tone="danger" :title="$t('grill.load')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <UiEmptyState v-else-if="!data.length" :title="$t('grill.none')" icon="grill" />
    <ul v-else class="s-stack">
      <li v-for="g in data" :key="g.id">
        <UiCard :to="'/grills/' + g.id">
          <div class="s-stack">
            <div class="s-cluster">
              <UiBadge :icon="g.status === 'open' ? 'grill' : 'check'">{{
                g.status === "open" ? $t("grill.open") : $t("grill.finished")
              }}</UiBadge>
              <span>{{ displayDate(g.createdAt) }} · {{ g.track || $t("grill.across") }}</span>
            </div>
            <h2>{{ g.title }}</h2>
            <p>
              {{ $t("grill.stats", { answered: $n(g.answered), judged: $n(g.judged) }) }} ·
              {{ $t("count.questions", countArgs(g.total)) }}
            </p>
            <UiProgress
              v-if="g.total"
              :value="g.answered"
              :max="g.total"
              :label="$t('grill.answered')"
              segmented
            />
          </div>
        </UiCard>
      </li>
    </ul>
    <UiAgentPrompt :label="$t('grill.start')" :text="$t('grill.prompt')" tool="start_grill" />
  </div>
</template>
