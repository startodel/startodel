<script setup lang="ts">
import { isPublicPage } from "../shared/public-pages";
const { fetch: fetchSession } = useUserSession();
const { locale, t } = useI18n();
const route = useRoute();
usePublicOrigin();
onMounted(() => {
  if (isPublicPage(route.path)) void fetchSession();
});
useHead(() => {
  const brand = t("brand");
  return {
    htmlAttrs: { lang: locale.value },
    titleTemplate: (title) => (title ? `${title} · ${brand}` : brand),
  };
});
</script>
<template>
  <NuxtLayout><NuxtPage :page-key="(pageRoute) => pageRoute.path" /></NuxtLayout>
</template>
