<script setup lang="ts">
import docs from "../utils/legal.generated.json";
const props = defineProps<{ name: "terms" | "rules" }>();
const { locale } = useI18n();
const doc = computed(() => docs[props.name][locale.value]);
usePublicHead(
  doc.value.title,
  doc.value.body.split("\n\n")[1] ?? doc.value.title,
  "/" + props.name,
);
</script>
<template>
  <main class="narrow">
    <h1>{{ doc.title }}</h1>
    <p class="muted">{{ $t("legal.version", { version: doc.version }) }}</p>
    <article class="panel"><LessonMarkdown :text="doc.body" /></article>
  </main>
</template>
