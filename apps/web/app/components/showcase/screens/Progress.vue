<script setup lang="ts">
import type { TableColumn } from "../../ui/Table.vue";
import {
  sampleActivity,
  sampleMasteryCounts,
  sampleBoardTopics,
  sampleTracks,
  screenPath,
} from "../sample";
const indexTag = useIndexTag();
const sampleTopics = sampleBoardTopics(indexTag);
const total = sampleMasteryCounts.reduce((sum, n) => sum + n, 0);
const complete = sampleMasteryCounts.slice(2).reduce((sum, n) => sum + n, 0);
const sort = ref<{ key: string; dir: "asc" | "desc" } | undefined>({ key: "level", dir: "desc" });
const page = ref(1);
const columns: TableColumn<(typeof sampleTopics)[number]>[] = [
  { key: "tag", label: "Ref", width: "4rem" },
  { key: "title", label: "Topic", sortable: true },
  { key: "level", label: "Mastery", sortable: true },
  { key: "read", label: "Lessons", align: "right", sortable: true },
  { key: "due", label: "Next review", align: "right" },
];
const rows = sampleTopics.slice(0, 8);
const view = ref<"mastery" | "activity">("mastery");
const { language, options, filtered } = useTrackLanguageFilter(() => sampleTracks);
</script>
<template>
  <ShowcaseApp current="progress" :crumbs="[{ label: 'Progress' }]">
    <div class="s-stack" style="--s-gap: var(--s-8)">
      <UiPageHeader
        title="Progress"
        description="Mastery across every Track, and what you did to get there."
      />
      <dl class="stats">
        <UiStat label="Topics live" :value="complete" :unit="'/ ' + total" live
          >Mastery 2 or higher</UiStat
        >
        <UiStat label="Lessons read" value="19" unit="/ 27" />
        <UiStat label="Grill answers" value="42">29 strong · 9 partial · 4 weak</UiStat>
        <UiStat label="Reviews on time" value="86" unit="%">Last 30 days</UiStat>
      </dl>

      <div class="s-split" style="--s-aside: 24rem">
        <div class="s-stack" style="--s-gap: var(--s-8)">
          <section class="s-stack" style="--s-gap: var(--s-2)">
            <UiTrackFilterHeading
              v-model="language"
              title="Tracks"
              :count="filtered.length"
              :options="options"
            />
            <div class="rows">
              <UiTrackStrip
                v-for="t in filtered"
                :key="t.id"
                :title="t.title"
                :levels="t.levels"
                :note="'Updated ' + t.updated"
                :to="screenPath('track')"
              />
            </div>
          </section>

          <UiTabs
            v-model="view"
            label="Progress detail"
            :tabs="[
              { id: 'mastery', label: 'Topics', count: total },
              { id: 'activity', label: 'Activity', count: 30 },
            ]"
          >
            <template #mastery>
              <div class="s-stack" style="--s-gap: var(--s-4)">
                <UiTable
                  v-model:sort="sort"
                  caption="Topics by Mastery"
                  :columns="columns"
                  :rows="rows"
                  :row-key="(r) => r.id"
                >
                  <template #cell-tag="{ row }"
                    ><span class="s-label">{{ row.tag }}</span></template
                  >
                  <template #cell-title="{ row }">
                    <NuxtLinkLocale :to="screenPath('track')" class="topic-link">{{
                      row.title
                    }}</NuxtLinkLocale>
                  </template>
                  <template #cell-level="{ row }"
                    ><UiMastery :level="row.level" show="full"
                  /></template>
                  <template #cell-read="{ row }"
                    ><span class="s-num">{{ row.read }} / {{ row.lessons }}</span></template
                  >
                  <template #cell-due="{ row }"
                    ><span :class="{ 's-muted': !row.due }">{{
                      row.due ?? "not scheduled"
                    }}</span></template
                  >
                </UiTable>
                <UiPagination
                  v-model:page="page"
                  :total="total"
                  :per-page="8"
                  label="Topic pages"
                />
              </div>
            </template>
            <template #activity>
              <ol class="timeline">
                <UiTimelineItem
                  v-for="a in sampleActivity"
                  :key="a.title"
                  :kind="a.kind"
                  :title="a.title"
                  :time="a.time"
                  :icon="a.icon"
                  :tone="a.tone"
                />
              </ol>
            </template>
          </UiTabs>
        </div>

        <aside class="s-stack">
          <UiCard tag="Mastery">
            <div class="s-stack" style="--s-gap: var(--s-5)">
              <p class="histogram-lead">
                <strong>{{ total }}</strong> Topics in your Topic Catalog
              </p>
              <UiMasteryHistogram :counts="sampleMasteryCounts" />
            </div>
          </UiCard>
          <UiCard tag="Verdicts · last 30 days">
            <UiVerdictTally :strong="29" :partial="9" :weak="4" />
          </UiCard>
        </aside>
      </div>
    </div>
  </ShowcaseApp>
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
.histogram-lead strong {
  color: var(--s-ink);
}
</style>
