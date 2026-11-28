<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { MasteryTopic } from "./analytics";
import { usePercent } from "./analytics";
/**
 * Mastery across the learners of a Track, Topic by Topic: how many learners sit at each level,
 * the median level, and how the Quizzes and Exercises of the Topic go.
 */
defineProps<{ topics: MasteryTopic[] }>();
const { t, n } = useI18n();
const indexTag = useIndexTag();
const percent = usePercent();
const { masteryLabel } = useLearningLabels();
const levels = [0, 1, 2, 3, 4];
const total = (topic: MasteryTopic) => topic.counts.reduce((sum, count) => sum + count, 0);
const alternative = (topic: MasteryTopic) =>
  t("analytics.distribution", {
    parts: levels
      .map((level) =>
        t("analytics.levelCount", { level: masteryLabel(level), n: n(topic.counts[level] ?? 0) }),
      )
      .join(", "),
  });
</script>
<template>
  <div class="s-mastery-stats">
    <ul class="s-mastery-stats__legend" :aria-label="t('analytics.levels')">
      <li v-for="level in levels" :key="level">
        <i :class="'is-l' + level" aria-hidden="true" /><span class="s-mastery-stats__level">{{
          level
        }}</span
        >{{ masteryLabel(level) }}
      </li>
    </ul>
    <p class="s-mastery-stats__head" aria-hidden="true">
      <span>{{ t("analytics.stepTopic") }}</span>
      <span>{{ t("analytics.byLevel") }}</span>
      <span>{{ t("analytics.median") }}</span>
      <span class="s-mastery-stats__num">{{ t("analytics.quizAccuracy") }}</span>
      <span class="s-mastery-stats__num">{{ t("analytics.exercisesDone") }}</span>
    </p>
    <ol class="s-mastery-stats__rows" :aria-label="t('analytics.masteryByTopic')">
      <li v-for="(topic, i) in topics" :key="topic.id" class="s-mastery-stats__row">
        <span class="s-mastery-stats__tag">{{ indexTag("topic", i + 1) }}</span>
        <component
          :is="topic.to ? NuxtLinkLocale : 'span'"
          :to="topic.to"
          class="s-mastery-stats__title"
          >{{ topic.title }}</component
        >
        <span class="s-mastery-stats__bar" role="img" :aria-label="alternative(topic)">
          <template v-for="level in levels" :key="level">
            <i
              v-if="topic.counts[level]"
              :class="'is-l' + level"
              :style="{ flexGrow: topic.counts[level] }"
            />
          </template>
          <i v-if="!total(topic)" class="is-none" />
        </span>
        <span class="s-mastery-stats__cell s-mastery-stats__cell--median">
          <span class="s-mastery-stats__word">{{ t("analytics.median") }}</span>
          <UiMastery :level="topic.median" size="sm" />
        </span>
        <span class="s-mastery-stats__cell s-mastery-stats__cell--quiz">
          <span class="s-mastery-stats__word">{{ t("analytics.quizAccuracy") }}</span>
          <span v-if="topic.quizAccuracy !== null" class="s-mastery-stats__value">{{
            percent(topic.quizAccuracy)
          }}</span>
          <span v-else class="s-mastery-stats__none">{{ t("analytics.noneInTopic") }}</span>
        </span>
        <span class="s-mastery-stats__cell s-mastery-stats__cell--exercise">
          <span class="s-mastery-stats__word">{{ t("analytics.exercisesDone") }}</span>
          <span v-if="topic.exerciseCompletion !== null" class="s-mastery-stats__value">{{
            percent(topic.exerciseCompletion)
          }}</span>
          <span v-else class="s-mastery-stats__none">{{ t("analytics.noneInTopic") }}</span>
        </span>
      </li>
    </ol>
  </div>
