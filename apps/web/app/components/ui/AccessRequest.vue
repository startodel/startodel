<script setup lang="ts">
import type { AccessRequestState } from "./access";
import type { IconName } from "./icons";
import type { LinkTarget } from "./nav";
/**
 * The visitor's panel on a gated Track: where their request for access stands and the one thing
 * to do next. Startodel takes no payments, and the panel says so.
 */
const props = defineProps<{
  state: AccessRequestState;
  /** When the pending request was sent. */
  requestedAt?: string;
  /** After a decline: the day from which the visitor may ask again. Left out, they may ask now. */
  retryAt?: string;
  signInTo?: LinkTarget;
  /** Where "Start learning" leads once access is granted. */
  startTo?: LinkTarget;
  /** The request is being sent or withdrawn. */
  busy?: boolean;
}>();
const emit = defineEmits<{ request: [message: string]; withdraw: []; again: [] }>();
const message = defineModel<string>("message", { default: "" });
const { t } = useI18n();
const displayDate = useDisplayDate("short");
const id = useId();
const view = computed<{ icon: IconName; word: string; title: string; tone?: string }>(
  () =>
    ({
      "signed-out": {
        icon: "lock-pad" as const,
        word: t("access.needed"),
        title: t("access.signInTitle"),
      },
      available: {
        icon: "lock-pad" as const,
        word: t("access.needed"),
        title: t("access.requestTitle"),
      },
      pending: {
        icon: "clock" as const,
        word: t("access.pending"),
        title: t("access.pendingTitle"),
        tone: "brass",
      },
      granted: {
        icon: "check" as const,
        word: t("access.granted"),
        title: t("access.grantedTitle"),
        tone: "verdigris",
      },
      declined: {
        icon: "x" as const,
        word: t("access.declined"),
        title: t("access.declinedTitle"),
      },
    })[props.state],
);
const note = computed(() => {
  if (props.state === "pending" && props.requestedAt)
    return t("access.pendingSince", { date: displayDate(props.requestedAt) });
  if (props.state !== "declined") return undefined;
  return props.retryAt
    ? t("access.retryFrom", { date: displayDate(props.retryAt) })
    : t("access.declinedHint");
});
</script>
<template>
  <section class="s-access-request" :aria-labelledby="id">
    <p
      class="s-access-request__state"
      :class="view.tone && 's-access-request__state--' + view.tone"
    >
      <UiIcon :name="view.icon" :size="14" />{{ view.word }}
    </p>
    <h3 :id="id" class="s-access-request__title">{{ view.title }}</h3>
    <p v-if="note" class="s-access-request__note">{{ note }}</p>
    <p v-if="state !== 'granted'" class="s-access-request__gives">{{ t("access.gives") }}</p>
    <form
      v-if="state === 'available'"
      class="s-access-request__form"
      @submit.prevent="emit('request', message.trim())"
    >
      <UiField :label="t('access.message')" :hint="t('access.messageHint')" optional>
        <UiTextarea v-model="message" :rows="2" :disabled="busy" maxlength="500" />
      </UiField>
      <UiButton type="submit" variant="primary" :loading="busy" class="s-access-request__action">{{
        t("access.request")
      }}</UiButton>
    </form>
    <UiButton
      v-else-if="state === 'signed-out'"
      variant="primary"
      :to="signInTo"
      class="s-access-request__action"
      >{{ t("access.signIn") }}</UiButton
    >
    <UiButton
      v-else-if="state === 'pending'"
      :loading="busy"
      class="s-access-request__action"
      @click="emit('withdraw')"
      >{{ t("access.withdraw") }}</UiButton
    >
    <UiButton
      v-else-if="state === 'granted'"
      variant="primary"
      icon-right="arrow-right"
      :to="startTo"
      class="s-access-request__action"
      >{{ t("access.start") }}</UiButton
    >
    <UiButton
      v-else-if="!retryAt"
      :loading="busy"
      class="s-access-request__action"
      @click="emit('again')"
      >{{ t("access.again") }}</UiButton
    >
  </section>
</template>
<style scoped>
.s-access-request {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-5);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-access-request__state {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font: 600 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-ink-2);
}
.s-access-request__state--brass {
  color: var(--s-brass);
}
.s-access-request__state--verdigris {
  color: var(--s-verdigris);
}
.s-access-request__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
  color: var(--s-ink);
}
.s-access-request__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink);
}
.s-access-request__gives {
  font-size: var(--s-text-sm);
  line-height: 1.5;
  color: var(--s-ink-2);
}
.s-access-request__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  margin-top: var(--s-1);
}
.s-access-request .s-access-request__action {
  justify-self: start;
  margin-top: var(--s-1);
}
.s-access-request__form .s-access-request__action {
  margin-top: 0;
}
</style>
