<script setup lang="ts">
import type { LinkTarget } from "./nav";
import { NuxtLinkLocale } from "#components";
import type { TopicState } from "./board";
/** A Topic outside the board: in a list, a grid, or as the header of its detail panel. */
defineProps<{
  title: string;
  tag?: string;
  /** The Topic Slug. */
  slug?: string;
  level: number;
  state?: TopicState;
  /** Lessons read and Lessons in total. */
  lessons?: { read: number; total: number };
  /** When the next review is due, in words. */
  due?: string | null;
  /** Designators of the Topics that must be complete first. */
  after?: string[];
  to?: LinkTarget;
}>();
const { topicWord } = useStateWords();
</script>
<template>
  <component
    :is="to ? NuxtLinkLocale : 'article'"
    :to="to"
    class="s-topic"
    :class="[state && 'is-' + state, { 's-topic--link': to }]"
  >
    <p class="s-topic__meta">
      <span v-if="tag" class="s-topic__tag">{{ tag }}</span>
      <span v-if="state" class="s-topic__state"
        ><UiIcon v-if="state === 'blocked'" name="lock" :size="11" />{{ topicWord(state) }}</span
      >
      <span v-if="after?.length" class="s-topic__after">{{
        $t("board.after", { topics: after.join(", ") })
      }}</span>
    </p>
    <h3 class="s-topic__title">{{ title }}</h3>
    <p v-if="slug" class="s-topic__slug">{{ slug }}</p>
    <div class="s-topic__foot">
      <UiMastery :level="level" show="full" />
      <span v-if="lessons" class="s-topic__fact"
        ><UiIcon name="lesson" :size="12" />{{ $t("topic.lessonsRead", lessons) }}</span
      >
      <span v-if="due" class="s-topic__fact"><UiIcon name="review" :size="12" />{{ due }}</span>
    </div>
    <div v-if="$slots.default" class="s-topic__body"><slot /></div>
  </component>
</template>
<style scoped>
.s-topic {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
  padding: var(--s-4);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  color: var(--s-ink);
  text-decoration: none;
}
.s-topic--link {
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-topic--link:hover {
  border-color: var(--s-ink);
  box-shadow: var(--s-shadow-2);
}
.s-topic.is-ready {
  border-color: var(--s-copper-fill);
}
.s-topic.is-blocked {
  border-style: dashed;
  border-color: var(--s-line-strong);
  background: var(--s-surface);
}
.s-topic__meta,
.s-topic__slug,
.s-topic__fact {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  color: var(--s-ink-3);
}
.s-topic__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
  text-transform: uppercase;
}
.s-topic__state {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}
.is-ready .s-topic__state {
  color: var(--s-copper);
}
.s-topic__after {
  text-transform: none;
}
.s-topic__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.is-blocked .s-topic__title {
  color: var(--s-ink-2);
}
.s-topic__slug {
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
.s-topic__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-4);
  margin-top: var(--s-2);
  padding-top: var(--s-3);
  border-top: 1px solid var(--s-line);
}
.s-topic__fact {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  letter-spacing: 0.02em;
}
.s-topic__body {
  margin-top: var(--s-2);
}
</style>
