<script setup lang="ts">
definePageMeta({ layout: "focus" });
const { t } = useI18n();
useHead({ title: () => t("nav.signIn"), meta: [{ name: "referrer", content: "no-referrer" }] });
const path = useLocalePath();
const errorText = useSignInError();
const message = ref("");
const unavailable = ref(false);
onMounted(async () => {
  const [id, token] = location.hash.slice(1).split(".");
  history.replaceState(history.state, "", location.pathname);
  if (!id || !token) {
    message.value = t("signin.expired");
    return;
  }
  try {
    const result = await $fetch<{ consent?: string }>("/api/auth/email/verify", {
      method: "POST",
      body: { id, token },
    });
    await navigateTo(path(result.consent ?? "/dashboard"), { external: true });
  } catch (e) {
    unavailable.value = emailFailure(e)?.reason === "unavailable";
    message.value = errorText(e);
  }
});
</script>
<template>
  <UiSignInPanel
    :link-state="unavailable ? undefined : message ? 'error' : 'pending'"
    :message="unavailable ? undefined : message"
  />
</template>
