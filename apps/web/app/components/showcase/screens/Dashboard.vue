<script setup lang="ts">
import {
  sampleActivity,
  sampleBoxes,
  sampleNextPrompt,
  sampleReviews,
  sampleTracks,
  sampleWeek,
  screenPath,
} from "../sample";
const props = defineProps<{ state?: string }>();
const empty = computed(() => props.state === "empty" || props.state === "waiting");
const week = sampleWeek.map((d) => ({
  label: d.day,
  date: String(d.date),
  count: d.count,
  today: d.today,
}));
</script>
<template>
  <ShowcaseApp
    :tracks="empty ? [] : undefined"
    current="dashboard"
    :crumbs="[{ label: 'Dashboard' }]"
  >
    <div class="s-stack" style="--s-gap: var(--s-8)">
      <UiPageHeader
        kicker="Wednesday 25 November"
        title="Good afternoon, Alice"
        :description="
          empty
            ? '0 Tracks · 0 reviews due'
            : '4 Topics are due for review. One Grill is waiting for your agent.'
        "
      />

      <template v-if="state === 'loading'">
        <UiSkeletonList variant="cards" :rows="1" label="Loading your Next Step" />
        <div class="s-split">
          <UiSkeletonList :rows="3" label="Loading your Tracks" />
          <UiSkeletonList variant="table" :rows="5" label="Loading reviews" />
        </div>
      </template>

      <UiFirstTrack
        v-else-if="empty"
        :connected="state === 'waiting'"
        :prompt="$t('next.buildPrompt', { goals: 'browser internals' })"
        :connect-to="screenPath('connect')"
      />

      <template v-else>
        <UiNextUp
          kind="Study"
          title="Streams and backpressure"
          why="Both prerequisites are complete, so this Topic is ready. It has no Lessons yet: ask your agent to write the first one."
          :prompt="sampleNextPrompt"
          tool="create_lesson"
        >
          <template #actions>
            <UiButton variant="primary" :to="screenPath('track')" icon-right="arrow-right"
              >Open the Track</UiButton
            >
            <UiButton variant="ghost" :to="screenPath('reviews')"
              >Review 4 due Topics first</UiButton
            >
          </template>
        </UiNextUp>

        <div class="s-split">
          <div class="s-stack" style="--s-gap: var(--s-8)">
            <section class="s-stack" style="--s-gap: var(--s-2)">
              <UiSectionHeading title="Tracks" :count="sampleTracks.length" />
              <div class="rows">
                <UiTrackStrip
                  v-for="t in sampleTracks"
                  :key="t.id"
                  :title="t.title"
                  :levels="t.levels"
                  :note="'Updated ' + t.updated"
                  :to="screenPath('track')"
                />
              </div>
            </section>
            <section class="s-stack" style="--s-gap: var(--s-3)">
              <UiSectionHeading title="Latest Activity" />
              <ol class="timeline">
                <UiTimelineItem
                  v-for="a in sampleActivity.slice(0, 4)"
                  :key="a.title"
                  :kind="a.kind"
                  :title="a.title"
                  :time="a.time"
                  :icon="a.icon"
                  :tone="a.tone"
                />
              </ol>
              <div>
                <UiButton
                  variant="ghost"
                  size="sm"
                  :to="screenPath('progress')"
                  icon-right="arrow-right"
                  >All progress</UiButton
                >
              </div>
            </section>
          </div>

          <aside class="s-stack" aria-label="Reviews">
            <section class="s-stack" style="--s-gap: var(--s-3)">
              <UiSectionHeading title="Due for review" :count="sampleReviews.length" :level="3" />
              <ul class="due">
                <li v-for="r in sampleReviews" :key="r.tag">
                  <NuxtLinkLocale :to="screenPath('reviews')" class="due__row">
                    <span class="s-label">{{ r.tag }}</span>
                    <span class="due__title">{{ r.title }}</span>
                    <span class="due__when" :class="{ 'is-late': r.overdue }">{{ r.due }}</span>
                  </NuxtLinkLocale>
                </li>
              </ul>
              <UiButton :to="screenPath('reviews')" block icon="review">Start reviews</UiButton>
            </section>
            <section class="s-stack" style="--s-gap: var(--s-3)">
              <UiSectionHeading title="This week" :level="3" />
              <UiWeekStrip :days="week" />
            </section>
            <section class="s-stack" style="--s-gap: var(--s-3)">
              <UiSectionHeading :title="$t('review.scheduledBoxes')" :level="3" />
              <p class="s-muted" style="font-size: var(--s-text-sm)">
                {{ $t("review.intervalsHint") }}
              </p>
              <UiLeitnerRack :counts="sampleBoxes.map((b) => b.count)" compact />
            </section>
          </aside>
        </div>
      </template>
    </div>
  </ShowcaseApp>
</template>
<style scoped>
.rows > * + * {
  border-top: 1px solid var(--s-line);
}
.timeline {
  list-style: none;
}
.due {
  list-style: none;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  overflow: hidden;
}
.due li + li {
  border-top: 1px solid var(--s-line);
}
.due__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 0 var(--s-3);
  padding: var(--s-3) var(--s-4);
  color: var(--s-ink);
  text-decoration: none;
}
.due__row:hover {
  background: var(--s-surface);
}
.due__title {
  font-weight: 600;
  line-height: 1.3;
}
.due__when {
  grid-column: 2;
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
.due__when.is-late {
  color: var(--s-brass);
  font-weight: 600;
}
</style>
