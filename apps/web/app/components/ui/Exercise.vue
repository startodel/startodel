<script setup lang="ts">
/**
 * Hints open one at a time. The solution is fetched only when the learner asks to see it.
 */
const props = defineProps<{
  lessonId: string;
  blockId: string;
  readOnly?: boolean;
  prompt: string;
  hints?: string[];
  /** Empty until the learner reveals it. */
  solution?: string;
  /** The solution is being fetched. */
  revealing?: boolean;
  error?: string;
}>();
defineEmits<{ reveal: [] }>();
const { t, locale } = useI18n();
const task = computed(() => renderExercisePrompt(props.prompt, t("lesson.image")));
const opened = ref(0);
const total = computed(() => props.hints?.length ?? 0);
</script>
<template>
  <div class="s-exercise">
    <div class="s-exercise__task">
      <p class="s-exercise__label">
        <UiIcon name="exercise" :size="12" />{{ $t("lesson.yourTurn") }}
      </p>
      <div v-if="task.before" class="s-prose" v-html="task.before" />
      <UiExerciseEditor
        :key="JSON.stringify([lessonId, blockId, task.language, task.code, locale])"
        :lesson-id="lessonId"
        :block-id="blockId"
        :starter="task.code"
        :language="task.language"
      />
      <div v-if="task.after" class="s-prose" v-html="task.after" />
    </div>
    <div v-if="total" class="s-exercise__hints">
      <ol v-if="opened" class="s-exercise__list">
        <li v-for="(hint, i) in hints!.slice(0, opened)" :key="i" class="s-exercise__hint">
          <span class="s-exercise__hint-tag">{{ $t("lesson.hint", { index: i + 1 }) }}</span>
          <UiProse :markdown="hint" size="sm" />
        </li>
      </ol>
      <UiButton v-if="opened < total" variant="ghost" size="sm" icon="tip" @click="opened++">
        {{ opened ? $t("lesson.nextHint") : $t("lesson.showHint") }}
        <span class="s-exercise__count">{{ opened }} / {{ total }}</span>
      </UiButton>
    </div>
    <div v-if="!readOnly" class="s-exercise__solution" :class="{ 'is-open': solution }">
      <template v-if="solution">
        <p class="s-exercise__label">
          <UiIcon name="eye" :size="12" />{{ $t("lesson.solutionTitle") }}
        </p>
        <UiProse :markdown="solution" />
      </template>
      <template v-else>
        <div class="s-exercise__sealed" aria-hidden="true"><i v-for="n in 4" :key="n" /></div>
        <div class="s-exercise__reveal">
          <UiButton icon="eye" :loading="revealing" @click="$emit('reveal')">{{
            $t("lesson.solution")
          }}</UiButton>
          <p class="s-exercise__note" role="status">
            <span v-if="error" class="s-exercise__error">{{ error }}</span>
            <template v-else>{{ $t("lesson.tryFirst") }}</template>
          </p>
        </div>
      </template>
    </div>
  </div>
</template>
<style scoped>
.s-exercise {
  display: grid;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  overflow: hidden;
}
.s-exercise__task {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  padding: var(--s-5);
}
.s-exercise__label,
.s-exercise__hint-tag,
.s-exercise__count {
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.s-exercise__label {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  color: var(--s-copper);
}
.s-exercise__hints {
  display: grid;
  justify-items: start;
  gap: var(--s-3);
  padding: 0 var(--s-5) var(--s-5);
}
.s-exercise__list {
  display: grid;
  gap: var(--s-3);
  width: 100%;
  list-style: none;
}
.s-exercise__hint {
  display: grid;
  gap: var(--s-1);
  padding: var(--s-3) var(--s-4);
  border-left: 2px solid var(--s-brass);
  background: var(--s-brass-soft);
}
.s-exercise__hint-tag {
  color: var(--s-brass);
}
.s-exercise__count {
  margin-left: var(--s-1);
  color: var(--s-ink-3);
  letter-spacing: 0.04em;
}
.s-exercise__solution {
  position: relative;
  display: grid;
  gap: var(--s-3);
  padding: var(--s-5);
  border-top: 1px dashed var(--s-line-strong);
  background: var(--s-surface);
}
.s-exercise__solution.is-open {
  border-top-style: solid;
}
.s-exercise__solution.is-open .s-exercise__label {
  color: var(--s-verdigris);
}
.s-exercise__sealed {
  display: grid;
  gap: var(--s-2);
}
.s-exercise__sealed i {
  height: 0.625rem;
  border-radius: 1px;
  background: repeating-linear-gradient(90deg, var(--s-line) 0 0.5rem, transparent 0.5rem 0.75rem);
}
.s-exercise__sealed i:nth-child(2) {
  width: 82%;
}
.s-exercise__sealed i:nth-child(3) {
  width: 91%;
}
.s-exercise__sealed i:nth-child(4) {
  width: 46%;
}
.s-exercise__reveal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3) var(--s-4);
}
.s-exercise__note {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.s-exercise__error {
  color: var(--s-oxide);
}
</style>
