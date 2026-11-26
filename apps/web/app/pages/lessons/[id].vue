<script setup lang="ts">
import { publicBlock } from "@startodel/core";
import type { QuizResult } from "../../components/ui/Quiz.vue";

definePageMeta({ layout: "app" });
const { t } = useI18n();
const countArgs = useCountArgs();
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
const track = computed(() =>
  typeof route.query.track === "string" && /^[a-f0-9-]{36}$/i.test(route.query.track)
    ? route.query.track
    : undefined,
);
const { data: topicDetails } = await useTopicDetails(computed(() => data.value?.topic.id));
const neighbors = computed(() => {
  const lessons = topicDetails.value?.lessons ?? [];
  const index = lessons.findIndex((l) => l.id === data.value?.lesson.id);
  return { previous: lessons[index - 1], next: index < 0 ? undefined : lessons[index + 1] };
});
const lessonLink = (id: string) => ({ path: "/lessons/" + id, query: { track: track.value } });
const marking = ref(false);
const readError = ref(false);
async function read() {
  if (!data.value || marking.value || data.value.readAt) return;
  marking.value = true;
  readError.value = false;
  try {
    const progress = await $fetch(`${url}/read`, { method: "POST" });
    data.value.readAt = progress.readAt;
    data.value.mastery = Math.max(data.value.mastery, progress.mastery);
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
  if (!data.value || pending.has(id) || results.has(id)) return;
  pending.add(id);
  failed.delete(id);
  try {
    const scored = await $fetch(`${url}/quiz/${encodeURIComponent(id)}`, {
      method: "POST",
      body: { answers: answers[id] },
    });
    results.set(id, scored);
    data.value.mastery = Math.max(data.value.mastery, scored.mastery);
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
      kind: b.type,
      title: "title" in b ? b.title : t(`block.${b.type}`),
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
    <template v-else>
      <UiBreadcrumbs
        :items="[
          { label: $t('nav.dashboard'), to: '/dashboard' },
          {
            label: data.topic.title,
            to: track ? { path: '/tracks/' + track, query: { topic: data.topic.id } } : undefined,
          },
          { label: data.lesson.title },
        ]"
      />
      <UiPageHeader
        :kicker="data.topic.title"
        :title="data.lesson.title"
        :description="data.lesson.summary ?? undefined"
        voice="content"
      >
        <template #meta
          ><UiBadge icon="lesson">{{
            $t("count.blocks", countArgs(data.lesson.blocks.length))
          }}</UiBadge
          ><UiMastery :level="data.mastery" show="full"
        /></template>
      </UiPageHeader>
      <UiLessonLayout>
        <UiEmptyState v-if="!index.length" :title="$t('lesson.empty')" icon="lesson" />
        <UiLessonBlock
          v-for="(b, i) in data.lesson.blocks"
          :key="b.id"
          :index="i + 1"
          :kind="b.type"
          :anchor="'lesson-block-' + b.id"
        >
          <UiProse v-if="b.type === 'theory'" :markdown="b.markdown" />
          <template v-else-if="b.type === 'code'">
            <UiCodeBlock :code="b.code" :language="b.language" />
            <UiProse v-if="b.explanation" :markdown="b.explanation" size="sm" />
          </template>
          <UiCallout v-else-if="b.type === 'callout'" :kind="b.variant"
            ><UiProse :markdown="b.markdown" size="sm"
          /></UiCallout>
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
          <div>
            <UiButton
              icon="check"
              :variant="data.readAt ? 'ghost' : 'primary'"
              :loading="marking"
              :disabled="!!data.readAt"
              @click="read"
              >{{ data.readAt ? $t("lesson.read") : $t("lesson.mark") }}</UiButton
            >
          </div>
          <nav class="s-cluster lesson__nav" :aria-label="$t('topic.lessons')">
            <UiButton
              icon="arrow-left"
              :to="
                neighbors.previous ? lessonLink(neighbors.previous.id) : '/topics/' + data.topic.id
              "
              >{{ neighbors.previous?.title ?? $t("topic.lessons") }}</UiButton
            >
            <UiButton
              v-if="neighbors.next"
              icon-right="arrow-right"
              :to="lessonLink(neighbors.next.id)"
              >{{ neighbors.next.title }}</UiButton
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
.lesson__nav {
  justify-content: space-between;
}
</style>
