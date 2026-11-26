<script setup lang="ts">
import { privateTrackPath } from "../../shared/locale";
definePageMeta({ layout: "app" });
const { t, n } = useI18n();
const countArgs = useCountArgs();
const formatInterval = useReviewInterval();
const displayDate = useDisplayDate();
const { activityLabel } = useLearningLabels();
const me = useMe();
const goalLabels = useGoalLabels();
useHead({ title: t("nav.dashboard") });
const [
  { data, error, refresh },
  { data: progress, error: progressError, refresh: retryProgress },
  { data: reviews, error: reviewsError, refresh: retryReviews },
] = await Promise.all([
  useFetch("/api/dashboard", { key: "dashboard" }),
  useFetch("/api/progress"),
  useFetch("/api/reviews"),
]);
useEmptyDashboardRefresh(
  () => data.value?.tracks.length,
  async () => {
    // Read the board first so the other requests see at least the first Track it saw.
    await refresh();
    await Promise.all([refreshNuxtData("rail-tracks"), retryProgress(), retryReviews()]);
  },
);
const levels = computed(() => trackLevels(progress.value?.perTopic ?? []));
const { week, boxes, today } = useReviewSchedule(() => reviews.value);
const step = computed(() => data.value?.nextStep);
const hero = computed(() => {
  const board = data.value;
  if (!board) return;
  const s = board.nextStep;
  switch (s.kind) {
    case "study": {
      const { title, slug, trackSlug, firstLessonId, allLessonsRead } = s.topic;
      const kind = t("next.study");
      if (firstLessonId)
        return {
          title,
          kind,
          why: allLessonsRead ? t("next.reread") : t("next.lessonReady"),
          to: "/lessons/" + firstLessonId,
          action: t("next.openLesson"),
        };
      return {
        title,
        kind,
        why: t("next.noLessons"),
        to: privateTrackPath(trackSlug),
        action: t("next.openTrack"),
        prompt: t("next.lessonPrompt", { slug }),
        tool: "create_lesson",
      };
    }
    case "review":
      return {
        title: s.title,
        kind: t("next.reviewKind"),
        why: t("count.reviews", countArgs(board.dueReviewsCount)),
        to: s.href,
        action: t("next.review"),
      };
    case "grill":
      return {
        title: s.title,
        kind: t("next.grill"),
        why:
          t("grill.unanswered", { count: n(s.unanswered) }) +
          " · " +
          t("grill.waitingCount", { waiting: n(s.waiting) }),
        to: "/grills/" + s.id,
        action: t("next.continue"),
      };
    case "onboarding":
      return { title: t("next.onboarding"), to: "/onboarding", action: t("next.complete") };
    case "plan":
      return { title: t("next.plan"), prompt: t("next.planPrompt") };
  }
});
const firstPrompt = computed(() => {
  const profile = me.value?.profile;
  const goals = profile?.goals.map((goal) => goalLabels.value.get(goal) ?? goal).join(", ");
  return t("next.buildPrompt", { goals: goals || profile?.stack.join(", ") || t("next.goals") });
});
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <UiPageHeader
      :kicker="displayDate(today)"
      :title="
        me?.user
          ? $t('dashboard.greeting', { name: me.user.name || me.user.login })
          : $t('nav.dashboard')
      "
      :description="
        data
          ? $t('count.tracks', countArgs(data.tracks.length)) +
            ' · ' +
            $t('count.reviews', countArgs(data.dueReviewsCount))
          : undefined
      "
    />
    <UiNotice v-if="error" tone="danger" :title="$t('dashboard.load')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiFirstTrack
      v-else-if="data && step?.kind === 'first-track'"
      :connected="data.hasConnectedAgent"
      :prompt="firstPrompt"
    />
    <UiNextUp
      v-else-if="hero"
      :title="hero.title"
      :kind="hero.kind"
      :why="hero.why"
      :prompt="hero.prompt"
      :tool="hero.tool"
    >
      <template v-if="hero.to" #actions>
        <UiButton variant="primary" :to="hero.to" icon-right="arrow-right">{{
          hero.action
        }}</UiButton>
        <UiButton
          v-if="step?.kind === 'study' && data?.dueReviewsCount"
          variant="ghost"
          to="/reviews"
        >
          {{ $t("next.reviewFirst", countArgs(data.dueReviewsCount)) }}
        </UiButton>
      </template>
    </UiNextUp>
    <UiSkeletonList v-else variant="cards" :rows="1" />
    <div
      v-if="
        data?.tracks.length ||
        reviews?.due.length ||
        reviews?.upcoming.length ||
        progress?.activity.length ||
        progressError ||
        reviewsError
      "
      class="s-split"
    >
      <div class="s-stack" style="--s-gap: var(--s-8)">
        <UiNotice v-if="progressError" tone="danger" :title="$t('progress.load')">
          <template #actions
            ><UiButton @click="retryProgress()">{{ $t("common.retry") }}</UiButton></template
          >
        </UiNotice>
        <section v-if="data?.tracks.length" class="s-stack" style="--s-gap: var(--s-2)">
          <UiSectionHeading :title="$t('dashboard.tracks')" :count="data.tracks.length" />
          <div class="rows">
            <UiTrackStrip
              v-for="track in data.tracks"
              :key="track.trackId"
              :title="track.title"
              :to="privateTrackPath(track.trackSlug)"
              :levels="levels.get(track.trackId) ?? []"
              :completed="track.completed"
              :total="track.total"
              :aria-label="
                $t('dashboard.completion', { title: track.title }) +
                ' · ' +
                $t('dashboard.atLevel', { done: n(track.completed), total: n(track.total) })
              "
            >
              {{
                $t("dashboard.percent", { percent: n(track.percent / 100, { style: "percent" }) })
              }}
              <strong v-if="track.total && track.completed === track.total">
                · {{ $t("dashboard.completed") }}</strong
              >
            </UiTrackStrip>
          </div>
        </section>
        <section v-if="progress?.activity.length" class="s-stack">
          <UiSectionHeading :title="$t('progress.history')" />
          <ol class="timeline">
            <UiTimelineItem
              v-for="a in progress.activity.slice(0, 4)"
              :key="a.kind + a.id"
              :title="a.title"
              :kind="activityLabel(a.kind)"
              :datetime="a.at"
              :time="displayDate(a.at)"
            />
          </ol>
          <div>
            <UiButton variant="ghost" size="sm" to="/progress" icon-right="arrow-right">{{
              $t("nav.progress")
            }}</UiButton>
          </div>
        </section>
      </div>
      <aside class="s-stack" :aria-label="$t('nav.reviews')">
        <UiNotice v-if="reviewsError" tone="danger" :title="$t('review.load')">
          <template #actions
            ><UiButton @click="retryReviews()">{{ $t("common.retry") }}</UiButton></template
          >
        </UiNotice>
        <template v-else-if="reviews">
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading :level="3" :title="$t('review.due')" :count="reviews.due.length" />
            <ul v-if="reviews.due.length" class="due">
              <li v-for="item in reviews.due.slice(0, 4)" :key="item.topicId">
                <NuxtLinkLocale to="/reviews" class="due__row">
                  <span class="s-label">{{ formatInterval(item.box) }}</span>
                  <span class="due__title">{{ item.title }}</span>
                  <span class="due__when" :class="{ 'is-late': item.dueAt.slice(0, 10) < today }">{{
                    displayDate(item.dueAt)
                  }}</span>
                </NuxtLinkLocale>
              </li>
            </ul>
            <UiEmptyState v-else compact icon="check" :title="$t('review.done')" />
            <UiButton block icon="review" to="/reviews">{{ $t("nav.reviews") }}</UiButton>
          </section>
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading :title="$t('review.week')" :level="3" />
            <UiWeekStrip :days="week" />
          </section>
          <section class="s-stack" style="--s-gap: var(--s-3)">
            <UiSectionHeading :title="$t('review.scheduledBoxes')" :level="3" />
            <p class="s-muted" style="font-size: var(--s-text-sm)">
              {{ $t("review.intervalsHint") }}
            </p>
            <UiLeitnerRack :counts="boxes" compact />
          </section>
        </template>
        <UiSkeletonList v-else />
      </aside>
    </div>
  </div>
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
