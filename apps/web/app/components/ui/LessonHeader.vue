<script setup lang="ts">
defineProps<{
  title: string;
  tag: string;
  topicTitle: string;
  topicTag?: string;
  minutes: number;
  blockCount: number;
}>();
const countArgs = useCountArgs();
</script>
<template>
  <UiPageHeader
    :kicker="
      topicTag
        ? $t('lesson.kicker', { tag, topicTag, topicTitle })
        : $t('lesson.untrackedKicker', { tag, topicTitle })
    "
    :title="title"
    voice="content"
  >
    <template #meta>
      <UiBadge icon="clock">{{ $t("lesson.minutes", { n: $n(minutes) }) }}</UiBadge>
      <UiBadge icon="lesson">{{ $t("count.blocks", countArgs(blockCount)) }}</UiBadge>
      <slot />
    </template>
  </UiPageHeader>
</template>
