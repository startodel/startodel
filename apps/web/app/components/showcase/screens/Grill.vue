<script setup lang="ts">
import type { VerdictState } from "../../ui/grill";
import {
  sampleGrillPrompt,
  sampleGrills,
  sampleQuestions,
  sampleBoardTopics,
  screenPath,
} from "../sample";
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
  sampleQuestions.map((q, i) => ({ id: q.tag, state: states.value[i]! })),
);
const current = ref(stage.value.at);
const question = computed(() => sampleQuestions[current.value]!);
const topic = computed(() => sampleTopics.find((t) => t.id === question.value.topic));
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
    notify({ tone: "success", title: "Answer saved", text: "Your agent can judge it now." });
  }, 700);
}
const fallbackAnswer =
  "The loop was busy when the timer expired. Timers only run in the timers phase, so a long synchronous task or a long poll phase pushes them back. Garbage collection pauses add to that.";
const count = (v: VerdictState) => states.value.filter((s) => s === v).length;
const reinforce = [
  {
    tag: indexTag("topic", 6),
    title: "Streams and backpressure",
    verdict: "weak" as const,
    due: "Review tomorrow",
  },
  {
    tag: indexTag("topic", 5),
    title: "Async functions under the hood",
    verdict: "partial" as const,
    due: "Review in 3 days",
  },
  {
    tag: indexTag("topic", 3),
    title: "Microtasks and promise jobs",
    verdict: "partial" as const,
    due: "Review in 3 days",
  },
];
</script>
<template>
  <ShowcaseApp
    current="grills"
    :crumbs="
      state === 'sessions'
        ? [{ label: 'Grills' }]
        : [
            { label: 'Grills', to: { path: screenPath('grill'), query: { state: 'sessions' } } },
            { label: 'Node.js runtime internals · round 3' },
          ]
    "
  >
    <div v-if="state === 'sessions'" class="s-stack" style="--s-gap: var(--s-8)">
      <UiPageHeader
        title="Grills"
        description="A Grill is a bench test: about fifteen questions, answered in your own words and judged by your agent."
      >
        <template #actions>
          <UiPopover title="Your agent starts a Grill" align="end">
            <template #trigger
              ><UiButton variant="primary" icon="plus">New Grill</UiButton></template
            >
            <div class="s-stack" style="--s-gap: var(--s-3)">
              <p>Startodel has no model of its own. Ask your agent to open a GrillSession.</p>
              <UiAgentPrompt
                compact
                text="Start a GrillSession of 15 questions on my Track Node.js runtime internals."
                tool="start_grill"
              />
            </div>
          </UiPopover>
        </template>
      </UiPageHeader>
      <ul class="sessions">
        <li v-for="g in sampleGrills" :key="g.id">
          <NuxtLinkLocale
            :to="{ path: screenPath('grill'), query: { state: g.open ? 'waiting' : 'summary' } }"
            class="sessions__row"
          >
            <div class="sessions__main">
              <p class="s-label">{{ g.when }} · {{ g.open ? "open" : "finished" }}</p>
              <h2 class="sessions__title">{{ g.title }}</h2>
            </div>
            <UiProgress
              class="sessions__progress"
              :value="g.judged"
              :max="g.total"
              segmented
              show-value
              :tone="g.open ? 'copper' : 'neutral'"
              label="Questions judged"
            />
            <p class="sessions__verdicts">
              <span
                ><UiVerdict verdict="strong" glyph-only size="sm" />{{ g.verdicts.strong }}</span
              >
              <span
                ><UiVerdict verdict="partial" glyph-only size="sm" />{{ g.verdicts.partial }}</span
              >
              <span><UiVerdict verdict="weak" glyph-only size="sm" />{{ g.verdicts.weak }}</span>
            </p>
            <UiIcon name="chevron-right" :size="14" class="sessions__go" />
          </NuxtLinkLocale>
        </li>
      </ul>
    </div>

    <div v-else class="bench">
      <header class="bench__head">
        <div class="bench__title">
          <p class="s-label">GrillSession · {{ state === "summary" ? "finished" : "open" }}</p>
          <h1 class="s-title bench__name">Node.js runtime internals · round 3</h1>
        </div>
        <dl class="bench__readout">
          <div>
            <dt>Answered</dt>
            <dd>{{ stage.answered }} / 15</dd>
          </div>
          <div>
            <dt>Judged</dt>
            <dd>{{ stage.judged }} / 15</dd>
          </div>
          <div>
            <dt>Waiting</dt>
            <dd>{{ stage.answered - stage.judged }}</dd>
          </div>
        </dl>
      </header>

      <UiGrillStrip v-model:current="current" :questions="pads" class="bench__strip" />

      <section v-if="state === 'summary'" class="summary" aria-labelledby="grill-summary">
        <div class="summary__main">
          <p class="s-label">Session summary</p>
          <h2 id="grill-summary" class="s-title">9 strong of 15. Two Topics lost signal.</h2>
          <UiVerdictTally
            :strong="count('strong')"
            :partial="count('partial')"
            :weak="count('weak')"
          />
        </div>
        <div class="summary__side">
          <UiSectionHeading title="What to reinforce" :level="3" />
          <ul class="reinforce">
            <li v-for="r in reinforce" :key="r.tag">
              <UiVerdict :verdict="r.verdict" glyph-only />
              <span class="reinforce__main">
                <NuxtLinkLocale :to="screenPath('track')" class="reinforce__title"
                  >{{ r.tag }} {{ r.title }}</NuxtLinkLocale
                >
                <span class="reinforce__due">{{ r.due }}</span>
              </span>
            </li>
          </ul>
          <div class="s-cluster">
            <UiButton variant="primary" :to="screenPath('reviews')" icon="review"
              >Open reviews</UiButton
            >
            <UiButton :to="screenPath('track')">Back to the Track</UiButton>
          </div>
        </div>
      </section>

      <UiGrillQuestion
        :number="current + 1"
        :total="sampleQuestions.length"
        :prompt="question.prompt"
        :topic="topic ? { tag: topic.tag, title: topic.title } : undefined"
      >
        <UiGrillAnswer
          v-if="stateNow === 'none' && state !== 'summary'"
          :id="'answer-' + question.tag"
          v-model="draft"
          :busy="busy"
          @submit="submit"
        />
        <UiNotice v-else-if="stateNow === 'none'" title="Unanswered">
          This question had no answer when the session finished, so it has no Verdict.
        </UiNotice>
        <UiGrillJudgment
          v-else
          :answer="question.answer ?? fallbackAnswer"
          source="ui"
          answered-at="Today, 14:02"
          :verdict="
            stateNow === 'pending' ? undefined : (stateNow as 'strong' | 'partial' | 'weak')
          "
          :feedback="
            question.comment ??
            'You named the mechanism and the order. Add one measurement you would take to confirm it in production.'
          "
          judged-at="Today, 14:20"
        >
          <UiAgentPrompt
            :text="sampleGrillPrompt"
            tool="judge_grill_answer"
            label="Ask your agent to judge"
          />
          <div class="s-cluster">
            <UiButton icon="review" @click="notify({ title: 'No new Verdicts yet' })"
              >Check for Verdicts</UiButton
            >
            <span class="s-muted">This page does not judge answers. Your agent does.</span>
          </div>
        </UiGrillJudgment>

        <nav class="bench__nav" aria-label="Questions">
          <UiButton icon="arrow-left" :disabled="current === 0" @click="current--"
            >Previous</UiButton
          >
          <UiButton
            v-if="state !== 'summary' && stage.answered < 15"
            variant="ghost"
            :disabled="current === stage.answered"
            @click="current = stage.answered"
            >First unanswered</UiButton
          >
          <UiButton
            icon-right="arrow-right"
            :disabled="current === sampleQuestions.length - 1"
            @click="current++"
            >Next</UiButton
          >
        </nav>
      </UiGrillQuestion>
    </div>
  </ShowcaseApp>
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
  font-size: clamp(1.25rem, 3.4cqi, 1.75rem);
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
  font-size: clamp(1.25rem, 3.4cqi, 1.625rem);
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
  gap: 0.125rem;
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
.sessions {
  display: grid;
  gap: var(--s-3);
  list-style: none;
}
.sessions__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8rem, 14rem) auto auto;
  align-items: center;
  gap: var(--s-3) var(--s-6);
  padding: var(--s-4) var(--s-5);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  color: var(--s-ink);
  text-decoration: none;
}
.sessions__row:hover {
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.sessions__main {
  display: grid;
  gap: var(--s-1);
  min-width: 0;
}
.sessions__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
}
.sessions__verdicts {
  display: flex;
  gap: var(--s-4);
  font: 500 var(--s-text-sm) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.sessions__verdicts span {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}
.sessions__go {
  color: var(--s-ink-3);
}
@container s-main (max-width: 44rem) {
  .sessions__row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .sessions__progress {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .sessions__verdicts {
    grid-column: 1;
    grid-row: 3;
  }
  .sessions__go {
    grid-row: 1;
    grid-column: 2;
  }
}
</style>
