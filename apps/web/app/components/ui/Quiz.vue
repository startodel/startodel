<script setup lang="ts">
export interface QuizQuestion {
  prompt: string;
  options: string[];
}
export interface QuizResult {
  /** Whether each answer was correct, by question. */
  perQuestion: boolean[];
  feedback?: { correctIndex: number; explanation?: string }[];
}
/**
 * A Quiz. The learner picks one option per question and submits once. The correct option and
 * the explanation arrive with the result: they are never part of the questions.
 */
const props = withDefaults(
  defineProps<{
    questions: QuizQuestion[];
    /** Set after submission. While it is set the options are locked. */
    result?: QuizResult;
    disabled?: boolean;
    busy?: boolean;
    /** Shown when the answers could not be recorded. */
    error?: string;
    /** A unique prefix for input names when several quizzes share a page. */
    name: string;
    submitLabel?: string;
    /** Number questions from this value. A Practice Quiz spans several Lessons. */
    startAt?: number;
  }>(),
  { startAt: 1 },
);
const answers = defineModel<(number | undefined)[]>({ default: () => [] });
defineEmits<{ submit: []; retry: [] }>();
const answered = computed(
  () => props.questions.filter((_, i) => answers.value[i] !== undefined).length,
);
const correct = computed(() => props.result?.perQuestion.filter(Boolean).length ?? 0);
const pick = (question: number, option: number) => {
  const next = [...answers.value];
  next[question] = option;
  answers.value = next;
};
const letter = (index: number) => String.fromCharCode(65 + index);
function optionState(question: number, option: number) {
  if (!props.result) return answers.value[question] === option ? "picked" : "idle";
  const right = props.result.feedback?.[question]?.correctIndex === option;
  if (right || (props.result.perQuestion[question] && answers.value[question] === option))
    return "correct";
  return answers.value[question] === option ? "wrong" : "idle";
}
</script>
<template>
  <form class="s-quiz" :class="{ 'is-judged': result }" @submit.prevent="$emit('submit')">
    <fieldset
      v-for="(q, i) in questions"
      :key="i"
      class="s-quiz__question"
      :class="result && (result.perQuestion[i] ? 'is-correct' : 'is-wrong')"
      :disabled="disabled || busy || !!result"
    >
      <legend class="s-quiz__prompt">
        <span class="s-quiz__number">{{ String(startAt + i).padStart(2, "0") }}</span>
        <span class="s-quiz__text"><UiInline :text="q.prompt" /></span>
      </legend>
      <div class="s-quiz__options">
        <label
          v-for="(option, j) in q.options"
          :key="j"
          class="s-quiz__option"
          :class="'is-' + optionState(i, j)"
        >
          <input
            type="radio"
            class="s-quiz__input"
            :name="name + '-' + i"
            :value="j"
            :checked="answers[i] === j"
            required
            @change="pick(i, j)"
          />
          <span class="s-quiz__letter" aria-hidden="true">{{ letter(j) }}</span>
          <span class="s-quiz__option-text"><UiInline :text="option" /></span>
          <span v-if="optionState(i, j) === 'correct'" class="s-quiz__mark"
            ><UiIcon name="check" :size="12" />{{ $t("quiz.right") }}</span
          >
          <span v-else-if="optionState(i, j) === 'wrong'" class="s-quiz__mark"
            ><UiIcon name="x" :size="12" />{{ $t("quiz.yours") }}</span
          >
        </label>
      </div>
      <div v-if="result" class="s-quiz__feedback">
        <p class="s-quiz__outcome">
          <UiVerdict :verdict="result.perQuestion[i] ? 'strong' : 'weak'" glyph-only size="sm" />
          {{ result.perQuestion[i] ? $t("quiz.right") : $t("quiz.wrong") }}
        </p>
        <UiProse
          v-if="result.feedback?.[i]?.explanation"
          :markdown="result.feedback[i]!.explanation!"
          size="sm"
        />
      </div>
    </fieldset>
    <footer class="s-quiz__foot">
      <template v-if="result">
        <p class="s-quiz__score" role="status">
          <strong>{{ $t("quiz.score", { correct, total: questions.length }) }}</strong>
        </p>
        <slot name="result" />
        <UiButton variant="ghost" size="sm" icon="review" @click="$emit('retry')">{{
          $t("quiz.retry")
        }}</UiButton>
      </template>
      <template v-else>
        <UiButton
          type="submit"
          variant="primary"
          :loading="busy"
          :disabled="disabled || answered < questions.length"
        >
          {{ submitLabel ?? $t("quiz.submit") }}
        </UiButton>
        <p class="s-quiz__score" role="status">
          <template v-if="error"><span class="s-quiz__error">{{ error }}</span></template>
          <template v-else>{{
            $t("quiz.answered", { answered, total: questions.length })
          }}</template>
        </p>
      </template>
    </footer>
  </form>
