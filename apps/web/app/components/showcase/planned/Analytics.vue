<script setup lang="ts">
import { useSampleAnalytics } from "./sample-people";
const { counts, change, funnel, mastery, weakSpots, learners, summary } = useSampleAnalytics();
</script>
<template>
  <ShowcaseSpecimen
    id="planned-learner-counts"
    label="UiLearnerCounts"
    note="The headline readouts. A change is an arrow and a number"
    layout="block"
  >
    <UiLearnerCounts :counts="counts" :change="change" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-learner-counts-states"
    label="UiLearnerCounts · states"
    note="Loading, and a Track with too few learners to read anything from"
    layout="block"
  >
    <div class="s-stack">
      <UiLearnerCounts state="loading" />
      <UiLearnerCounts state="empty" />
    </div>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-learner-funnel"
    label="UiLearnerFunnel"
    note="Each bar is drawn against the first step. The outline is what the step before still had"
    layout="block"
  >
    <UiLearnerFunnel :steps="funnel" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-drop-off-list"
    label="UiDropOffList"
    note="Where learners stall, with the signals that flag it"
    layout="block"
  >
    <UiDropOffList :items="weakSpots" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen id="planned-drop-off-list-empty" label="UiDropOffList · empty" layout="block">
    <UiDropOffList :items="[]" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-mastery-stats"
    label="UiMasteryStats"
    note="Learners at each Mastery level per Topic, with the median, Quizzes and Exercises"
    layout="block"
  >
    <UiMasteryStats :topics="mastery" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-learner-table"
    label="UiLearnerTable · gated Track"
    note="Sorts by any column. The learners asked for access, so the author sees them"
    layout="block"
  >
    <UiLearnerTable access="gated" :learners="learners" :per-page="6" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-learner-table-public"
    label="UiLearnerTable · Public Track"
    note="Totals only, and one line that says why"
    layout="block"
  >
    <UiLearnerTable access="public" :summary="summary" />
  </ShowcaseSpecimen>
</template>
