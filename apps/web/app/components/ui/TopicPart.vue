<script setup lang="ts">
import type { BoardTopic, TopicState } from "./board";
/** One Topic on the Track board: designator, state, Mastery and title on a small plate. */
const props = defineProps<{
  topic: BoardTopic;
  /** outline: the Topic alone, as a Public Track shows it. */
  state: TopicState | "outline";
  selected?: boolean;
  faded?: boolean;
  compact?: boolean;
  /** Render a plain plate that cannot be pressed. */
  readonly?: boolean;
}>();
defineEmits<{ select: [id: string] }>();
const { t } = useI18n();
const { topicWord } = useStateWords();
const label = computed(() =>
  props.state === "outline"
    ? t("board.partOutline", { tag: props.topic.tag, title: props.topic.title })
    : t("board.part", {
        tag: props.topic.tag,
        title: props.topic.title,
        level: props.topic.level,
        state: topicWord(props.state),
      }),
);
</script>
<template>
  <component
    :is="readonly ? 'div' : 'button'"
    :type="readonly ? undefined : 'button'"
    class="s-part"
    :class="[
      'is-' + state,
      {
        'is-selected': selected,
        'is-full': topic.level === 4 && state !== 'outline',
        'is-faded': faded,
        's-part--compact': compact,
      },
    ]"
    :role="readonly ? 'img' : undefined"
    :aria-pressed="readonly ? undefined : !!selected"
    :aria-label="label"
    @click="readonly || $emit('select', topic.id)"
  >
    <span class="s-part__head" aria-hidden="true">
      <span class="s-part__tag">{{ topic.tag }}</span>
      <UiIcon v-if="state === 'blocked'" name="lock" :size="11" />
      <span v-if="state === 'blocked' || state === 'ready'" class="s-part__state">{{
        topicWord(state)
      }}</span>
      <UiMastery
        v-if="state !== 'outline'"
        :level="topic.level"
        show="bars"
        :size="compact ? 'sm' : 'md'"
        class="s-part__mastery"
      />
    </span>
    <span class="s-part__title" aria-hidden="true">{{ topic.title }}</span>
  </component>
</template>
<style scoped>
.s-part {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  padding: 0.5rem 0.625rem 0.5625rem;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  text-align: left;
  box-shadow: var(--s-shadow-1);
  transition:
    translate var(--s-dur-1) var(--s-ease),
    opacity var(--s-dur-2) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease),
    border-color var(--s-dur-1) var(--s-ease);
}
button.s-part {
  cursor: pointer;
}
button.s-part:hover {
  translate: 0 -1px;
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.s-part.is-complete {
  border-color: var(--s-copper-line);
}
.s-part.is-full {
  border-color: var(--s-copper-fill);
  box-shadow:
    inset 3px 0 0 var(--s-copper-fill),
    var(--s-shadow-1);
}
.s-part.is-ready {
  border: 1.5px solid var(--s-copper-fill);
  box-shadow: var(--s-glow);
}
.s-part.is-blocked {
  border-style: dashed;
  border-color: var(--s-line-strong);
  background: var(--s-surface);
  color: var(--s-ink-2);
  box-shadow: none;
}
.s-part.is-faded {
  opacity: 0.5;
}
.s-part.is-blocked.is-faded {
  opacity: 0.85;
}
.s-part.is-selected {
  outline: 2px solid var(--s-ink);
  outline-offset: 2px;
  opacity: 1;
}
.s-part__head {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}
.s-part__mastery {
  margin-left: auto;
}
.s-part__tag,
.s-part__state {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-part__tag {
  color: var(--s-ink-3);
}
.is-blocked .s-part__tag {
  color: inherit;
}
.is-ready .s-part__state {
  color: var(--s-copper);
}
.s-part__title {
  display: -webkit-box;
  overflow: hidden;
  font-size: var(--s-text-sm);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.005em;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
.s-part--compact {
  padding: 0.375rem 0.5rem 0.4375rem;
}
.s-part--compact .s-part__title {
  font-size: var(--s-text-xs);
}
</style>
