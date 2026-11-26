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
  <div class="bench">
    <UiNotice v-if="error" tone="danger" :title="$t('common.error')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <template v-else>
      <UiBreadcrumbs :items="[{ label: $t('nav.grills'), to: '/grills' }, { label: data.title }]" />
      <header class="bench__head">
        <div class="bench__title">
          <p class="s-label">
            {{ data.status === "finished" ? $t("grill.finished") : $t("grill.openSession") }}
          </p>
          <h1 class="s-title bench__name">{{ data.title }}</h1>
        </div>
        <dl class="bench__readout">
          <div>
            <dt>{{ $t("grill.answered") }}</dt>
            <dd>{{ $n(answered) }} / {{ $n(questions.length) }}</dd>
          </div>
          <div>
            <dt>{{ $t("grill.judged") }}</dt>
            <dd>{{ $n(judged) }} / {{ $n(questions.length) }}</dd>
          </div>
          <div>
            <dt>{{ $t("grill.pending") }}</dt>
            <dd>{{ $n(answered - judged) }}</dd>
          </div>
        </dl>
      </header>
      <UiGrillStrip
        class="bench__strip"
        v-if="questions.length"
        v-model:current="index"
        :questions="pads"
      />
      <section v-if="isSummary" class="summary">
        <div class="summary__main">
          <h2 class="s-title">{{ $t("grill.summary") }}</h2>
          <UiVerdictTally
            :strong="count('strong')"
            :partial="count('partial')"
            :weak="count('weak')"
            :pending="answered - judged"
            :unanswered="questions.length - answered"
          />
        </div>
        <div class="summary__side">
          <UiSectionHeading :title="$t('grill.reinforce')" :level="3" />
          <ul v-if="data.reinforce.length" class="reinforce">
            <li v-for="topic in data.reinforce" :key="topic.id">
              <UiIcon name="review" :size="14" /><span class="reinforce__main"
                ><NuxtLinkLocale class="reinforce__title" :to="'/topics/' + topic.id">{{
                  $t("grill.lessons", { title: topic.title })
                }}</NuxtLinkLocale>
                <span v-if="topic.dueAt" class="reinforce__due">
                  · {{ $t("grill.due", { date: displayDate(topic.dueAt) }) }}</span
                >
              </span>
            </li>
          </ul>
          <UiNotice v-else tone="success" :title="$t('grill.allStrong')" />
          <div><UiButton to="/reviews" icon="review">{{ $t("nav.reviews") }}</UiButton></div>
        </div>
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
          <nav class="bench__nav" :aria-label="$t('grill.questions')">
            <UiButton icon="arrow-left" :disabled="!index || busy" @click="index--">{{
              $t("grill.previous")
            }}</UiButton>
            <UiButton
              v-if="firstUnanswered >= 0 && data.status === 'open'"
              :disabled="busy || index === firstUnanswered"
              @click="index = firstUnanswered"
              >{{ $t("grill.first") }}</UiButton
            >
            <UiButton
              icon-right="arrow-right"
              :disabled="index + 1 >= questions.length || busy"
              @click="index++"
              >{{ $t("grill.next") }}</UiButton
            >
          </nav></UiGrillQuestion
        >
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
<style scoped>
.bench {
  display: grid;
  gap: var(--s-8);
  max-width: 54rem;
  margin: 0 auto;
}
.bench__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--s-4) var(--s-8);
}
.bench__title {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}
.bench__name {
  font-size: clamp(var(--s-text-xl), 3.4cqi, var(--s-control-sm));
}
.bench__readout {
  display: flex;
  gap: var(--s-6);
}
.bench__readout dt {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.bench__readout dd {
  font: 600 var(--s-text-lg) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
}
.bench .bench__strip {
  padding: var(--s-3) var(--s-2);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.bench .bench__strip :deep(.s-verdict) {
  background: var(--s-surface);
  box-shadow: 0 0 0 3px var(--s-surface);
}
.bench__nav {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  justify-items: center;
  gap: var(--s-3);
  padding-top: var(--s-5);
  border-top: 1px solid var(--s-line);
}
.bench__nav > :first-child {
  justify-self: start;
}
.bench__nav > :last-child {
  grid-column: 3;
  justify-self: end;
}
@container s-main (max-width: 32rem) {
  .bench__nav {
    grid-template-columns: 1fr 1fr;
  }
  .bench__nav > :last-child {
    grid-column: 2;
  }
  .bench__nav > :nth-child(2):not(:last-child) {
    grid-area: 2 / 1 / auto / -1;
  }
}
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--s-8);
  padding: var(--s-6);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  background: var(--s-raised);
  box-shadow: var(--s-shadow-2);
}
.summary__main,
.summary__side {
  display: grid;
  align-content: start;
  gap: var(--s-4);
}
.summary__main .s-title {
  font-size: clamp(var(--s-text-xl), 3.4cqi, var(--s-text-2xl));
}
.reinforce {
  display: grid;
  list-style: none;
}
.reinforce li {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3) 0;
  border-top: 1px solid var(--s-line);
}
.reinforce__main {
  display: grid;
  gap: var(--s-1);
}
.reinforce__title {
  color: var(--s-ink);
  font-weight: 600;
  text-decoration: none;
}
.reinforce__title:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-underline-offset: 0.2em;
}
.reinforce__due {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
</style>
