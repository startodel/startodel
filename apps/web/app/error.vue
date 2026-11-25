<script setup lang="ts">
import type { NuxtError } from "#app";
import { localizedPath, pageLocale } from "../shared/locale";
const props = defineProps<{ error: NuxtError }>();
const lang = pageLocale(useRequestURL().pathname);
const { t } = useI18n();
const title = props.error.statusCode === 404 ? t("common.notFound") : t("common.error");
useHead({ title, htmlAttrs: { lang } });
</script>
<template>
  <main>
    <h1>{{ title }}</h1>
    <a :href="localizedPath('/', lang)">{{ $t("common.home") }}</a>
  </main>
</template>
