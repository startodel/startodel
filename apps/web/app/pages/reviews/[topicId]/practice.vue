<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const displayDate = useDisplayDate();
const id = String(useRoute().params.topicId);
const url = `/api/reviews/${id}/practice` as const;
const { data, error, refresh } = await useFetch(url);
if (error.value?.statusCode === 404)
  throw createError({
    statusCode: error.value.statusCode,
    message: t("common.error"),
  });
useHead({ title: t("review.practice") });
const answers = ref<(number | undefined)[]>([]);
const busy = ref(false);
const message = ref("");
const stale = ref(false);
async function send(quiz: NonNullable<typeof data.value>) {
  const blocks = new Map<string, { lessonId: string; blockId: string; answers: number[] }>();
  quiz.questions.forEach((q, i) => {
    const key = q.lessonId + "/" + q.blockId;
    const block = blocks.get(key) ?? { lessonId: q.lessonId, blockId: q.blockId, answers: [] };
    block.answers[q.index] = answers.value[i]!;
    blocks.set(key, block);
  });
  return $fetch(url, {
    method: "POST",
    body: { revision: quiz.revision, answers: [...blocks.values()] },
  });
}
const result = ref<Awaited<ReturnType<typeof send>>>();
async function submit() {
  if (
    !data.value ||
    stale.value ||
    busy.value ||
    result.value ||
    data.value.questions.some((_, i) => answers.value[i] === undefined)
  )
    return;
  busy.value = true;
  message.value = "";
  try {
    result.value = await send(data.value);
  } catch (error) {
    const failure = practiceFailure(
      error && typeof error === "object" && "statusCode" in error ? error.statusCode : undefined,
      t,
    );
    stale.value = failure.stale;
    message.value = failure.message;
  } finally {
    busy.value = false;
  }
}
async function reload() {
  await refresh();
  result.value = undefined;
  answers.value = [];
  message.value = "";
  stale.value = false;
}

const quiz = computed(() => practiceQuizProps(data.value?.questions ?? [], result.value?.results));
</script>
<template>
  <div class="s-stack">
    <div>
      <UiButton to="/reviews" variant="ghost" icon="arrow-left">{{ $t("nav.reviews") }}</UiButton>
    </div>
    <UiPageHeader :title="data?.title ?? $t('review.practice')" :kicker="$t('review.practice')" />
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')"
      ><template #actions
        ><UiButton @click="reload">{{ $t("common.retry") }}</UiButton></template
      ></UiNotice
    >
    <UiSkeletonList v-else-if="!data" variant="cards" />
    <template v-else>
      <UiCard v-if="result" aria-live="polite">
        <div class="s-stack">
          <UiVerdict :verdict="result.verdict" size="lg" />
          <p>
            {{
              $t("review.next", {
                box: $n(result.box),
                date: displayDate(result.dueAt),
                level: $n(result.mastery),
              })
            }}
          </p>
        </div>
      </UiCard>
      <UiQuiz
        v-model="answers"
        name="practice"
        v-bind="quiz"
        :busy="busy"
        :disabled="stale"
        :submit-label="$t('review.submit')"
        @submit="submit"
        @retry="reload"
      >
        <template #result
          ><UiButton to="/reviews" icon="arrow-left">{{ $t("review.return") }}</UiButton></template
        >
      </UiQuiz>
      <UiNotice v-if="message" tone="danger" :title="message">
        <template v-if="stale" #actions
          ><UiButton @click="reload">{{ $t("review.reload") }}</UiButton></template
        >
      </UiNotice>
    </template>
  </div>
</template>
