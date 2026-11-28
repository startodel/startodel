<script setup lang="ts">
import type { ProgressData } from "../../utils/progress-data";
const props = defineProps<{ data?: ProgressData }>();
const { locale, t } = useI18n();
const { activityLabel, verdictLabel } = useLearningLabels();
const displayDate = useDisplayDate();
const countArgs = useCountArgs();
const view = ref("topics");
const { language, options, filtered } = useTrackLanguageFilter(() => props.data?.perTrack);
const today = useState("progress-day", () => new Date().toISOString().slice(0, 10));
const relative = computed(() => new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" }));
function updated(at: string) {
  const days = (Date.parse(at.slice(0, 10)) - Date.parse(today.value)) / 86400000;
  return t("progress.updated", { when: relative.value.format(days, "day") });
}
</script>
<template>
  <div class="s-stack s-progress" style="--s-gap: var(--s-8)">
    <UiPageHeader :title="$t('nav.progress')" :description="$t('progress.subtitle')" />
    <slot v-if="!data" />
    <template v-else>
      <UiProgressSummary :data="data" />
      <div class="s-split" style="--s-aside: 24rem">
        <div class="s-stack">
          <section class="s-stack" style="--s-gap: var(--s-2)">
            <UiTrackFilterHeading
              v-model="language"
              :title="$t('nav.tracks')"
              :count="filtered.length"
              :options="options"
            />
            <UiEmptyState
              v-if="!data.perTrack.length"
              :title="$t('progress.noTracks')"
              compact
              icon="track"
            />
            <div v-else class="s-progress__tracks">
              <UiTrackStrip
                v-for="track in filtered"
                :key="track.trackId"
                :title="track.title"
                :levels="track.levels"
                :completed="track.completed"
                :note="updated(track.updatedAt)"
                :to="track.to"
              />
            </div>
          </section>
          <UiTabs
            v-model="view"
            keep-alive
            :label="$t('nav.progress')"
            :tabs="[
              { id: 'topics', label: $t('track.topics'), count: data.perTopic.length },
              { id: 'activity', label: $t('progress.activity'), count: data.activity.length },
            ]"
          >
            <template #topics>
              <UiProgressTopics v-if="data.perTopic.length" :topics="data.perTopic" />
              <UiEmptyState v-else :title="$t('progress.noTopics')" compact />
            </template>
            <template #activity>
              <UiEmptyState
                v-if="!data.activity.length"
                :title="$t('progress.emptyHistory')"
                compact
              />
              <ol v-else class="s-progress__timeline">
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
          <UiCard :tag="$t('progress.mastery')">
            <div class="s-stack" style="--s-gap: var(--s-5)">
              <p>{{ $t("progress.catalog", countArgs(data.perTopic.length)) }}</p>
              <UiMasteryHistogram :counts="data.masteryDistribution" />
            </div>
          </UiCard>
          <UiCard :tag="$t('progress.recentVerdicts')">
            <UiVerdictTally
              v-if="
                data.recentVerdicts.strong + data.recentVerdicts.partial + data.recentVerdicts.weak
              "
              v-bind="data.recentVerdicts"
              :label="$t('progress.recentVerdicts')"
            />
            <p v-else class="s-muted">{{ $t("progress.emptyVerdicts") }}</p>
          </UiCard>
        </aside>
      </div>
    </template>
  </div>
</template>
<style scoped>
.s-progress__tracks > * + * {
  border-top: 1px solid var(--s-line);
}
.s-progress__timeline {
  list-style: none;
}
</style>
