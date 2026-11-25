<script setup lang="ts">
const { t } = useI18n();
useHead({ title: t("agent.connect") });
</script>
<template>
  <main class="narrow">
    <h1>{{ $t("agent.connect") }}</h1>
    <p class="muted">{{ $t("agent.access") }}</p>
    <div class="panel"><McpTokens connect /></div>
    <div class="actions">
      <NuxtLinkLocale class="button primary" to="/">{{ $t("agent.done") }}</NuxtLinkLocale
      ><NuxtLinkLocale to="/">{{ $t("agent.skip") }}</NuxtLinkLocale>
    </div>
  </main>
</template>
