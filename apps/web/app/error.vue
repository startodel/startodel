<script setup lang="ts">
import type { NuxtError } from "#app";
import { localizedPath } from "../shared/locale";
const props = defineProps<{ error: NuxtError }>();
const { locale, t } = useI18n();
const title = props.error.statusCode === 404 ? t("common.notFound") : t("common.error");
useHead({
  title: `${title} · ${t("brand")}`,
  htmlAttrs: { lang: locale.value },
  meta: [{ name: "robots", content: "noindex" }],
});
</script>
<template>
  <main>
    <h1>{{ title }}</h1>
    <a :href="localizedPath('/', locale)">{{ $t("common.home") }}</a>
  </main>
</template>
