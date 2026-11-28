<script setup lang="ts">
const { user } = useUserSession();
const router = useRouter();
const connect = computed(() => router.currentRoute.value.meta.connect === true);
const consent = computed(() => router.currentRoute.value.meta.consent === true);
const logout = useLogout();
</script>
<template>
  <UiRoot>
    <UiFocusLayout
      :home="user ? '/dashboard' : '/'"
      :user="connect ? undefined : (user ?? undefined)"
      @logout="logout"
    >
      <template v-if="connect || !user" #actions>
        <UiButton v-if="connect" variant="ghost" size="sm" to="/dashboard">{{
          $t("agent.skip")
        }}</UiButton>
        <UiLanguageSwitcher v-else />
      </template>
      <slot />
      <template v-if="!connect && user" #footer>{{
        consent ? $t("oauth.disconnectHint") : $t("onboarding.privacy")
      }}</template>
    </UiFocusLayout>
  </UiRoot>
</template>
