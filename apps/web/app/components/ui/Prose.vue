<script setup lang="ts">
/** Markdown from Lesson content. The renderer escapes HTML and keeps only HTTP(S) links. */
const props = defineProps<{ markdown: string; size?: "md" | "sm" }>();
const { t } = useI18n();
const html = computed(() => renderMarkdown(props.markdown, t("lesson.image")));
</script>
<template>
  <div class="s-prose" :class="{ 's-prose--sm': size === 'sm' }" v-html="html" />
</template>
