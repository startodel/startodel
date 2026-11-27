<script setup lang="ts">
import { isTopicComplete } from "@startodel/core";
import { privateTrackPath } from "../../shared/locale";
definePageMeta({ layout: "app" });
const { t, locale } = useI18n();
const { activityLabel, verdictLabel } = useLearningLabels();
const displayDate = useDisplayDate();
useHead({ title: t("nav.progress") });
const { data, error, refresh } = await useFetch("/api/progress");
const countArgs = useCountArgs();
const page = ref(1);
const perPage = 8;
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
    complete: topics.filter((topic) => isTopicComplete(topic.level, topic.read < topic.lessons))
      .length,
    read: topics.reduce((count, topic) => count + topic.read, 0),
    answers: data.value?.activity.filter((a) => a.kind === "Grill answer").length ?? 0,
    reviews: data.value?.activity.filter((a) => a.kind === "Review result").length ?? 0,
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
const { language, options, filtered } = useTrackLanguageFilter(() => data.value?.perTrack);
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
      <dl class="stats">
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
        <UiStat :label="$t('progress.answers')" :value="$n(summary.answers)">{{
          $t("progress.history")
        }}</UiStat>
        <UiStat :label="$t('nav.reviews')" :value="$n(summary.reviews)">{{
          $t("progress.history")
        }}</UiStat>
      </dl>
      <div class="s-split" style="--s-aside: 24rem">
        <div class="s-stack" style="--s-gap: var(--s-8)">
          <section class="s-stack">
            <UiTrackFilterHeading
              v-model="language"
              :title="$t('progress.completion')"
              :count="filtered.length"
              :options="options"
            />
            <p class="s-muted">{{ $t("progress.threshold") }}</p>
            <UiEmptyState
              v-if="!data.perTrack.length"
              :title="$t('progress.noTracks')"
              compact
              icon="track"
            />
            <div class="rows">
              <UiTrackStrip
                v-for="track in filtered"
                :key="track.trackId"
                :title="track.title"
                :levels="levels.get(track.trackId) ?? []"
                :to="privateTrackPath(track.trackSlug)"
              />
            </div>
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
                  :rows="topics.slice((page - 1) * perPage, page * perPage)"
                  :columns="columns"
                  :row-key="(row) => row.id"
                >
                  <template #cell-title="{ row }"
                    ><NuxtLinkLocale class="topic-link" :to="'/topics/' + row.id">{{
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
                  }}</template> </UiTable
                ><UiPagination
                  v-if="topics.length > perPage"
                  v-model:page="page"
                  :total="topics.length"
                  :per-page="perPage"
                  :label="$t('track.topics')"
                />
              </div>
            </template>
            <template #activity>
              <UiEmptyState
                v-if="!data.activity.length"
                :title="$t('progress.emptyHistory')"
                compact
              />
              <ol v-else class="timeline">
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
            ><div class="s-stack" style="--s-gap: var(--s-5)">
              <p class="histogram-lead">{{ $t("count.topics", countArgs(topics.length)) }}</p>
              <UiMasteryHistogram :counts="data.masteryDistribution" /></div
          ></UiCard>
          <UiCard :tag="$t('progress.recentVerdicts')"
            ><UiVerdictTally v-bind="tally" :label="$t('progress.recentVerdicts')"
          /></UiCard>
        </aside>
      </div>
    </template>
  </div>
</template>
<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
  gap: var(--s-4);
}
.rows > * + * {
  border-top: 1px solid var(--s-line);
}
.timeline {
  list-style: none;
}
.topic-link {
  color: var(--s-ink);
  font-weight: 600;
  text-decoration: none;
}
.topic-link:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-underline-offset: 0.2em;
}
.histogram-lead {
  color: var(--s-ink-2);
}
</style>
