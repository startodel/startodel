<script setup lang="ts">
import type { EmailActions } from "../../composables/useEmailChallenge";
defineProps<{
  actions?: EmailActions;
  initial?: { id: string; email: string };
  linkState?: "pending" | "error";
  message?: string;
  githubHref?: string;
}>();
defineEmits<{ verified: [] }>();
</script>
<template>
  <section class="s-signin">
    <UiPageHeader :title="$t('nav.signIn')" />
    <UiNotice v-if="message" tone="danger" :title="message" />
    <template v-if="linkState">
      <UiNotice v-if="linkState === 'pending'" :title="$t('signin.verifying')" />
      <UiButton v-else to="/signin">{{ $t("signin.newCode") }}</UiButton>
    </template>
    <UiEmailChallenge
      v-else-if="actions"
      :actions="actions"
      :initial="initial"
      @verified="$emit('verified')"
    >
      <div class="s-signin__or"><span>{{ $t("signin.or") }}</span></div>
      <UiGitHubSignIn :href="githubHref" />
    </UiEmailChallenge>
    <UiGitHubSignIn v-else :href="githubHref" />
  </section>
</template>
<style scoped>
.s-signin {
  display: grid;
  gap: var(--s-6);
  max-width: 28rem;
  margin-inline: auto;
}
.s-signin__or {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  color: var(--s-ink-3);
  font-size: var(--s-text-sm);
}
.s-signin__or::before,
.s-signin__or::after {
  content: "";
  flex: 1;
  border-top: 1px solid var(--s-line);
}
</style>
