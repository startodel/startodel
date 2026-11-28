<script setup lang="ts">
import {
  commentKindIcon,
  useCommentKindLabel,
  type FeedbackComment,
  type FeedbackLesson,
} from "./comments";
/**
 * The author's inbox: learners' comments on the Blocks of their Tracks, grouped by Lesson. The
 * author answers a comment, marks it resolved, or hands it to the agent with a prompt that names
 * the Lesson and the Block.
 */
type Filter = "open" | "resolved" | "all";
const props = defineProps<{
  lessons: FeedbackLesson[];
  /** The comment whose answer or state is being saved. */
  busy?: string | null;
}>();
const emit = defineEmits<{
  reply: [id: string, text: string];
  resolve: [id: string];
  reopen: [id: string];
}>();
const filter = defineModel<Filter>("filter", { default: "open" });
const { t } = useI18n();
const countArgs = useCountArgs();
const displayDate = useDisplayDate("short");
const indexTag = useIndexTag();
const kindLabel = useCommentKindLabel();
const id = useId();

const all = computed(() => props.lessons.flatMap((lesson) => lesson.comments));
const resolved = computed(() => all.value.filter((comment) => comment.resolved).length);
const groups = computed(() =>
  props.lessons
    .map((group) => ({
      ...group,
      ref: `${indexTag("topic", group.topic.ordinal)} · ${indexTag("lesson", group.lesson.ordinal)}`,
      comments: group.comments.filter(
        (comment) => filter.value === "all" || (filter.value === "resolved") === !!comment.resolved,
      ),
    }))
    .filter((group) => group.comments.length),
);
const filters = computed(() => [
  { id: "open" as const, label: t("comments.filterOpen") },
  { id: "resolved" as const, label: t("comments.filterResolved") },
  { id: "all" as const, label: t("comments.filterAll") },
]);
const emptyTitle = computed(() => {
  if (!all.value.length) return t("comments.none");
  return filter.value === "resolved" ? t("comments.noResolved") : t("comments.noOpen");
});

const panel = ref<{ id: string; kind: "reply" | "agent" }>();
const draft = ref("");
function toggle(comment: string, kind: "reply" | "agent") {
  const same = panel.value?.id === comment && panel.value.kind === kind;
  panel.value = same ? undefined : { id: comment, kind };
  draft.value = "";
}
function send(comment: string) {
  const text = draft.value.trim();
  if (text) emit("reply", comment, text);
}
const prompt = (group: (typeof groups.value)[number], comment: FeedbackComment) =>
  t("comments.prompt", {
    lesson: group.lesson.title,
    ref: group.ref,
    track: group.track,
    block: indexTag("block", comment.block),
    kind: kindLabel(comment.kind),
    text: comment.text,
  });
