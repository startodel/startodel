<script setup lang="ts">
import type { GrillReviewTopic, VerdictState } from "./grill";
import type { LinkTarget } from "./nav";

const props = defineProps<{
  title: string;
  status: "open" | "finished";
  questions: {
    id: string;
    state: VerdictState;
    prompt: string;
    topic?: { tag?: string; title: string };
  }[];
  reinforce: GrillReviewTopic[];
  reviewsTo?: LinkTarget;
  busy?: boolean;
}>();
const current = defineModel<number>("current", { required: true });
const question = computed(() => props.questions[current.value]);
const tally = computed(() => {
  const counts = { none: 0, pending: 0, strong: 0, partial: 0, weak: 0 };
  for (const q of props.questions) counts[q.state]++;
  return counts;
});
const answered = computed(() => props.questions.length - tally.value.none);
const judged = computed(() => answered.value - tally.value.pending);
const firstUnanswered = computed(() => props.questions.findIndex((q) => q.state === "none"));
const strip = useTemplateRef("strip");
async function goToFirstUnanswered() {
  current.value = firstUnanswered.value;
  await nextTick();
  strip.value?.focusCurrent();
}
const countArgs = useCountArgs();
const { t, n } = useI18n();
const progress = computed(() =>
  t("grill.progress", {
    answered: t("grill.answeredOf", {
      ...countArgs(answered.value),
      total: n(props.questions.length),
    }),
    judged: t("grill.judgedCount", countArgs(judged.value)),
  }),
);
</script>
<template>
  <div class="s-bench">
    <header class="s-bench__head">
      <h1 class="s-title s-bench__name">{{ title }}</h1>
      <div class="s-bench__meta">
        <UiBadge :icon="status === 'finished' ? 'check' : 'grill'" variant="outline">{{
          status === "finished" ? t("grill.finished") : t("grill.open")
        }}</UiBadge>
        <p v-if="questions.length" class="s-bench__progress" role="status">{{ progress }}</p>
      </div>
      <UiGrillStrip
        ref="strip"
        v-if="questions.length"
        v-model:current="current"
        :questions="questions"
      />
    </header>
    <UiGrillSummary
      v-if="status === 'finished' || (questions.length > 0 && judged === questions.length)"
      :tally="tally"
      :topics="reinforce"
      :reviews-to="reviewsTo"
    />
    <UiGrillQuestion
      v-if="question"
      :number="current + 1"
      :total="questions.length"
      :prompt="question.prompt"
      :topic="question.topic"
    >
      <slot />
      <nav class="s-bench__nav" :aria-label="t('grill.questions')">
        <UiButton
          variant="ghost"
          size="sm"
          icon="arrow-left"
          :disabled="current === 0 || busy"
          @click="current--"
        >
          {{ t("grill.previous") }}
        </UiButton>
        <UiButton
          variant="ghost"
          size="sm"
          icon-right="arrow-right"
          :disabled="current + 1 === questions.length || busy"
          @click="current++"
        >
          {{ t("grill.next") }}
        </UiButton>
        <UiButton
          v-if="status === 'open' && firstUnanswered >= 0 && firstUnanswered !== current"
          variant="ghost"
          size="sm"
          :disabled="busy"
          @click="goToFirstUnanswered"
          >{{ t("grill.first") }}</UiButton
        >
      </nav>
    </UiGrillQuestion>
    <slot v-else name="empty" />
  </div>
</template>
<style scoped>
.s-bench {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-6);
}
.s-bench__head {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}
.s-bench__meta,
.s-bench__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-3);
}
.s-bench__name {
  font-size: clamp(var(--s-text-xl), 3.4cqi, var(--s-text-3xl));
  overflow-wrap: anywhere;
}
.s-bench__progress {
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  font-variant-numeric: tabular-nums;
}
</style>
