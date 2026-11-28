<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
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
    <ul v-else class="s-stack" style="--s-gap: var(--s-3)">
      <UiGrillRow
        v-for="g in data"
        :key="g.id"
        :to="'/grills/' + g.id"
        :title="g.title"
        :status="g.status"
        :created-at="g.createdAt"
      />
    </ul>
  </div>
</template>
