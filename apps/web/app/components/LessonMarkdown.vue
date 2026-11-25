<script setup lang="ts">
import { renderMarkdown } from "../utils/markdown";
defineProps<{ text: string }>();
</script>
<template><div class="prose" v-html="renderMarkdown(text)" /></template>
<style scoped>
.prose {
  overflow-wrap: anywhere;
}
.prose :deep(img) {
  max-width: 100%;
}
.prose :deep(> :first-child) {
  margin-top: 0;
}
.prose :deep(> :last-child) {
  margin-bottom: 0;
}
.prose :deep(table) {
  display: block;
  overflow: auto;
}
</style>
