<script setup lang="ts">
import { UiPopover } from "#components";
import type { LinkTarget } from "./nav";
import {
  commentKindIcon,
  commentKinds,
  useCommentKindLabel,
  type BlockComment,
  type CommentKind,
} from "./comments";
/**
 * Learners' comments on one Lesson Block. A quiet trigger sits with the Block and opens the thread
 * in a popover. `inline` renders the same thread in place, for a narrow container and for the
 * author's inbox.
 */
const props = withDefaults(
  defineProps<{
    comments: BlockComment[];
    /** The designator of the Block, such as B05. It names the thread. */
    block: string;
    inline?: boolean;
    /** The comment being added. Going from sending back to idle clears the form. */
    state?: "idle" | "sending" | "failed";
    /** A visitor without a Session is asked to sign in instead of getting the form. */
    signedOut?: boolean;
    signInTo?: LinkTarget;
    /** Leaves the form out. */
    readonly?: boolean;
  }>(),
  { state: "idle" },
);
const emit = defineEmits<{ submit: [comment: { kind: CommentKind; text: string }] }>();
const open = defineModel<boolean>("open", { default: false });
const kind = defineModel<CommentKind>("kind", { default: "unclear" });
const text = defineModel<string>("text", { default: "" });
const { t, n } = useI18n();
const countArgs = useCountArgs();
const displayDate = useDisplayDate("short");
const kindLabel = useCommentKindLabel();
const id = useId();
const sending = computed(() => props.state === "sending");
const title = computed(() => t("comments.title", { block: props.block }));
const kindOptions = computed(() =>
  commentKinds.map((value) => ({ value, label: kindLabel(value) })),
);
watch(
  () => props.state,
  (next, previous) => {
    if (previous === "sending" && next === "idle") text.value = "";
  },
);
function submit() {
  const trimmed = text.value.trim();
  if (trimmed && !sending.value) emit("submit", { kind: kind.value, text: trimmed });
}
// One thread, two frames: a section in the page, or the popover behind the trigger.
const frame = computed(() =>
  props.inline
    ? { class: "s-comments", "aria-labelledby": id + "-title" }
    : {
        title: title.value,
        align: "end" as const,
        open: open.value,
        "onUpdate:open": (value: boolean) => (open.value = value),
      },
);
</script>
<template>
  <component :is="inline ? 'section' : UiPopover" v-bind="frame">
    <template v-if="!inline" #trigger>
      <button
        type="button"
        class="s-comments-trigger"
        :class="{ 'has-comments': comments.length }"
        :aria-label="
          comments.length
            ? t('comments.show', { block, ...countArgs(comments.length) })
            : t('comments.add', { block })
        "
      >
        <UiIcon name="comment" :size="14" /><span
          v-if="comments.length"
          class="s-comments-trigger__count"
          >{{ n(comments.length) }}</span
        >
      </button>
    </template>
    <div class="s-comments__thread" :class="{ 's-comments__thread--popover': !inline }">
      <p v-if="inline" :id="id + '-title'" class="s-comments__title">
        {{ title
        }}<span v-if="comments.length" class="s-comments__count">{{ n(comments.length) }}</span>
      </p>
      <p v-if="!comments.length" class="s-comments__empty">{{ t("comments.empty") }}</p>
      <ol
        v-else
        class="s-comments__list"
        :tabindex="inline ? undefined : 0"
        :aria-label="inline ? undefined : title"
      >
        <li
          v-for="c in comments"
          :key="c.id"
          class="s-comments__item"
          :class="{ 'is-resolved': c.resolved }"
        >
          <UiAvatar :name="c.author.handle" :src="c.author.avatarUrl" :size="24" />
          <div class="s-comments__body">
            <p class="s-comments__meta">
              <bdi class="s-comments__handle">@{{ c.author.handle }}</bdi>
              <time :datetime="c.createdAt">{{ displayDate(c.createdAt) }}</time>
            </p>
            <p class="s-comments__marks">
              <UiBadge :icon="commentKindIcon[c.kind]" variant="outline">{{
                kindLabel(c.kind)
              }}</UiBadge>
              <span v-if="c.resolved" class="s-comments__resolved"
                ><UiIcon name="check" :size="12" />{{ t("comments.resolved") }}</span
              >
            </p>
            <p class="s-comments__text">{{ c.text }}</p>
            <div v-if="c.reply" class="s-comments__reply">
              <p class="s-comments__meta">
                <bdi class="s-comments__handle">@{{ c.reply.author.handle }}</bdi>
                <span class="s-comments__role">{{ t("comments.author") }}</span>
                <time :datetime="c.reply.createdAt">{{ displayDate(c.reply.createdAt) }}</time>
              </p>
              <p class="s-comments__text">{{ c.reply.text }}</p>
            </div>
          </div>
        </li>
      </ol>
      <div v-if="signedOut" class="s-comments__signin">
        <p>{{ t("comments.signInHint") }}</p>
        <UiButton size="sm" :to="signInTo">{{ t("comments.signIn") }}</UiButton>
      </div>
      <form v-else-if="!readonly" class="s-comments__form" @submit.prevent="submit">
        <UiChoiceChips
          v-model="kind"
          :legend="t('comments.kind')"
          :name="id + '-kind'"
          :options="kindOptions"
          :disabled="sending"
        />
        <UiField
          :label="t('comments.text')"
          :error="state === 'failed' ? t('comments.failed') : undefined"
        >
          <UiTextarea v-model="text" :rows="inline ? 3 : 2" :disabled="sending" />
        </UiField>
        <UiButton
          type="submit"
          size="sm"
          class="s-comments__send"
          :loading="sending"
          :disabled="!text.trim()"
          >{{ t("comments.send") }}</UiButton
        >
      </form>
    </div>
  </component>
