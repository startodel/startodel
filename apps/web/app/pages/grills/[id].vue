<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const displayDate = useDisplayDate();
const id = String(useRoute().params.id);
const { data, error, refresh } = await useFetch(`/api/grills/${id}`);
if (error.value?.statusCode === 404)
  throw createError({
    statusCode: error.value.statusCode,
    message: t("common.error"),
  });
useHead({ title: () => data.value?.title });
const questions = computed(() => data.value?.questions ?? []);
const index = ref(0);
watch(
  questions,
  (rows, previous) => {
    if (rows.length && !previous?.length)
      index.value = Math.max(
        rows.findIndex((q) => !q.answeredAt),
        0,
      );
  },
  { immediate: true },
);
const current = computed(() => questions.value[index.value]);
const drafts = reactive<Record<string, string>>({});
const failedQuestion = ref<string>();
const busy = ref(false);
async function answer() {
  const question = current.value;
  if (!question || busy.value) return;
  busy.value = true;
  failedQuestion.value = undefined;
  try {
    await $fetch(`/api/grills/${id}/questions/${question.id}/answer`, {
      method: "POST",
      body: { answer: drafts[question.id] },
    });
    delete drafts[question.id];
  } catch {
    failedQuestion.value = question.id;
  } finally {
    await refresh();
    busy.value = false;
  }
}
const pads = computed(() =>
  questions.value.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    state: q.verdict ?? (q.answeredAt ? ("pending" as const) : ("none" as const)),
  })),
);
const reinforce = computed(
  () => data.value?.reinforce.map((topic) => ({ ...topic, to: "/topics/" + topic.id })) ?? [],
);
</script>
<template>
  <div>
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <UiGrillBench
      v-else
      v-model:current="index"
      :title="data.title"
      :status="data.status"
      :questions="pads"
      :reinforce="reinforce"
      :busy="busy"
    >
      <template v-if="current">
        <UiGrillJudgment
          v-if="current.answeredAt"
          :answer="current.answer ?? ''"
          :source="current.answerSource ?? undefined"
          :answered-at="displayDate(current.answeredAt)"
          :verdict="current.verdict ?? undefined"
          :feedback="current.feedback ?? undefined"
          :judged-at="current.judgedAt ? displayDate(current.judgedAt) : undefined"
        >
          <UiAgentPrompt
            :text="$t('grill.judgePrompt', { title: data.title, id })"
            tool="judge_grill_answer"
          />
          <UiButton @click="refresh()">{{ $t("grill.feedback") }}</UiButton>
        </UiGrillJudgment>
        <UiGrillAnswer
          v-else-if="data.status === 'open'"
          :key="current.id"
          v-model="drafts[current.id]"
          :id="current.id"
          :busy="busy"
          :error="failedQuestion === current.id ? $t('grill.error') : undefined"
          @submit="answer"
        />
        <UiNotice v-else :title="$t('grill.unansweredEnd')" />
      </template>
      <template #empty>
        <UiEmptyState :title="$t('grill.empty')" icon="grill">
          <template v-if="data.status === 'open'">{{ $t("grill.add") }}</template>
          <template v-if="data.status === 'open'" #actions
            ><UiAgentPrompt
              :text="$t('grill.addPrompt', { title: data.title, id })"
              tool="add_grill_questions"
          /></template>
        </UiEmptyState>
      </template>
    </UiGrillBench>
  </div>
</template>
