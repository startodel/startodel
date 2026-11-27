<script setup lang="ts">
definePageMeta({ layout: "site" });
const { t } = useI18n();
const login = encodeURIComponent(String(useRoute().params.login));
const { data, error } = await useFetch(`/api/public/${login}`);
const profile = data.value;
if (!profile)
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    message: t("common.error"),
  });
usePublicHead(
  t("public.profileTitle", { name: profile.name || profile.login }),
  [profile.headline, profile.bio].filter(Boolean).join(" · ") ||
    t("public.profile", { author: "@" + profile.login }),
  "/u/" + login,
  "profile",
  () => ({
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: profile.name || profile.login,
      alternateName: "@" + profile.login,
    },
  }),
);
</script>
<template>
  <UiPublicProfile
    v-if="data"
    :data="data"
    :track-path="(slug) => '/u/' + login + '/' + encodeURIComponent(slug)"
  />
</template>
