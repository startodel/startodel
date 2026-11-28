<script setup lang="ts">
const { user } = useUserSession();
const router = useRouter();
const connect = computed(() => router.currentRoute.value.meta.connect === true);
const consent = computed(() => router.currentRoute.value.meta.consent === true);
const logout = useLogout();
</script>
<template>
  <UiRoot>
    <UiFocusLayout :home="user ? '/dashboard' : '/'" :width="connect ? 'md' : 'sm'">
      <template #actions>
        <UiButton v-if="connect" variant="ghost" size="sm" to="/dashboard">{{
          $t("agent.skip")
        }}</UiButton>
        <template v-else-if="user">
          <span class="who"
            ><UiAvatar :name="user.name || user.login" :src="user.avatarUrl" :size="24" />
            {{ user.login }}</span
          >
          <UiButton variant="ghost" size="sm" icon="logout" @click="logout">{{
            $t("nav.logout")
          }}</UiButton>
        </template>
        <UiLanguageSwitcher v-else />
      </template>
      <slot />
      <template v-if="!connect && user" #footer>{{
        consent ? $t("oauth.disconnectHint") : $t("onboarding.privacy")
      }}</template>
    </UiFocusLayout>
  </UiRoot>
</template>
<style scoped>
.who {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
</style>
