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
const firstUnanswered = computed(() => questions.value.findIndex((q) => !q.answeredAt));
const answered = computed(() => questions.value.filter((q) => q.answeredAt).length);
const judged = computed(() => questions.value.filter((q) => q.judgedAt).length);
const index = ref(0);
watch(
  questions,
  (rows, previous) => {
    if (rows.length && !previous?.length) index.value = Math.max(firstUnanswered.value, 0);
  },
  { immediate: true },
);
const current = computed(() => questions.value[index.value]);
const drafts = reactive<Record<string, string>>({});
const failedQuestion = ref<string>();
const busy = ref(false);
const isSummary = computed(
  () =>
    data.value?.status === "finished" ||
    (questions.value.length > 0 && judged.value === questions.value.length),
);
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
    state: q.verdict ?? (q.answeredAt ? ("pending" as const) : ("none" as const)),
  })),
);
const count = (v: "strong" | "partial" | "weak") =>
  questions.value.filter((q) => q.verdict === v).length;
</script>
<template>
  <div class="s-stack">
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <template v-else>
      <UiBreadcrumbs :items="[{ label: $t('nav.grills'), to: '/grills' }, { label: data.title }]" />
      <UiPageHeader
        :title="data.title"
        :kicker="data.status === 'finished' ? $t('grill.finished') : $t('grill.openSession')"
      >
        <template #meta>
          <UiBadge icon="grill">{{
            $t("grill.stats", { answered: $n(answered), judged: $n(judged) })
          }}</UiBadge>
          <UiBadge icon="clock">{{
            $t("grill.waitingCount", { waiting: $n(answered - judged) })
          }}</UiBadge>
        </template>
      </UiPageHeader>
      <UiGrillStrip v-if="questions.length" v-model:current="index" :questions="pads" />
      <section v-if="isSummary" class="s-stack">
        <UiSectionHeading :title="$t('grill.summary')" />
        <UiVerdictTally
          :strong="count('strong')"
          :partial="count('partial')"
          :weak="count('weak')"
          :pending="answered - judged"
          :unanswered="questions.length - answered"
        />
        <UiSectionHeading :title="$t('grill.reinforce')" :level="3" />
        <ul v-if="data.reinforce.length">
          <li v-for="topic in data.reinforce" :key="topic.id">
            <NuxtLinkLocale class="s-link" :to="'/topics/' + topic.id">{{
              $t("grill.lessons", { title: topic.title })
            }}</NuxtLinkLocale>
            <span v-if="topic.dueAt">
              · {{ $t("grill.due", { date: displayDate(topic.dueAt) }) }}</span
            >
          </li>
        </ul>
        <UiNotice v-else tone="success" :title="$t('grill.allStrong')" />
      </section>
      <template v-if="current">
        <UiGrillQuestion :number="index + 1" :total="questions.length" :prompt="current.prompt">
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
        </UiGrillQuestion>
        <nav class="s-cluster" :aria-label="$t('grill.questions')">
          <UiButton icon="arrow-left" :disabled="!index || busy" @click="index--">{{
            $t("grill.previous")
          }}</UiButton>
          <UiButton
            icon-right="arrow-right"
            :disabled="index + 1 >= questions.length || busy"
            @click="index++"
            >{{ $t("grill.next") }}</UiButton
          >
          <UiButton
            v-if="firstUnanswered >= 0 && data.status === 'open'"
            :disabled="busy || index === firstUnanswered"
            @click="index = firstUnanswered"
            >{{ $t("grill.first") }}</UiButton
          >
        </nav>
      </template>
      <UiEmptyState v-else :title="$t('grill.empty')" icon="grill">
        <template v-if="data.status === 'open'">{{ $t("grill.add") }}</template>
        <template v-if="data.status === 'open'" #actions
          ><UiAgentPrompt
            :text="$t('grill.addPrompt', { title: data.title, id })"
            tool="add_grill_questions"
        /></template>
      </UiEmptyState>
    </template>
  </div>
</template>
