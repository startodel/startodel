<script setup lang="ts">
definePageMeta({ layout: "site" });
const doc = useLegalDocument("terms");
</script>
<template>
  <div class="s-page">
    <UiDocument
      :title="doc.title"
      :markdown="doc.body"
      :version="doc.version"
      :updated="doc.updated"
    >
      <template #tools><UiLanguageSwitcher variant="inline" /></template>
    </UiDocument>
  </div>
</template>
