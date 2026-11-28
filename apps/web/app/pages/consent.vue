<script setup lang="ts">
definePageMeta({ layout: "focus", consent: true, key: (route) => route.fullPath });
const { t } = useI18n();
useHead({ title: t("oauth.permission") });
const request = String(useRoute().query.request ?? "");
const { data } = await useFetch(`/api/oauth-consent/${encodeURIComponent(request)}` as const);
</script>
<template>
  <UiConsentPanel v-if="data" :name="data.name" :host="data.host" :request="request" />
  <UiNotice v-else tone="danger" :title="$t('oauth.expired')" />
</template>
