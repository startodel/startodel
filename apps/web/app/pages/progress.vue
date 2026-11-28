<script setup lang="ts">
import { privateTrackPath } from "../../shared/locale";
import type { ProgressData } from "../utils/progress-data";
definePageMeta({ layout: "app" });
const { t } = useI18n();
useHead({ title: () => t("nav.progress") });
const { data, error, refresh } = await useFetch("/api/progress");
const overview = computed<ProgressData | undefined>(() => {
  if (!data.value || error.value) return;
  const { perTopic, perTrack, edges } = data.value;
  const levels = trackLevels(perTopic, edges);
  return {
    ...data.value,
    perTopic: perTopic.map((topic) => ({ ...topic, to: "/topics/" + topic.id })),
    perTrack: perTrack.map((track) => ({
      ...track,
      levels: levels.get(track.trackId) ?? [],
      to: privateTrackPath(track.trackSlug),
    })),
  };
});
</script>
<template>
  <UiProgressOverview :data="overview">
    <UiNotice v-if="error" tone="danger" :title="$t('progress.load')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else variant="table" />
  </UiProgressOverview>
</template>
