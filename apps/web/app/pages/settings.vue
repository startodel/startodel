<script setup lang="ts">
const { t } = useI18n();
useHead({ title: t("nav.settings") });
</script>
<template>
  <main class="narrow">
    <h1>{{ $t("nav.settings") }}</h1>
    <div class="panel"><McpTokens /></div>
  </main>
</template>
