<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t, locale } = useI18n();
const { activityLabel, verdictLabel } = useLearningLabels();
const displayDate = useDisplayDate();
useHead({ title: t("nav.progress") });
const { data, error, refresh } = await useFetch("/api/progress");
const sort = ref("title");
const view = ref("topics");
const topics = computed(() =>
  [...(data.value?.perTopic ?? [])].sort(
    (a, b) =>
      (sort.value === "mastery" ? a.level - b.level : 0) ||
      a.title.localeCompare(b.title, locale.value),
  ),
);
const levels = computed(() => trackLevels(data.value?.perTopic ?? []));
const summary = computed(() => {
  const topics = data.value?.perTopic ?? [];
  return {
    complete: topics.filter((topic) => topic.level >= 2).length,
    read: topics.reduce((count, topic) => count + topic.read, 0),
    lessons: topics.reduce((count, topic) => count + topic.lessons, 0),
  };
});
const tally = computed(() => {
  const counts = { strong: 0, partial: 0, weak: 0 };
  for (const { kind, detail } of data.value?.activity ?? []) {
    if (
      (kind === "Grill verdict" || kind === "Review result") &&
      (detail === "strong" || detail === "partial" || detail === "weak")
    )
      counts[detail]++;
  }
  return counts;
});
const columns = computed(() => [
  { key: "title", label: t("progress.topic") },
  { key: "tracks", label: t("progress.tracks") },
  { key: "level", label: t("progress.mastery") },
  { key: "read", label: t("progress.read") },
  { key: "last", label: t("progress.last") },
]);
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <UiPageHeader :title="$t('nav.progress')" />
    <UiNotice v-if="error" tone="danger" :title="$t('progress.load')"
      ><template #actions
        ><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template
      ></UiNotice
    >
    <UiSkeletonList v-else-if="!data" variant="table" />
    <template v-else>
      <dl class="s-cluster">
        <UiStat
          :label="$t('progress.completedTopics')"
          :value="$n(summary.complete)"
          :unit="'/ ' + $n(topics.length)"
          live
        />
        <UiStat
          :label="$t('progress.read')"
          :value="$n(summary.read)"
          :unit="'/ ' + $n(summary.lessons)"
        />
      </dl>
      <div class="s-split">
        <div class="s-stack">
          <section class="s-stack">
            <UiSectionHeading :title="$t('progress.completion')" :count="data.perTrack.length" />
            <p class="s-muted">{{ $t("progress.threshold") }}</p>
            <UiEmptyState
              v-if="!data.perTrack.length"
              :title="$t('progress.noTracks')"
              compact
              icon="track"
            />
            <UiTrackStrip
              v-for="track in data.perTrack"
              :key="track.trackId"
              :title="track.title"
              :levels="levels.get(track.trackId) ?? []"
              :to="'/tracks/' + track.trackId"
            />
          </section>
          <UiTabs
            v-model="view"
            :label="$t('nav.progress')"
            :tabs="[
              { id: 'topics', label: $t('track.topics'), count: topics.length },
              { id: 'activity', label: $t('progress.history'), count: data.activity.length },
            ]"
          >
            <template #topics>
              <UiEmptyState v-if="!topics.length" :title="$t('progress.noTopics')" compact />
              <div v-else class="s-stack">
                <UiField :label="$t('progress.sort')"
                  ><UiSelect
                    v-model="sort"
                    :options="[
                      { value: 'title', label: $t('progress.title') },
                      { value: 'mastery', label: $t('progress.lowest') },
                    ]"
                /></UiField>
                <UiTable
                  :caption="$t('track.topics')"
                  :rows="topics"
                  :columns="columns"
                  :row-key="(row) => row.id"
                >
                  <template #cell-title="{ row }"
                    ><NuxtLinkLocale :to="'/topics/' + row.id">{{
                      row.title
                    }}</NuxtLinkLocale></template
                  >
                  <template #cell-tracks="{ row }">{{
                    row.tracks.map((track) => track.title).join(", ") || "—"
                  }}</template>
                  <template #cell-level="{ row }"
                    ><UiMastery :level="row.level" show="full"
                  /></template>
                  <template #cell-read="{ row }"
                    >{{ $n(row.read) }} / {{ $n(row.lessons) }}</template
                  >
                  <template #cell-last="{ row }">{{
                    row.lastActivity ? displayDate(row.lastActivity) : "—"
                  }}</template>
                </UiTable>
              </div>
            </template>
            <template #activity>
              <UiEmptyState
                v-if="!data.activity.length"
                :title="$t('progress.emptyHistory')"
                compact
              />
              <ol v-else>
                <UiTimelineItem
                  v-for="a in data.activity"
                  :key="a.kind + a.id"
                  :kind="activityLabel(a.kind)"
                  :title="a.title"
                  :time="displayDate(a.at)"
                  :datetime="a.at"
                >
                  <template v-if="a.detail">{{
                    a.kind === "Grill verdict" || a.kind === "Review result"
                      ? verdictLabel(a.detail)
                      : a.detail
                  }}</template>
                </UiTimelineItem>
              </ol>
            </template>
          </UiTabs>
        </div>
        <aside class="s-stack">
          <UiCard :tag="$t('progress.levels')"
            ><UiMasteryHistogram :counts="data.masteryDistribution"
          /></UiCard>
          <UiCard :tag="$t('progress.recentVerdicts')"
            ><UiVerdictTally v-bind="tally" :label="$t('progress.recentVerdicts')"
          /></UiCard>
        </aside>
      </div>
    </template>
  </div>
</template>
