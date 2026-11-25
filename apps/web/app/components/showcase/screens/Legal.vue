<script setup lang="ts">
import { sampleLegal } from "../sample";
</script>
<template>
  <ShowcaseSite>
    <div class="s-page legal">
      <UiDocument
        :title="sampleLegal.title"
        :markdown="sampleLegal.body"
        :version="sampleLegal.version"
        :updated="sampleLegal.updated"
      >
        <template #tools>
          <UiLanguageSwitcher variant="inline" />
        </template>
      </UiDocument>
    </div>
  </ShowcaseSite>
</template>
<style scoped>
.legal {
  padding-block: var(--s-10) var(--s-16);
}
</style>