</script>
<template>
  <section class="s-inbox" :aria-labelledby="id + '-title'">
    <header class="s-inbox__head">
      <UiSectionHeading :id="id + '-title'" :title="t('comments.inbox')" />
      <div v-if="all.length" class="s-inbox__bar">
        <p class="s-inbox__counts">
          {{ t("comments.openCount", countArgs(all.length - resolved)) }} ·
          {{ t("comments.resolvedCount", countArgs(resolved)) }}
        </p>
        <UiSegmented v-model="filter" size="sm" :label="t('comments.filter')" :options="filters" />
      </div>
    </header>
    <UiEmptyState v-if="!groups.length" icon="comment" compact :title="emptyTitle">
      <template v-if="!all.length">{{ t("comments.noneHint") }}</template>
    </UiEmptyState>
    <section
      v-for="group in groups"
      :key="group.id"
      class="s-inbox__group"
      :aria-labelledby="id + '-' + group.id"
    >
      <header class="s-inbox__lesson">
        <p class="s-inbox__path">
          <span>{{ group.track }}</span><span class="s-inbox__ref">{{ group.ref }}</span
          ><span>{{ group.topic.title }}</span>
        </p>
        <h3 :id="id + '-' + group.id" class="s-inbox__title">
          <NuxtLinkLocale v-if="group.lesson.to" :to="group.lesson.to" class="s-inbox__link">{{
            group.lesson.title
          }}</NuxtLinkLocale>
          <template v-else>{{ group.lesson.title }}</template>
        </h3>
      </header>
      <ul class="s-inbox__rows">
        <li
          v-for="comment in group.comments"
          :key="comment.id"
          class="s-inbox__row"
          :class="{ 'is-resolved': comment.resolved }"
        >
          <div class="s-inbox__main">
            <p class="s-inbox__marks">
              <span class="s-inbox__block">{{ indexTag("block", comment.block) }}</span>
              <UiBadge :icon="commentKindIcon[comment.kind]" variant="outline">{{
                kindLabel(comment.kind)
              }}</UiBadge>
              <span v-if="comment.resolved" class="s-inbox__resolved"
                ><UiIcon name="check" :size="12" />{{ t("comments.resolved") }}</span
              >
            </p>
            <p class="s-inbox__text">{{ comment.text }}</p>
            <p class="s-inbox__meta">
              <bdi class="s-inbox__handle">@{{ comment.author.handle }}</bdi>
              <time :datetime="comment.createdAt">{{ displayDate(comment.createdAt) }}</time>
            </p>
          </div>
          <div class="s-inbox__actions">
            <UiButton
              v-if="comment.resolved"
              size="sm"
              variant="ghost"
              :disabled="busy === comment.id"
              @click="emit('reopen', comment.id)"
              >{{ t("comments.reopen") }}</UiButton
            >
            <template v-else>
              <UiButton
                size="sm"
                variant="ghost"
                icon="reply"
                :aria-expanded="panel?.id === comment.id && panel.kind === 'reply'"
                @click="toggle(comment.id, 'reply')"
                >{{ t("comments.reply") }}</UiButton
              >
              <UiButton
                size="sm"
                variant="ghost"
                icon="terminal"
                :aria-expanded="panel?.id === comment.id && panel.kind === 'agent'"
                @click="toggle(comment.id, 'agent')"
                >{{ t("comments.toAgent") }}</UiButton
              >
              <UiButton
                size="sm"
                icon="check"
                :disabled="busy === comment.id"
                @click="emit('resolve', comment.id)"
                >{{ t("comments.resolve") }}</UiButton
              >
            </template>
          </div>
          <form
            v-if="panel?.id === comment.id && panel.kind === 'reply'"
            class="s-inbox__panel"
            @submit.prevent="send(comment.id)"
          >
            <UiField :label="t('comments.yourReply')">
              <UiTextarea v-model="draft" :rows="3" :disabled="busy === comment.id" />
            </UiField>
            <div class="s-inbox__send">
              <UiButton
                type="submit"
                size="sm"
                :loading="busy === comment.id"
                :disabled="!draft.trim()"
                >{{ t("comments.sendReply") }}</UiButton
              >
              <UiButton size="sm" variant="ghost" @click="panel = undefined">{{
                t("common.cancel")
              }}</UiButton>
            </div>
          </form>
          <div v-else-if="panel?.id === comment.id" class="s-inbox__panel">
            <UiAgentPrompt :text="prompt(group, comment)" compact />
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>
<style scoped>
.s-inbox {
  container: s-inbox / inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-6);
  min-width: 0;
}
.s-inbox__head {
  display: grid;
  gap: var(--s-2);
}
.s-inbox__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2) var(--s-4);
}
.s-inbox__counts,
.s-inbox__path {
  font: 500 var(--s-text-2xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-inbox__group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
}
.s-inbox__lesson {
  display: grid;
  gap: var(--s-1);
}
.s-inbox__path {
  display: flex;
  flex-wrap: wrap;
  gap: 0 var(--s-3);
}
.s-inbox__ref {
  color: var(--s-ink);
}
.s-inbox__title {
  font-size: var(--s-text-md);
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-ink);
  overflow-wrap: anywhere;
}
.s-inbox__link:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.s-inbox__rows {
  list-style: none;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-inbox__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-4);
}
.s-inbox__row + .s-inbox__row {
  border-top: 1px solid var(--s-line);
}
.s-inbox__main {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}
.s-inbox__marks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
}
.s-inbox__block {
  font: 600 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  color: var(--s-ink);
}
.s-inbox__resolved {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-verdigris);
}
.s-inbox__text {
  display: -webkit-box;
  max-width: var(--s-read-measure);
  overflow: hidden;
  font: 400 var(--s-text-md) / 1.55 var(--s-font-read);
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}
.s-inbox__row.is-resolved .s-inbox__text {
  color: var(--s-ink-2);
}
.s-inbox__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
.s-inbox__handle {
  font: 600 var(--s-text-xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.s-inbox__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2);
}
.s-inbox__panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
}
.s-inbox__send {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
@container s-inbox (min-width: 46rem) {
  .s-inbox__row {
    grid-template-columns: minmax(0, 1fr) auto;
    column-gap: var(--s-6);
  }
  .s-inbox__actions {
    align-self: start;
    justify-content: flex-end;
  }
  .s-inbox__panel {
    grid-column: 1 / -1;
  }
}
</style>
