<script setup lang="ts">
definePageMeta({ layout: "focus" });
const { data: emailStatus } = await useFetch("/api/auth/email/status");
const actions = useEmailActions();
const route = useRoute();
const { t } = useI18n();
const path = useLocalePath();
useHead({ title: () => t("nav.signIn") });
const message = computed(() =>
  route.query.error === "conflict"
    ? t("signin.conflict")
    : route.query.error
      ? t("login.error")
      : undefined,
);
</script>
<template>
  <UiSignInPanel
    :actions="emailStatus?.available ? actions : undefined"
    :message="message"
    @verified="navigateTo(path(actions.destination.value), { external: true })"
  />
</template>