</template>
<style scoped>
.s-quiz {
  display: grid;
  gap: var(--s-6);
  padding: var(--s-5);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
}
.s-quiz__question {
  display: grid;
  gap: var(--s-3);
  min-width: 0;
}
.s-quiz__question + .s-quiz__question {
  padding-top: var(--s-6);
  border-top: 1px dashed var(--s-line);
}
.s-quiz__prompt {
  display: flex;
  gap: var(--s-3);
  width: 100%;
  margin-bottom: var(--s-3);
  font: 500 var(--s-text-lg) / 1.45 var(--s-font-read);
}
.s-quiz__number {
  flex: none;
  padding-top: 0.3125rem;
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-copper);
}
.s-quiz__options {
  display: grid;
  gap: var(--s-2);
}
.s-quiz__option {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: 0.625rem var(--s-3);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
  cursor: pointer;
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    background var(--s-dur-1) var(--s-ease);
}
.s-quiz__option:hover {
  border-color: var(--s-ink);
}
.s-quiz__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: inherit;
}
.s-quiz__option:has(.s-quiz__input:focus-visible) {
  outline: 2px solid var(--s-focus);
  outline-offset: 2px;
}
.s-quiz__letter {
  flex: none;
  display: grid;
  place-items: center;
  width: 1.375rem;
  height: 1.375rem;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-xs);
  background: var(--s-raised);
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-2);
}
.s-quiz__option-text {
  flex: 1;
  min-width: 0;
  line-height: 1.45;
}
.s-quiz__option.is-picked {
  border-color: var(--s-ink);
  background: var(--s-raised);
  box-shadow: inset 0 0 0 1px var(--s-ink);
}
.s-quiz__option.is-picked .s-quiz__letter {
  border-color: var(--s-inverse);
  background: var(--s-inverse);
  color: var(--s-on-inverse);
}
.is-judged .s-quiz__option {
  cursor: default;
}
.is-judged .s-quiz__option:hover {
  border-color: var(--s-line);
}
.is-judged .s-quiz__option.is-idle {
  color: var(--s-ink-3);
}
.s-quiz__option.is-correct,
.is-judged .s-quiz__option.is-correct:hover {
  border-color: var(--s-verdigris);
  background: var(--s-verdigris-soft);
}
.s-quiz__option.is-correct .s-quiz__letter {
  border-color: var(--s-verdigris);
  background: var(--s-verdigris);
  color: var(--s-raised);
}
.s-quiz__option.is-wrong,
.is-judged .s-quiz__option.is-wrong:hover {
  border-color: var(--s-oxide);
  border-style: dashed;
  background: var(--s-oxide-soft);
}
.s-quiz__option.is-wrong .s-quiz__letter {
  border-color: var(--s-oxide);
  color: var(--s-oxide);
}
.s-quiz__option.is-wrong .s-quiz__option-text {
  text-decoration: line-through;
  text-decoration-color: var(--s-oxide);
}
.s-quiz__mark {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding-top: 0.25rem;
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.is-correct > .s-quiz__mark {
  color: var(--s-verdigris);
}
.is-wrong > .s-quiz__mark {
  color: var(--s-oxide);
}
.s-quiz__feedback {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border-left: 2px solid var(--s-line-strong);
}
.s-quiz__outcome {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
  font-weight: 600;
}
.s-quiz__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-4);
  padding-top: var(--s-4);
  border-top: 1px solid var(--s-line);
}
.s-quiz__score {
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.04em;
  color: var(--s-ink-3);
}
.s-quiz__score strong {
  font-size: var(--s-text-md);
  color: var(--s-ink);
}
.is-judged .s-quiz__score {
  margin-right: auto;
}
.s-quiz__error {
  color: var(--s-oxide);
}
</style>