</template>
<style scoped>
.s-mastery-stats {
  --_cols: 2.25rem minmax(9rem, 1.2fr) minmax(7rem, 1.4fr) 5rem 7.5rem 7.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  container: s-mastery-stats / inline-size;
}
.s-mastery-stats__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-4);
  margin-bottom: var(--s-4);
  list-style: none;
  font-size: var(--s-text-xs);
  color: var(--s-ink-2);
}
.s-mastery-stats__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.s-mastery-stats__legend i {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 1px;
  box-shadow: inset 0 0 0 1px var(--s-line-strong);
}
.s-mastery-stats__level {
  font: 600 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
}
.s-mastery-stats .is-l0 {
  background: var(--s-mastery-0);
}
.s-mastery-stats .is-l1 {
  background: var(--s-mastery-1);
}
.s-mastery-stats .is-l2 {
  background: var(--s-mastery-2);
}
.s-mastery-stats .is-l3 {
  background: var(--s-mastery-3);
}
.s-mastery-stats .is-l4 {
  background: var(--s-mastery-4);
}
.s-mastery-stats__head,
.s-mastery-stats__row {
  display: grid;
  grid-template-columns: var(--_cols);
  align-items: center;
  gap: var(--s-1) var(--s-3);
}
.s-mastery-stats__head {
  align-items: end;
  padding-bottom: var(--s-2);
  border-bottom: 1px solid var(--s-line-strong);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-mastery-stats__head > :first-child {
  grid-column: 1 / 3;
}
.s-mastery-stats__num {
  text-align: right;
}
.s-mastery-stats__rows {
  list-style: none;
}
.s-mastery-stats__row {
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--s-line);
}
.s-mastery-stats__tag {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  color: var(--s-ink-3);
}
.s-mastery-stats__title {
  min-width: 0;
  font-size: var(--s-text-sm);
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-ink);
  text-decoration: none;
  overflow-wrap: anywhere;
}
a.s-mastery-stats__title:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.s-mastery-stats__bar {
  display: flex;
  gap: 1px;
  height: 0.75rem;
  border-radius: 1px;
  box-shadow: 0 0 0 1px var(--s-line-strong);
  background: var(--s-line-strong);
  overflow: hidden;
}
.s-mastery-stats__bar i {
  flex: 1 1 0;
  min-width: 2px;
}
.s-mastery-stats__bar .is-none {
  background: var(--s-sunken);
}
.s-mastery-stats__cell {
  display: flex;
  align-items: baseline;
  justify-content: flex-end;
  gap: var(--s-2);
  min-width: 0;
}
.s-mastery-stats__cell--median {
  justify-content: flex-start;
}
.s-mastery-stats__value {
  font: 600 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
.s-mastery-stats__none {
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
/* The words name the readouts where the column heads are gone. */
.s-mastery-stats__word {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@container s-mastery-stats (max-width: 44rem) {
  .s-mastery-stats__head {
    display: none;
  }
  .s-mastery-stats__rows {
    border-top: 1px solid var(--s-line-strong);
  }
  .s-mastery-stats__row {
    grid-template-columns: 2.25rem minmax(0, 1fr) auto;
    grid-template-areas:
      "tag title title"
      ". bar bar"
      ". median median"
      ". quiz quiz"
      ". exercise exercise";
  }
  .s-mastery-stats__tag {
    grid-area: tag;
    align-self: baseline;
  }
  .s-mastery-stats__title {
    grid-area: title;
  }
  .s-mastery-stats__bar {
    grid-area: bar;
    margin: var(--s-1) 0;
  }
  .s-mastery-stats__cell {
    justify-content: space-between;
  }
  .s-mastery-stats__cell--median {
    grid-area: median;
  }
  .s-mastery-stats__cell--quiz {
    grid-area: quiz;
  }
  .s-mastery-stats__cell--exercise {
    grid-area: exercise;
  }
  .s-mastery-stats__word {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
    font-size: var(--s-text-xs);
    color: var(--s-ink-3);
  }
}
</style>