</template>
<style scoped>
.s-comments-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3125rem;
  min-width: var(--s-control-sm);
  min-height: var(--s-control-sm);
  padding: 0 0.375rem;
  border-radius: var(--s-radius-sm);
  color: var(--s-ink-3);
  transition:
    background var(--s-dur-1) var(--s-ease),
    color var(--s-dur-1) var(--s-ease);
}
.s-comments-trigger.has-comments {
  color: var(--s-ink-2);
}
.s-comments-trigger:hover,
.s-comments-trigger[data-state="open"] {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-comments-trigger__count {
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.s-comments {
  min-width: 0;
}
.s-comments__thread {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
}
.s-comments__title {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  font: 600 var(--s-text-xs) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-ink);
}
.s-comments__count {
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-3);
}
.s-comments__empty {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-comments__list {
  display: grid;
  list-style: none;
  border-top: 1px solid var(--s-line);
}
/* The popover has no height limit of its own, so the list gives way and the form stays in view. */
.s-comments__thread--popover {
  display: flex;
  flex-direction: column;
  max-height: calc(var(--reka-popover-content-available-height, 100vh) - 5rem);
  /* Room for the focus rings that the scroll container would clip. */
  margin: calc(var(--s-1) * -1);
  padding: var(--s-1);
  overflow-y: auto;
}
.s-comments__thread--popover .s-comments__list {
  flex: 0 1 auto;
  min-height: 7rem;
  max-height: 17rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.s-comments__thread--popover .s-comments__form,
.s-comments__thread--popover .s-comments__signin {
  flex: none;
}
.s-comments__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--s-line);
}
.s-comments__body {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}
.s-comments__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  min-height: 1.5rem;
  font-size: var(--s-text-xs);
  line-height: 1.5rem;
  color: var(--s-ink-3);
}
.s-comments__handle {
  font: 600 var(--s-text-xs) / 1.5rem var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
}
.s-comments__role {
  font: 500 var(--s-text-2xs) / 1.5rem var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-2);
}
.s-comments__marks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
}
.s-comments__resolved {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-verdigris);
}
.s-comments__text {
  font: 400 var(--s-text-md) / 1.55 var(--s-font-read);
  color: var(--s-ink);
  overflow-wrap: anywhere;
  white-space: pre-line;
}
.s-comments__reply {
  display: grid;
  gap: var(--s-1);
  padding-left: var(--s-3);
  border-left: 2px solid var(--s-line-strong);
}
.s-comments__item.is-resolved .s-comments__text {
  color: var(--s-ink-2);
}
.s-comments__signin {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-comments__form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
}
.s-comments__form .s-comments__send {
  justify-self: start;
}
</style>
