<script setup lang="ts">
definePageMeta({ middleware: "design" });
useHead({ title: "Open Graph template" });
const query = useRoute().query;
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.slice(0, 80) : undefined;
</script>
<template>
  <ShowcaseRoot>
    <UiOgCard
      :title="text(query.title)"
      :kicker="text(query.kicker)"
      :footer="text(query.footer)"
    />
  </ShowcaseRoot>
</template>
