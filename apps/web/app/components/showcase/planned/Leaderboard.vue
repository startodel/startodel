<script setup lang="ts">
import type { LeaderboardPeriod } from "../../ui/ranking";
import { screenPath } from "../sample";
import { useSamplePoints } from "./sample-people";
const { points, board, outside } = useSamplePoints();
const period = ref<LeaderboardPeriod>("week");
const rows = computed(() => board(period.value));
const me = computed(() => rows.value[3]);
const top = board("week").slice(0, 5);
</script>
<template>
  <ShowcaseSpecimen
    id="planned-points"
    label="UiPoints"
    note="The total, what this week added and what earned it. Compact goes in a header or a cell"
    layout="grid"
  >
    <UiPoints v-bind="points" />
    <div class="s-stack" style="--s-gap: var(--s-3)">
      <UiPoints :total="points.total" :week="points.week" size="compact" />
      <UiPoints :total="64" size="compact" />
      <UiPoints :total="1" size="compact" />
    </div>
    <UiPoints :total="0" :week="0" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-leaderboard"
    label="UiLeaderboard"
    note="The signed-in learner's row carries the trace of the current place. Switch the period"
    layout="block"
  >
    <div style="max-width: 36rem">
      <UiLeaderboard v-model:period="period" :rows="rows" :me="me" />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-leaderboard-states"
    label="UiLeaderboard · states"
    note="A rank outside the list is pinned below it. Loading, empty, and a Public Profile that is off"
    layout="grid"
  >
    <UiLeaderboard :rows="top" :me="outside" />
    <UiLeaderboard :rows="[]" state="loading" />
    <UiLeaderboard :rows="[]" state="empty" period="month" />
    <UiLeaderboard :rows="top" opted-out :settings-to="screenPath('settings')" />
  </ShowcaseSpecimen>
</template>
