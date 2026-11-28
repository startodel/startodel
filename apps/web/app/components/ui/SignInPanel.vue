<script setup lang="ts">
import type { EmailActions, EmailFailure } from "../../composables/useEmailChallenge";
const props = defineProps<{
  /** Email sign-in is offered when its actions are given. Without them GitHub is the only method. */
  actions?: EmailActions;
  initial?: { email: string; id?: string; failure?: EmailFailure };
  /** The page a sign-in link opens: the link is being checked, or it did not work. */
  linkState?: "pending" | "error";
  message?: string;
  githubHref?: string;
}>();
defineEmits<{ verified: [] }>();
const { t } = useI18n();
const step = ref<"email" | "code">(props.initial?.id ? "code" : "email");
const title = computed(() =>
  props.linkState === "pending"
    ? t("signin.verifying")
    : props.linkState === "error"
      ? t("signin.linkFailed")
      : props.actions && step.value === "code"
        ? t("signin.checkEmail")
        : t("signin.title"),
);
</script>
<template>
  <section class="s-signin">
    <UiFocusHeader
      :title="title"
      :lead="actions && !linkState && step === 'email' ? t('signin.lead') : undefined"
    />
    <UiNotice v-if="message" tone="danger" :title="message" />
    <template v-if="linkState">
      <p v-if="linkState === 'pending'" class="s-signin__wait">
        <UiPending :label="t('signin.verifying')" />{{ t("signin.wait") }}
      </p>
      <UiButton v-else to="/signin" variant="primary" size="lg">{{ t("signin.newCode") }}</UiButton>
    </template>
    <UiEmailChallenge
      v-else-if="actions"
      :actions="actions"
      :initial="initial"
      @step="step = $event"
      @verified="$emit('verified')"
    >
      <div class="s-signin__or">
        <span>{{ t("signin.or") }}</span>
      </div>
      <UiGitHubSignIn :href="githubHref" />
    </UiEmailChallenge>
    <UiGitHubSignIn v-else :href="githubHref" primary />
    <div v-if="!linkState && step === 'email'" class="s-signin__notes">
      <p v-if="!actions">{{ t("signin.unavailable") }}</p>
      <p>{{ t("signin.newAccount") }}</p>
    </div>
  </section>
</template>
<style scoped>
.s-signin {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-5);
  max-width: 24rem;
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
.s-signin__wait {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  color: var(--s-ink-2);
}
.s-signin__notes {
  display: grid;
  gap: var(--s-1);
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
  text-wrap: pretty;
}
</style>
