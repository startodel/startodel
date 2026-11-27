<script setup lang="ts">
import { privateTrackPath } from "../../../shared/locale";
import { publicBlock } from "@startodel/core";
import type { QuizResult } from "../../components/ui/Quiz.vue";
const indexTag = useIndexTag();

definePageMeta({ layout: "app" });
const { t } = useI18n();
const route = useRoute();
const url = `/api/lessons/${String(route.params.id)}` as const;
const { data, error, refresh } = await useFetch(url, {
  transform: ({ lesson, ...details }) => ({
    ...details,
    lesson: { ...lesson, blocks: lesson.blocks.map(publicBlock) },
  }),
});
if (error.value?.statusCode === 404)
  throw createError({ statusCode: 404, message: t("common.error") });
useHead({ title: () => data.value?.lesson.title });
const track = computed(() => {
  const memberships = data.value?.tracks ?? [];
  const ref = route.query.track;
  if (typeof ref === "string") {
    const match =
      memberships.find((item) => item.id === ref.toLowerCase()) ??
      memberships.find((item) => item.slug === ref);
    if (match) return match;
  }
  return memberships[0];
});
const trail = computed(() => {
  if (!data.value) return;
  const { topic, lessonOrdinal } = data.value;
  const member = track.value;
  const path = member && privateTrackPath(member.slug);
  return lessonTrail(
    indexTag,
    lessonOrdinal,
    { title: topic.title, to: path ? { path, query: { topic: topic.id } } : "/topics/" + topic.id },
    member && {
      title: member.title,
      to: privateTrackPath(member.slug),
      topicOrdinal: member.topicOrdinal,
    },
  );
});
const lessonLink = (id: string) => ({
  path: "/lessons/" + id,
  query: { track: track.value?.slug },
});
const marking = ref(false);
const readError = ref(false);
async function read() {
  const details = data.value;
  if (!details || marking.value || details.readAt) return;
  marking.value = true;
  readError.value = false;
  try {
    const progress = await $fetch(`${url}/read`, { method: "POST" });
    details.readAt = progress.readAt;
    details.mastery = Math.max(details.mastery, progress.mastery);
    await refreshDashboard();
  } catch {
    readError.value = true;
  } finally {
    marking.value = false;
  }
}

const answers = reactive<Record<string, (number | undefined)[]>>(Object.create(null));
const results = reactive(new Map<string, QuizResult>());
const solutions = reactive(new Map<string, string>());
const pending = reactive(new Set<string>());
const failed = reactive(new Set<string>());
async function submit(id: string) {
  const details = data.value;
  if (!details || pending.has(id) || results.has(id)) return;
  pending.add(id);
  failed.delete(id);
  try {
    const scored = await $fetch(`${url}/quiz/${encodeURIComponent(id)}`, {
      method: "POST",
      body: { answers: answers[id] },
    });
    results.set(id, scored);
    details.mastery = Math.max(details.mastery, scored.mastery);
    await refreshDashboard();
  } catch {
    failed.add(id);
  } finally {
    pending.delete(id);
  }
}
function retry(id: string) {
  results.delete(id);
  delete answers[id];
}
async function reveal(id: string) {
  if (pending.has(id) || solutions.has(id)) return;
  pending.add(id);
  failed.delete(id);
  try {
    const { solution } = await $fetch(`${url}/exercise/${encodeURIComponent(id)}/solution`);
    solutions.set(id, solution);
  } catch {
    failed.add(id);
  } finally {
    pending.delete(id);
  }
}
const index = computed(
  () =>
    data.value?.lesson.blocks.map((b) => ({
      id: "lesson-block-" + b.id,
      title: blockOutlineTitle(b, t),
      done: results.get(b.id)?.perQuestion.every(Boolean) || solutions.has(b.id),
    })) ?? [],
);
</script>
<template>
  <article class="lesson">
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <template v-else-if="trail">
      <UiBreadcrumbs :items="trail.crumbs" />
      <UiLessonHeader
        :title="data.lesson.title"
        :tag="trail.tag"
        :topic-tag="trail.topicTag"
        :topic-title="data.topic.title"
        :minutes="lessonMinutes(data.lesson.blocks)"
        :block-count="data.lesson.blocks.length"
      >
        <UiMastery :level="data.mastery" show="full" />
      </UiLessonHeader>
      <UiLessonLayout>
        <UiEmptyState v-if="!index.length" :title="$t('lesson.empty')" icon="lesson" />
        <UiLessonBlock
          v-for="(b, i) in data.lesson.blocks"
          :key="b.id"
          :index="i + 1"
          :block="b"
          :anchor="'lesson-block-' + b.id"
        >
          <UiProse v-if="b.type === 'theory'" :markdown="b.markdown" />
          <template v-else-if="b.type === 'code'">
            <UiCodeBlock :title="b.title" :code="b.code" :language="b.language" />
            <UiProse v-if="b.explanation" :markdown="b.explanation" size="sm" />
          </template>
          <UiProse v-else-if="b.type === 'callout'" :markdown="b.markdown" size="sm" />
          <template v-else-if="b.type === 'link' || b.type === 'video'">
            <UiResourceLink v-if="b.type === 'link'" :title="b.title" :url="b.url" />
            <UiVideoEmbed v-else :title="b.title" :url="b.url" />
            <UiProse v-if="b.note" :markdown="b.note" size="sm" />
          </template>
          <UiQuiz
            v-else-if="b.type === 'quiz'"
            v-model="answers[b.id]"
            :name="b.id"
            :questions="b.questions"
            :result="results.get(b.id)"
            :busy="pending.has(b.id)"
            :error="failed.has(b.id) ? $t('quiz.error') : undefined"
            @submit="submit(b.id)"
            @retry="retry(b.id)"
          />
          <UiExercise
            v-else-if="b.type === 'exercise'"
            :lesson-id="data.lesson.id"
            :block-id="b.id"
            :prompt="b.prompt"
            :hints="b.hints"
            :solution="solutions.get(b.id)"
            :revealing="pending.has(b.id)"
            :error="failed.has(b.id) ? $t('lesson.solutionError') : undefined"
            @reveal="reveal(b.id)"
          />
        </UiLessonBlock>
        <template v-if="index.length" #aside><UiLessonIndex :blocks="index" /></template>
        <template #end>
          <UiNotice v-if="readError" tone="danger" :title="$t('lesson.readError')" />
          <UiNotice v-if="data.readAt" tone="success" :title="$t('lesson.read')">{{
            $t("lesson.readHint")
          }}</UiNotice>
          <div v-else>
            <UiButton
              icon="check"
              :variant="data.next ? 'secondary' : 'primary'"
              :loading="marking"
              @click="read"
              >{{ $t("lesson.mark") }}</UiButton
            >
          </div>
          <nav class="s-cluster lesson__nav" :aria-label="$t('topic.lessons')">
            <UiButton
              icon="arrow-left"
              :to="data.previous ? lessonLink(data.previous.id) : '/topics/' + data.topic.id"
              >{{
                data.previous
                  ? indexTag("lesson", data.lessonOrdinal - 1) + " " + data.previous.title
                  : $t("topic.lessons")
              }}</UiButton
            >
            <UiButton
              v-if="data.next"
              variant="primary"
              icon-right="arrow-right"
              :to="lessonLink(data.next.id)"
              >{{ indexTag("lesson", data.lessonOrdinal + 1) }} {{ data.next.title }}</UiButton
            >
          </nav>
        </template>
      </UiLessonLayout>
    </template>
  </article>
</template>
<style scoped>
.lesson {
  display: grid;
  gap: var(--s-10);
}
</style>
