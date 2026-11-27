<script setup lang="ts">
import type { LinkTarget } from "./nav";
import { NuxtLinkLocale } from "#components";
import { COMPLETE_LEVEL } from "./board";
/**
 * A Track in one row: its title and one cell per Topic, coloured by Mastery. The strip reads
 * like a signal meter, so a learner can compare Tracks at a glance.
 */
const props = defineProps<{
  title: string;
  /** The Mastery level of every Topic, in Track order. */
  levels: number[];
  completed?: number;
  total?: number;
  note?: string;
  to?: LinkTarget;
}>();
const complete = computed(
  () => props.completed ?? props.levels.filter((l) => l >= COMPLETE_LEVEL).length,
);
</script>
<template>
  <component
    :is="to ? NuxtLinkLocale : 'div'"
    :to="to"
    class="s-trackstrip"
    :class="{ 's-trackstrip--link': to }"
  >
    <div class="s-trackstrip__head">
      <h3 class="s-trackstrip__title">{{ title }}</h3>
      <p class="s-trackstrip__count">
        <strong>{{ complete }}</strong> {{ $t("board.liveOf", { total: total ?? levels.length }) }}
      </p>
    </div>
    <div
      v-if="levels.length"
      class="s-trackstrip__cells"
      role="img"
      :aria-label="$t('progress.ofTopics', { done: complete, total: total ?? levels.length })"
    >
      <i v-for="(level, i) in levels" :key="i" :class="'is-l' + Math.min(Math.max(level, 0), 4)" />
    </div>
    <p v-if="note || $slots.default" class="s-trackstrip__note"><slot>{{ note }}</slot></p>
  </component>
</template>
<style scoped>
.s-trackstrip {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
  padding: var(--s-4) 0;
  color: var(--s-ink);
  text-decoration: none;
}
.s-trackstrip--link:hover .s-trackstrip__title {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-underline-offset: 0.2em;
}
.s-trackstrip__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-4);
}
.s-trackstrip__title {
  min-width: 0;
  font-size: var(--s-text-md);
  font-weight: 600;
  line-height: 1.3;
}
.s-trackstrip__count,
.s-trackstrip__note {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-3);
  white-space: nowrap;
}
.s-trackstrip__count strong {
  font-size: var(--s-text-sm);
  color: var(--s-ink);
}
.s-trackstrip__note {
  text-transform: none;
  letter-spacing: 0.02em;
  white-space: normal;
}
.s-trackstrip__cells {
  display: flex;
  gap: 2px;
  height: 0.875rem;
}
.s-trackstrip__cells i {
  flex: 1;
  min-width: 2px;
  max-width: 2rem;
  border-radius: 1px;
}
.s-trackstrip__cells .is-l0 {
  box-shadow: inset 0 0 0 1px var(--s-line-strong);
}
.s-trackstrip__cells .is-l1 {
  background: var(--s-mastery-1);
}
.s-trackstrip__cells .is-l2 {
  background: var(--s-mastery-2);
}
.s-trackstrip__cells .is-l3 {
  background: var(--s-mastery-3);
}
.s-trackstrip__cells .is-l4 {
  background: var(--s-mastery-4);
}
</style>
