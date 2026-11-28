<script setup lang="ts">
import type { EmailActions, EmailFailure } from "../../composables/useEmailChallenge";
const props = defineProps<{
  actions: EmailActions;
  /** Opens on a given step. A specimen also presets the failure the server would report. */
  initial?: { email: string; id?: string; failure?: EmailFailure };
  /** A signed-in User changes their address. That message holds a code and no link. */
  change?: boolean;
}>();
const emit = defineEmits<{ verified: []; step: [step: "email" | "code"] }>();
const { t } = useI18n();
const failureText = useSignInFailureText();
const email = ref(props.initial?.email ?? "");
const challenge = ref(props.initial?.id);
const code = ref("");
const busy = ref(false);
const failure = ref<EmailFailure | undefined>(props.initial?.failure);
const seconds = ref(props.initial?.id ? 60 : 0);
const timer = ref<ReturnType<typeof setInterval>>();
const codeControl = useTemplateRef("codeControl");
/** These failures end the Email Challenge. Only a new message helps. */
const dead = computed(
  () =>
    !!challenge.value && ["locked", "expired", "conflict"].includes(failure.value?.reason ?? ""),
);
const message = computed(() => (failure.value ? failureText(failure.value) : ""));
/** A wrong code or a malformed address belongs to its field. Everything else is a notice. */
const inField = computed(() =>
  challenge.value ? failure.value?.reason === "wrong" : failure.value?.reason === "invalid",
);
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
  if (props.initial?.id) cooldown();
});
onBeforeUnmount(() => clearInterval(timer.value));
function edit() {
  challenge.value = undefined;
  failure.value = undefined;
  code.value = "";
  clearInterval(timer.value);
  seconds.value = 0;
  emit("step", "email");
}
async function submit(request: boolean) {
  if (busy.value) return;
  busy.value = true;
  failure.value = undefined;
  try {
    if (request) {
      email.value = email.value.trim().toLowerCase();
      challenge.value = (await props.actions.request(email.value)).id;
      code.value = "";
      cooldown();
      emit("step", "code");
      await nextTick();
      codeControl.value?.focus();
    } else if (challenge.value && !dead.value) {
      await props.actions.verify(challenge.value, code.value);
      emit("verified");
    }
  } catch (e) {
    failure.value = emailFailure(e) ?? {};
    if (!request) {
      code.value = "";
      if (dead.value) {
        clearInterval(timer.value);
        seconds.value = 0;
      } else {
        await nextTick();
        codeControl.value?.focus();
      }
    }
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="s-challenge" :class="{ 's-challenge--inline': change }">
    <template v-if="!challenge">
      <form class="s-challenge__form" @submit.prevent="submit(true)">
        <UiField
          :label="change ? t('signin.newEmail') : t('signin.email')"
          :error="inField ? message : undefined"
        >
          <UiInput
            v-model="email"
            type="email"
            :size="change ? 'md' : 'lg'"
            autocomplete="email"
            autocapitalize="none"
            spellcheck="false"
            maxlength="254"
            :placeholder="t('signin.emailPlaceholder')"
            required
            :disabled="busy"
          />
        </UiField>
        <UiNotice
          v-if="message && !inField"
          :tone="failure?.reason === 'limited' ? 'warning' : 'danger'"
          :icon="failure?.reason === 'limited' ? 'clock' : undefined"
          :title="message"
        />
        <UiButton type="submit" variant="primary" :size="change ? 'md' : 'lg'" :loading="busy">{{
          t("signin.send")
        }}</UiButton>
      </form>
      <slot />
    </template>
    <template v-else>
      <div class="s-challenge__sent">
        <i18n-t keypath="signin.sent" tag="p" scope="global">
          <template #email><strong class="s-challenge__email">{{ email }}</strong></template>
        </i18n-t>
        <p v-if="!dead">{{ change ? t("signin.sentCode") : t("signin.sentBoth") }}</p>
      </div>
      <form class="s-challenge__form" @submit.prevent="submit(dead)">
        <UiField v-if="!dead" :label="t('signin.code')" :error="inField ? message : undefined">
          <UiCodeInput ref="codeControl" v-model="code" required @complete="submit(false)" />
        </UiField>
        <UiNotice
          v-if="message && !inField"
          :tone="failure?.reason === 'limited' ? 'warning' : 'danger'"
          :icon="failure?.reason === 'limited' ? 'clock' : undefined"
          :title="message"
        />
        <UiButton
          v-if="!dead || failure?.reason !== 'conflict'"
          type="submit"
          variant="primary"
          :size="change ? 'md' : 'lg'"
          :loading="busy"
          >{{
            dead ? t("signin.newCode") : change ? t("signin.confirm") : t("nav.signIn")
          }}</UiButton
        >
      </form>
      <div class="s-challenge__more">
        <p v-if="!dead" class="s-challenge__hint">{{ t("signin.spam") }}</p>
        <div class="s-challenge__actions">
          <UiButton v-if="!dead" size="sm" :disabled="busy || seconds > 0" @click="submit(true)">{{
            seconds
              ? t("signin.cooldown", {
                  time: Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0"),
                })
              : t("signin.resend")
          }}</UiButton>
          <UiButton size="sm" variant="ghost" :disabled="busy" @click="edit">{{
            t("signin.otherEmail")
          }}</UiButton>
        </div>
      </div>
    </template>
  </div>
</template>
<style scoped>
.s-challenge,
.s-challenge__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-5);
}
/* Inside Settings the form is one row among others, so its controls keep their own width. */
.s-challenge--inline .s-challenge__form {
  justify-items: start;
  max-width: 24rem;
}
.s-challenge--inline .s-challenge__form > .s-field {
  width: 100%;
}
.s-challenge__sent {
  display: grid;
  gap: var(--s-1);
  color: var(--s-ink-2);
  overflow-wrap: anywhere;
}
.s-challenge__email {
  color: var(--s-ink);
  font-weight: 600;
}
.s-challenge__more {
  display: grid;
  gap: var(--s-3);
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
}
.s-challenge__hint {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.s-challenge__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
</style>
