<script setup lang="ts">
import { isPublicPage } from "./utils/public-pages";
const { fetch: fetchSession } = useUserSession();
const { locale } = useI18n();
const route = useRoute();
usePublicOrigin();
onMounted(() => {
  if (isPublicPage(route.path)) void fetchSession();
});
useHead({
  htmlAttrs: { lang: locale },
  titleTemplate: (title) => (title ? title + " · Startodel" : "Startodel"),
});
</script>
<template>
  <NuxtLayout><NuxtPage :page-key="route.path" /></NuxtLayout>
</template>
