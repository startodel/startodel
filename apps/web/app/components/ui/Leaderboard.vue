<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { LinkTarget } from "./nav";
import type { LeaderboardPeriod, LeaderboardRow } from "./ranking";
/**
 * A ranking of learners with a Public Profile by points. The signed-in learner's row carries the
 * copper trace of the current place, and it is pinned below the list when their rank falls
 * outside it.
 */
const props = withDefaults(
  defineProps<{
    rows: LeaderboardRow[];
    /** The signed-in learner's row, whether or not it is among `rows`. */
    me?: LeaderboardRow | null;
    state?: "ready" | "loading" | "empty";
    /** The learner's Public Profile is off, so they are not ranked. */
    optedOut?: boolean;
    /** Where the learner turns the Public Profile on. */
    settingsTo?: LinkTarget;
  }>(),
  { state: "ready" },
);
const period = defineModel<LeaderboardPeriod>("period", { default: "week" });
const { t, n } = useI18n();
const countArgs = useCountArgs();
const id = useId();
const periods = computed(() => [
  { id: "week" as const, label: t("points.periodWeek") },
  { id: "month" as const, label: t("points.periodMonth") },
  { id: "all" as const, label: t("points.periodAll") },
]);
const entries = computed(() => {
  const mine = props.me?.id;
  const listed = props.rows.map((row) => ({ ...row, mine: row.id === mine, pinned: false }));
  if (props.me && !listed.some((row) => row.mine))
    listed.push({ ...props.me, mine: true, pinned: true });
  return listed.map((row) => ({ ...row, movement: movement(row.move) }));
});
function movement(move: number | null) {
  if (move === null) return { icon: "plus" as const, text: t("points.new"), word: true };
  if (!move) return { icon: "steady" as const, text: t("points.same") };
  const size = n(Math.abs(move));
  return move > 0
    ? { icon: "sort-up" as const, text: t("points.up", { n: size }), size }
    : { icon: "sort-down" as const, text: t("points.down", { n: size }), size };
}
</script>
<template>
  <section class="s-leaderboard" :aria-labelledby="id">
    <header class="s-leaderboard__head">
      <UiSectionHeading :id="id" :title="t('points.leaderboard')" :level="3" />
      <div class="s-leaderboard__bar">
        <p class="s-leaderboard__scope">{{ t("points.scope") }}</p>
        <UiSegmented v-model="period" size="sm" :label="t('points.period')" :options="periods" />
      </div>
    </header>
    <UiSkeletonList v-if="state === 'loading'" :rows="5" />
    <UiEmptyState
      v-else-if="state === 'empty' || !entries.length"
      compact
      icon="progress"
      :title="t('points.tooQuiet')"
    >
      {{ t("points.tooQuietHint") }}
    </UiEmptyState>
    <template v-else>
      <p class="s-leaderboard__cols" aria-hidden="true">
        <span>{{ t("points.rank") }}</span>
        <span>{{ t("points.learner") }}</span>
        <span class="s-leaderboard__num">{{ t("points.title") }}</span>
      </p>
      <ol class="s-leaderboard__rows">
        <li
          v-for="row in entries"
          :key="row.id"
          class="s-leaderboard__row"
          :class="{ 'is-me': row.mine, 'is-pinned': row.pinned, 'is-top': row.rank <= 3 }"
          :aria-current="row.mine ? 'true' : undefined"
        >
          <span class="s-leaderboard__rank"
            ><span class="s-sr">{{ t("points.rank") }}</span> {{ n(row.rank) }}</span
          >
          <UiAvatar :name="row.handle" :src="row.avatarUrl" :size="24" />
          <span class="s-leaderboard__who">
            <component
              :is="row.to ? NuxtLinkLocale : 'span'"
              :to="row.to"
              class="s-leaderboard__handle"
              ><bdi>@{{ row.handle }}</bdi></component
            >
            <span v-if="row.mine" class="s-leaderboard__you">{{ t("points.you") }}</span>
          </span>
          <span class="s-leaderboard__move" :class="{ 'is-word': row.movement.word }">
            <UiIcon :name="row.movement.icon" :size="12" />
            <span v-if="!row.movement.word" class="s-sr">{{ row.movement.text }}</span>
            <span v-if="row.movement.word">{{ row.movement.text }}</span>
            <span v-else-if="row.movement.size" aria-hidden="true">{{ row.movement.size }}</span>
          </span>
          <span class="s-leaderboard__points">
            <span class="s-sr">{{ t("points.total", countArgs(row.points)) }}</span>
            <span aria-hidden="true">{{ n(row.points) }}</span>
          </span>
        </li>
      </ol>
    </template>
    <UiNotice v-if="optedOut" icon="eye-off" :title="t('points.optedOut')">
      {{ t("points.optedOutHint") }}
      <span v-if="settingsTo" class="s-leaderboard__join">
        <UiButton size="sm" :to="settingsTo">{{ t("points.openSettings") }}</UiButton>
      </span>
    </UiNotice>
  </section>
