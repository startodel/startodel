<script setup lang="ts">
import type { EmailActions } from "../../composables/useEmailChallenge";
const props = defineProps<{
  actions: EmailActions;
  initial?: { id: string; email: string };
  change?: boolean;
}>();
const emit = defineEmits<{ verified: [] }>();
const { t } = useI18n();
const errorText = useSignInError();
const email = ref(props.initial?.email ?? "");
const challenge = ref(props.initial?.id);
const code = ref("");
const dead = ref(false);
const busy = ref(false);
const error = ref("");
const seconds = ref(props.initial ? 60 : 0);
const timer = ref<ReturnType<typeof setInterval>>();
const codeControl = useTemplateRef("codeControl");
function cooldown() {
  clearInterval(timer.value);
  const end = Date.now() + 60000;
  seconds.value = 60;
  timer.value = setInterval(() => {
    seconds.value = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    if (!seconds.value) clearInterval(timer.value);
  }, 500);
}
onMounted(() => {
  if (props.initial) cooldown();
});
onBeforeUnmount(() => clearInterval(timer.value));
function edit() {
  challenge.value = undefined;
  dead.value = false;
  error.value = "";
  code.value = "";
}
async function submit(request: boolean) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (request) {
      email.value = email.value.trim().toLowerCase();
      challenge.value = (await props.actions.request(email.value)).id;
      code.value = "";
      dead.value = false;
      cooldown();
      await nextTick();
      codeControl.value?.focus();
    } else if (challenge.value && !dead.value) {
      await props.actions.verify(challenge.value, code.value);
      emit("verified");
    }
  } catch (e) {
    error.value = errorText(e);
    const reason = emailFailure(e)?.reason;
    if (!request && (reason === "locked" || reason === "expired" || reason === "conflict")) {
      dead.value = true;
      clearInterval(timer.value);
      seconds.value = 0;
    }
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="s-challenge">
    <p v-if="challenge" class="s-challenge__sent">{{ t("signin.sent", { email }) }}</p>
    <form class="s-challenge__form" @submit.prevent="submit(!challenge)">
      <UiField v-if="!challenge" :label="change ? t('signin.newEmail') : t('signin.email')">
        <UiInput
          v-model="email"
          type="email"
          autocomplete="email"
          autocapitalize="none"
          maxlength="254"
          required
          :disabled="busy"
        />
      </UiField>
      <UiField v-else :label="t('signin.code')">
        <UiInput
          ref="codeControl"
          v-model="code"
          :disabled="dead"
          mono
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]{6}"
          maxlength="6"
          required
        />
      </UiField>
      <UiNotice v-if="error" tone="danger" :title="error" />
      <UiButton type="submit" variant="primary" size="lg" :loading="busy" :disabled="dead">{{
        challenge ? (change ? t("signin.confirm") : t("nav.signIn")) : t("signin.send")
      }}</UiButton>
    </form>
    <div v-if="challenge" class="s-challenge__actions">
      <UiButton size="sm" :disabled="busy || seconds > 0" @click="submit(true)">{{
        seconds
          ? t("signin.cooldown", {
              time: Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0"),
            })
          : t("signin.resend")
      }}</UiButton>
      <UiButton size="sm" variant="ghost" :disabled="busy" @click="edit">{{
        t("signin.change")
      }}</UiButton>
    </div>
    <slot v-else />
  </div>
</template>
<style scoped>
.s-challenge,
.s-challenge__form {
  display: grid;
  gap: var(--s-5);
}
.s-challenge__sent {
  color: var(--s-ink-2);
  overflow-wrap: anywhere;
}
.s-challenge__actions {
  display: flex;
  gap: var(--s-2);
  flex-wrap: wrap;
}
</style>
