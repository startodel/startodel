<script setup lang="ts">
import type { QuizResult } from "../../ui/Quiz.vue";
import { sampleBoxes, sampleReviews, sampleUpcoming, sampleWeek, screenPath } from "../sample";
const formatInterval = useReviewInterval();
const props = defineProps<{ state?: string }>();
const week = sampleWeek.map((d) => ({
  label: d.day,
  date: String(d.date),
  count: props.state === "clear" && d.today ? 0 : d.count,
  today: d.today,
}));
const localePath = useLocalePath();
const practice = (state: string) => ({ path: localePath(screenPath("reviews")), query: { state } });

const questions = [
  {
    prompt:
      "How many times does `await` yield to the microtask queue when it awaits a native promise?",
    options: ["Never", "Once", "Three times", "It depends on the promise"],
    correct: 1,
    explanation: "Since V8 7.2 an `await` of a native promise takes one microtask tick.",
  },
  {
    prompt: "An `async` function throws before its first `await`. What does the caller get?",
    options: [
      "A synchronous exception",
      "A rejected promise",
      "`undefined`",
      "An unhandled rejection at once",
    ],
    correct: 1,
    explanation:
      "The function body runs inside the promise machinery, so a throw becomes a rejection.",
  },
  {
    prompt: "Which of these keeps the event loop responsive during a long loop?",
    options: [
      "`await null` in every iteration",
      "`await setImmediate` wrapped in a promise",
      "`process.nextTick`",
      "A larger heap",
    ],
    correct: 1,
    explanation:
      "Only a macrotask boundary lets the loop reach the poll phase. Microtasks and `nextTick` run before it.",
  },
  {
    prompt: "What does `Promise.all` do when one input rejects?",
    options: [
      "Waits for the rest, then rejects",
      "Rejects at once and cancels the rest",
      "Rejects at once; the rest keep running",
      "Resolves with partial results",
    ],
    correct: 2,
    explanation:
      "Promises are not cancellable. The other operations continue and their results are dropped.",
  },
  {
    prompt: "Where does the stack trace of a rejected `async` function begin?",
    options: [
      "At the original call site, always",
      "At the last `await` that resumed",
      "At `main`",
      "It has no stack",
    ],
    correct: 1,
    explanation:
      "After a suspension the synchronous stack is gone. Async stack traces rebuild it from the await chain.",
  },
];
const answers = ref<(number | undefined)[]>(props.state === "result" ? [1, 1, 0, 2, 1] : [1, 1]);
const result = computed<QuizResult | undefined>(() =>
  props.state === "result"
    ? {
        perQuestion: questions.map((q, i) => answers.value[i] === q.correct),
        feedback: questions.map((q) => ({ correctIndex: q.correct, explanation: q.explanation })),
      }
    : undefined,
);
</script>
<template>
  <ShowcaseApp
    current="reviews"
    :crumbs="
      state === 'practice' || state === 'result'
        ? [{ label: 'Reviews', to: practice('due') }, { label: 'Practice Quiz' }]
        : [{ label: 'Reviews' }]
    "
  >
    <div v-if="state === 'practice' || state === 'result'" class="practice">
      <UiPageHeader kicker="Practice Quiz · T05" title="Async functions under the hood">
        <template #meta>
          <UiBadge icon="quiz">{{ questions.length }} questions from 2 Lessons</UiBadge>
          <UiBadge icon="box">{{ $t("review.boxFull", { interval: formatInterval(1) }) }}</UiBadge>
          <UiMastery :level="2" show="full" />
        </template>
      </UiPageHeader>

      <section v-if="result" class="outcome" aria-live="polite">
        <div class="outcome__main">
          <p class="s-label">Result</p>
          <h2 class="outcome__title"><UiVerdict verdict="partial" size="lg" /> 4 of 5 correct</h2>
          <p class="outcome__text">
            At least half correct gives a partial Verdict. The Topic keeps its current review
            interval.
          </p>
        </div>
        <UiLeitnerRack :counts="sampleBoxes.map((b) => b.count)" :current="1" compact />
        <dl class="outcome__facts">
          <UiStat :label="$t('review.boxLabel')" :value="formatInterval(1)" />
          <UiStat label="Next review" value="3" unit="days" />
          <UiStat label="Mastery" value="2" />
        </dl>
      </section>

      <UiQuiz
        v-model="answers"
        name="practice"
        :questions="questions"
        :result="result"
        submit-label="Submit Practice Quiz"
        @submit="navigateTo(practice('result'))"
        @retry="navigateTo(practice('practice'))"
      >
        <template #result
          ><UiButton :to="practice('due')" icon="arrow-left">Back to reviews</UiButton></template
        >
      </UiQuiz>
    </div>

    <div v-else class="s-stack" style="--s-gap: var(--s-8)">
      <UiPageHeader
        title="Reviews"
        :description="
          state === 'clear'
            ? 'Nothing is due. The next review comes up on Friday.'
            : '4 Topics are due. Two of them are overdue.'
        "
      />
      <div class="s-split" style="--s-aside: 21rem">
        <div class="s-stack" style="--s-gap: var(--s-8)">
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading
              title="Due now"
              :count="state === 'clear' ? 0 : sampleReviews.length"
            />
            <UiEmptyState v-if="state === 'clear'" title="You are up to date" icon="check">
              Every Topic that was due has been reviewed. Spaced reviews work best when you let the
              interval pass.
              <template #actions>
                <UiButton :to="screenPath('track')" icon="track">Study a ready Topic</UiButton>
              </template>
            </UiEmptyState>
            <template v-else>
              <UiReviewCard
                v-for="r in sampleReviews"
                :key="r.tag"
                :title="r.title"
                :tag="r.tag"
                :track="r.track"
                :level="r.level"
                :box="r.box"
                :due="r.due"
                :overdue="r.overdue"
                :last-result="r.overdue ? 'partial' : 'strong'"
              >
                <UiAgentPrompt
                  v-if="!r.questions"
                  compact
                  label="This Topic has no Quiz. Ask your agent to review it"
                  :text="`Review ${r.title} with me and record the result with record_review_result.`"
                  tool="record_review_result"
                />
                <template #actions>
                  <UiButton
                    v-if="r.questions"
                    variant="primary"
                    :to="practice('practice')"
                    icon="quiz"
                    >Practice Quiz</UiButton
                  >
                  <UiButton variant="ghost" :to="screenPath('track')">Lessons</UiButton>
                </template>
              </UiReviewCard>
            </template>
          </section>
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading title="Upcoming" :count="sampleUpcoming.length" />
            <UiTable
              caption="Upcoming reviews"
              dense
              :columns="[
                { key: 'tag', label: 'Ref', width: '4rem' },
                { key: 'title', label: 'Topic' },
                { key: 'box', label: $t('review.boxLabel'), align: 'right' },
                { key: 'due', label: 'Due', align: 'right' },
              ]"
              :rows="sampleUpcoming"
              :row-key="(r) => r.tag"
            >
              <template #cell-tag="{ row }"><span class="s-label">{{ row.tag }}</span></template>
              <template #cell-title="{ row }"><strong>{{ row.title }}</strong></template>
              <template #cell-box="{ row }">{{ formatInterval(row.box) }}</template>
            </UiTable>
          </section>
        </div>
        <aside class="s-stack">
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading title="Next seven days" :level="3" />
            <UiWeekStrip :days="week" />
          </section>
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading :title="$t('review.scheduledBoxes')" :level="3" />
            <p class="s-muted" style="font-size: var(--s-text-sm)">
              {{ $t("review.intervalsHint") }}
            </p>
            <UiLeitnerRack :counts="sampleBoxes.map((b) => b.count)" />
          </section>
        </aside>
      </div>
    </div>
  </ShowcaseApp>
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
    inset 3px 0 0 var(--s-brass),
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
.outcome__text {
  color: var(--s-ink-2);
}
.outcome__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-4);
  padding-top: var(--s-4);
  border-top: 1px solid var(--s-line);
}
</style>