</template>
<style scoped>
.s-leaderboard {
  --_cols: 2rem 1.5rem minmax(0, 1fr) 4rem 4.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  container: s-leaderboard / inline-size;
}
.s-leaderboard__head {
  display: grid;
  gap: var(--s-2);
}
.s-leaderboard__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2) var(--s-4);
}
.s-leaderboard__scope {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-leaderboard__cols,
.s-leaderboard__row {
  display: grid;
  grid-template-columns: var(--_cols);
  align-items: center;
  gap: var(--s-3);
  padding: 0 var(--s-4);
}
.s-leaderboard__cols {
  margin-bottom: calc(var(--s-1) * -1);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-leaderboard__cols > :first-child {
  grid-column: 1 / 3;
}
.s-leaderboard__cols > :nth-child(2) {
  grid-column: 3 / 5;
}
.s-leaderboard__num {
  text-align: right;
}
.s-leaderboard__rows {
  list-style: none;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-leaderboard__row {
  position: relative;
  min-height: 2.75rem;
}
.s-leaderboard__row + .s-leaderboard__row {
  border-top: 1px solid var(--s-line);
}
/* The same trace marks the current place in the navigation rail. */
.s-leaderboard__row.is-me {
  background: var(--s-raised);
}
.s-leaderboard__row.is-me::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  width: 0.5rem;
  height: 2px;
  background: var(--s-copper-fill);
  translate: 0 -50%;
}
.s-leaderboard__row.is-pinned {
  border-top: 1px dashed var(--s-line-strong);
}
.s-leaderboard__rank {
  font: 500 var(--s-text-sm) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-2);
}
.s-leaderboard__row.is-top .s-leaderboard__rank {
  font-weight: 700;
  color: var(--s-ink);
}
.s-leaderboard__who {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  min-width: 0;
}
.s-leaderboard__handle {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font: 600 var(--s-text-xs) / 1.5 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
  text-decoration: none;
}
a.s-leaderboard__handle:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.s-leaderboard__you {
  flex: none;
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-copper);
}
.s-leaderboard__move {
  display: inline-flex;
  align-items: center;
  gap: 0.1875rem;
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--s-ink-2);
}
.s-leaderboard__move.is-word {
  font-size: var(--s-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.s-leaderboard__join {
  display: block;
  margin-top: var(--s-3);
}
.s-leaderboard__points {
  text-align: right;
  font: 600 var(--s-text-sm) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
@container s-leaderboard (max-width: 24rem) {
  .s-leaderboard__cols,
  .s-leaderboard__row {
    grid-template-columns: 1.5rem 1.5rem minmax(0, 1fr) 3.25rem 3.5rem;
    gap: var(--s-2);
    padding: 0 var(--s-3);
  }
  .s-leaderboard__row.is-me::before {
    width: 0.375rem;
  }
}
</style>
