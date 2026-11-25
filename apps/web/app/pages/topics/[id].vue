<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
useHead({ title: t("topic.lessons") });
</script>
<template>
  <main class="narrow">
    <h1>{{ $t("topic.lessons") }}</h1>
    <TopicPanel :id="String(route.params.id)" />
  </main>
</template>
