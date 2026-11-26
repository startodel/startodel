<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const countArgs = useCountArgs();
const formatInterval = useReviewInterval();
const displayDate = useDisplayDate();
const id = String(useRoute().params.topicId);
const url = `/api/reviews/${id}/practice` as const;
const { data, error, refresh } = await useFetch(url);
const { data: schedule, refresh: refreshSchedule } = await useFetch("/api/reviews");
const { boxes } = useReviewSchedule(() => schedule.value);
const item = computed(() =>
  [...(schedule.value?.due ?? []), ...(schedule.value?.upcoming ?? [])].find(
    (r) => r.topicId === id,
  ),
);
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
    await refreshSchedule();
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
  <div class="practice">
    <div>
      <UiButton to="/reviews" variant="ghost" icon="arrow-left">{{ $t("nav.reviews") }}</UiButton>
    </div>
    <UiPageHeader :title="data?.title ?? $t('review.practice')" :kicker="$t('review.practice')">
      <template v-if="data" #meta>
        <UiBadge icon="quiz">{{ $t("count.questions", countArgs(data.questions.length)) }}</UiBadge>
        <UiBadge v-if="item" icon="box">{{
          $t("review.boxFull", { interval: formatInterval(item.box) })
        }}</UiBadge>
        <UiMastery v-if="item" :level="item.level" show="full" />
      </template>
    </UiPageHeader>
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')"
      ><template #actions
        ><UiButton @click="reload">{{ $t("common.retry") }}</UiButton></template
      ></UiNotice
    >
    <UiSkeletonList v-else-if="!data" variant="cards" />
    <template v-else>
      <section
        v-if="result"
        class="outcome"
        :class="'outcome--' + result.verdict"
        aria-live="polite"
      >
        <div class="outcome__main">
          <p class="s-label">{{ $t("grill.verdictTitle") }}</p>
          <h2 class="outcome__title">
            <UiVerdict :verdict="result.verdict" size="lg" />{{
              $t("quiz.score", { correct: $n(result.correct), total: $n(result.total) })
            }}
          </h2>
        </div>
        <UiLeitnerRack v-if="schedule" :counts="boxes" :current="result.box" compact />
        <dl class="outcome__facts">
          <UiStat :label="$t('review.boxLabel')" :value="formatInterval(result.box)" />
          <UiStat :label="$t('review.nextDate')" :value="displayDate(result.dueAt)" />
          <UiStat :label="$t('progress.mastery')" :value="$n(result.mastery)" />
        </dl>
      </section>
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
<style scoped>
.practice {
  display: grid;
  gap: var(--s-8);
  max-width: 48rem;
  margin: 0 auto;
}
.outcome {
  display: grid;
  gap: var(--s-5);
  padding: var(--s-5) var(--s-6);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  background: var(--s-raised);
  box-shadow:
    inset 3px 0 0 var(--s-outcome-edge, var(--s-brass)),
    var(--s-shadow-2);
}
.outcome__main {
  display: grid;
  gap: var(--s-2);
}
.outcome__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
  font: 600 var(--s-text-2xl) / 1.15 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.03em;
}
.outcome--strong {
  --s-outcome-edge: var(--s-verdigris);
}
.outcome--weak {
  --s-outcome-edge: var(--s-oxide);
}
.outcome__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-4);
  padding-top: var(--s-4);
  border-top: 1px solid var(--s-line);
}
@container s-main (max-width: 32rem) {
  .outcome__facts {
    grid-template-columns: 1fr;
  }
}
</style>
