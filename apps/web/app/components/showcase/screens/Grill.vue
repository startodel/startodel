<script setup lang="ts">
import type { VerdictState } from "../../ui/grill";
import {
  grillSessionsPath,
  sampleGrills,
  sampleQuestions,
  sampleBoardTopics,
  screenPath,
} from "../sample";
const { t } = useI18n();
const displayDate = useDisplayDate();
const indexTag = useIndexTag();
const sampleTopics = sampleBoardTopics(indexTag);
const props = defineProps<{ state?: string }>();

/** How far the sample session has got in each state: answered and judged counts. */
const stage = computed(
  () =>
    ({
      answer: { answered: 6, judged: 5, at: 6 },
      waiting: { answered: 7, judged: 5, at: 5 },
      judged: { answered: 10, judged: 10, at: 5 },
      summary: { answered: 15, judged: 15, at: 9 },
    })[props.state ?? "answer"] ?? { answered: 6, judged: 5, at: 6 },
);
const states = computed<VerdictState[]>(() =>
  sampleQuestions.map((q, i) =>
    i < stage.value.judged ? q.verdict : i < stage.value.answered ? "pending" : "none",
  ),
);
const pads = computed(() =>
  sampleQuestions.map((q, i) => ({
    id: indexTag("question", i + 1),
    prompt: q.prompt,
    state: states.value[i]!,
    topic: sampleTopics.find((t) => t.id === q.topic),
  })),
);
const current = ref(stage.value.at);
const question = computed(() => sampleQuestions[current.value]!);
const stateNow = computed(() => states.value[current.value]!);
const draft = ref(
  props.state === "answer"
    ? "Node.js keeps timers in a min-heap keyed by expiry time, so finding the next timer is O(1) and inserting one is O(log n). The loop only needs the earliest"
    : "",
);
const busy = ref(false);
const { push: notify } = useToast();
function submit() {
  busy.value = true;
  setTimeout(() => {
    busy.value = false;
    notify({ tone: "success", title: t("grill.waiting") });
  }, 700);
}
const fallbackAnswer =
  "The loop was busy when the timer expired. Timers only run in the timers phase, so a long synchronous task or a long poll phase pushes them back. Garbage collection pauses add to that.";
const reinforce = sampleTopics
  .filter((topic) => ["t06", "t05", "t03"].includes(topic.id))
  .map(({ id, title }) => ({ id, title, to: screenPath("track") }));
</script>
<template>
  <ShowcaseApp
    current="grills"
    :crumbs="[
      {
        label: $t('nav.grills'),
        to: state === 'sessions' ? undefined : grillSessionsPath,
      },
    ]"
  >
    <div v-if="state === 'sessions'" class="s-stack">
      <UiPageHeader :title="$t('nav.grills')" :description="$t('grill.intro')">
        <template #actions
          ><UiPopover :title="$t('grill.start')" align="end">
            <template #trigger
              ><UiButton variant="primary" icon="plus">{{ $t("grill.start") }}</UiButton></template
            >
            <UiAgentPrompt compact :text="$t('grill.prompt')" tool="start_grill" /> </UiPopover
        ></template>
      </UiPageHeader>
      <ul class="s-stack" style="--s-gap: var(--s-3)">
        <UiGrillRow
          v-for="g in sampleGrills"
          :key="g.id"
          :to="{
            path: screenPath('grill'),
            query: { state: g.status === 'open' ? 'waiting' : 'summary' },
          }"
          :title="g.title"
          :status="g.status"
          :created-at="g.createdAt"
        />
      </ul>
    </div>

    <UiGrillBench
      v-else
      v-model:current="current"
      :title="sampleGrills[0].title"
      :status="state === 'summary' ? 'finished' : 'open'"
      :questions="pads"
      :reinforce="reinforce"
      :reviews-to="screenPath('reviews')"
      :busy="busy"
    >
      <UiGrillAnswer
        v-if="stateNow === 'none' && state !== 'summary'"
        :id="'answer-' + indexTag('question', current + 1)"
        v-model="draft"
        :busy="busy"
        @submit="submit"
      />
      <UiNotice v-else-if="stateNow === 'none'" :title="$t('grill.unansweredEnd')" />
      <UiGrillJudgment
        v-else
        :answer="question.answer ?? fallbackAnswer"
        source="ui"
        :answered-at="displayDate(sampleGrills[0].createdAt)"
        :verdict="stateNow === 'pending' ? undefined : (stateNow as 'strong' | 'partial' | 'weak')"
        :feedback="
          question.comment ??
          'You named the mechanism and the order. Add one measurement you would take to confirm it in production.'
        "
        :judged-at="displayDate(sampleGrills[0].createdAt)"
      >
        <UiAgentPrompt
          :text="$t('grill.judgePrompt', { title: sampleGrills[0].title, id: sampleGrills[0].id })"
          tool="judge_grill_answer"
        />
        <UiButton @click="notify({ title: $t('grill.waiting') })">{{
          $t("grill.feedback")
        }}</UiButton>
      </UiGrillJudgment>
    </UiGrillBench>
  </ShowcaseApp>
</template>
