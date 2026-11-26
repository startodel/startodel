<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const route = useRoute();
const { data, error, refresh } = await useTopicDetails(computed(() => String(route.params.id)));
if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, message: t("topic.load") });
useHead({ title: () => data.value?.topic.title ?? t("topic.lessons") });
</script>
<template>
  <div class="s-stack">
    <UiPageHeader :title="$t('topic.lessons')" />
    <UiNotice v-if="error" tone="danger" :title="$t('topic.load')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiTopicDetails v-else-if="data" :details="data" />
    <UiSkeletonList v-else />
  </div>
</template>
