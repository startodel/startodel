<script setup lang="ts">
import { publicBlock } from "@startodel/core";
import type { QuizResult } from "../../components/ui/Quiz.vue";

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
const track = computed(() =>
  typeof route.query.track === "string" && /^[a-f0-9-]{36}$/i.test(route.query.track)
    ? route.query.track
    : undefined,
);
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
  <div class="s-stack">
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <template v-else>
      <UiBreadcrumbs
        :items="[
          { label: $t('nav.dashboard'), to: '/' },
          {
            label: data.topic.title,
            to: track ? { path: '/tracks/' + track, query: { topic: data.topic.id } } : undefined,
          },
          { label: data.lesson.title },
        ]"
      />
      <UiPageHeader
        :title="data.lesson.title"
        :description="data.lesson.summary ?? undefined"
        voice="content"
      >
        <template #meta><UiMastery :level="data.mastery" show="full" /></template>
      </UiPageHeader>
      <div v-if="index.length" class="lesson-layout">
        <article class="s-stack">
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
        </article>
        <aside class="lesson-index"><UiLessonIndex :blocks="index" /></aside>
      </div>
      <UiEmptyState v-else :title="$t('lesson.empty')" icon="lesson" />
      <div class="s-cluster">
        <UiButton
          variant="primary"
          icon="check"
          :loading="marking"
          :disabled="!!data.readAt"
          @click="read"
        >
          {{ data.readAt ? $t("lesson.read") : $t("lesson.mark") }}
        </UiButton>
      </div>
      <UiNotice v-if="readError" tone="danger" :title="$t('lesson.readError')" />
    </template>
  </div>
</template>
<style scoped>
.lesson-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-8);
}
.lesson-index {
  display: none;
}
@container s-main (min-width: 66rem) {
  .lesson-layout {
    grid-template-columns: minmax(0, 1fr) 15rem;
  }
  .lesson-index {
    display: block;
    align-self: start;
  }
}
</style>
