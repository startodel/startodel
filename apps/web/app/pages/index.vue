<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t, n } = useI18n();
const countArgs = useCountArgs();
const displayDate = useDisplayDate();
const { activityLabel } = useLearningLabels();
const me = useMe();
const goalLabels = useGoalLabels();
useHead({ title: t("nav.dashboard") });
const [
  { data, error, refresh },
  { data: step, error: stepError, refresh: retryStep },
  { data: progress, error: progressError, refresh: retryProgress },
  { data: reviews, error: reviewsError, refresh: retryReviews },
] = await Promise.all([
  useFetch("/api/dashboard"),
  useFetch("/api/next-step"),
  useFetch("/api/progress"),
  useFetch("/api/reviews"),
]);
const levels = computed(() => trackLevels(progress.value?.perTopic ?? []));
const { week, boxes } = useReviewSchedule(() => reviews.value);
const nextTitle = computed(() => {
  const s = step.value;
  if (s && "title" in s) return s.title;
  if (s && "suggestions" in s) return t("next.ready");
  if (s?.id === "first-steps") return t("next.onboarding");
  if (s?.id === "build-track-technology") return t("progress.noTracks");
  if (s?.id === "review-loop") return t("count.reviews", countArgs(s.state.dueReviews));
  return t("next.plan");
});
const prompt = computed(() => {
  if (!step.value || !("prompt" in step.value)) return;
  if (step.value.id !== "build-track-technology") return t("next.planPrompt");
  const profile = me.value?.profile;
  const goals = profile?.goals.map((goal) => goalLabels.value.get(goal) ?? goal).join(", ");
  return t("next.buildPrompt", { goals: goals || profile?.stack.join(", ") || t("next.goals") });
});
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <UiPageHeader
      :title="$t('nav.dashboard')"
      :description="
        data
          ? $t('count.tracks', countArgs(data.tracks.length)) +
            ' · ' +
            $t('count.reviews', countArgs(data.dueReviewsCount))
          : undefined
      "
    />
    <UiNotice v-if="stepError" tone="danger" :title="$t('next.load')">
      <template #actions
        ><UiButton @click="retryStep()">{{ $t("common.retry") }}</UiButton></template
      >
    </UiNotice>
    <UiNextUp
      v-else-if="step"
      :title="nextTitle"
      :prompt="prompt"
      :why="
        'title' in step
          ? $t('grill.unanswered', { count: n(step.unanswered) }) +
            ' · ' +
            $t('grill.waitingCount', { waiting: n(step.waiting) })
          : undefined
      "
    >
      <ul v-if="'suggestions' in step">
        <li v-for="topic in step.suggestions" :key="topic.id">
          <NuxtLinkLocale :to="'/topics/' + topic.id">{{ topic.title }}</NuxtLinkLocale>
        </li>
      </ul>
      <template v-if="'href' in step" #actions
        ><UiButton variant="primary" :to="step.href">{{
          step.id === "first-steps"
            ? $t("next.complete")
            : step.id === "grill-session"
              ? $t("next.continue")
              : $t("next.review")
        }}</UiButton></template
      >
    </UiNextUp>
    <UiSkeletonList v-else variant="cards" :rows="1" />
    <UiNotice v-if="error" tone="danger" :title="$t('dashboard.load')">
      <template #actions><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template>
    </UiNotice>
    <UiSkeletonList v-else-if="!data" />
    <UiEmptyState v-else-if="!data.tracks.length" icon="track" :title="$t('dashboard.first')">
      {{ $t("dashboard.start") }}
      <template #actions
        ><UiButton to="/onboarding/connect" icon="plug">{{
          $t("agent.connect")
        }}</UiButton></template
      >
    </UiEmptyState>
    <div class="s-split">
      <div class="s-stack">
        <UiNotice v-if="progressError" tone="danger" :title="$t('progress.load')">
          <template #actions
            ><UiButton @click="retryProgress()">{{ $t("common.retry") }}</UiButton></template
          >
        </UiNotice>
        <section v-if="data?.tracks.length" class="s-stack">
          <UiSectionHeading :title="$t('dashboard.tracks')" :count="data.tracks.length" />
          <UiTrackStrip
            v-for="track in data.tracks"
            :key="track.trackId"
            :title="track.title"
            :to="'/tracks/' + track.trackId"
            :levels="levels.get(track.trackId) ?? []"
            :completed="track.completed"
            :total="track.total"
            :aria-label="
              $t('dashboard.completion', { title: track.title }) +
              ' · ' +
              $t('dashboard.atLevel', { done: n(track.completed), total: n(track.total) })
            "
          >
            {{ $t("dashboard.percent", { percent: n(track.percent / 100, { style: "percent" }) }) }}
            <strong v-if="track.total && track.completed === track.total">
              · {{ $t("dashboard.completed") }}</strong
            >
          </UiTrackStrip>
        </section>
        <section v-if="progress?.activity.length" class="s-stack">
          <UiSectionHeading :title="$t('progress.history')" />
          <ol>
            <UiTimelineItem
              v-for="a in progress.activity.slice(0, 4)"
              :key="a.kind + a.id"
              :title="a.title"
              :kind="activityLabel(a.kind)"
              :datetime="a.at"
              :time="displayDate(a.at)"
            />
          </ol>
          <UiButton variant="ghost" to="/progress">{{ $t("nav.progress") }}</UiButton>
        </section>
      </div>
      <aside class="s-stack">
        <UiNotice v-if="reviewsError" tone="danger" :title="$t('review.load')">
          <template #actions
            ><UiButton @click="retryReviews()">{{ $t("common.retry") }}</UiButton></template
          >
        </UiNotice>
        <template v-else-if="reviews">
          <UiSectionHeading :title="$t('review.due')" :count="reviews.due.length" />
          <ul v-if="reviews.due.length">
            <li v-for="item in reviews.due.slice(0, 4)" :key="item.topicId">
              <NuxtLinkLocale to="/reviews"
                >{{ item.title }} · {{ displayDate(item.dueAt) }}</NuxtLinkLocale
              >
            </li>
          </ul>
          <UiEmptyState v-else compact icon="check" :title="$t('review.done')" />
          <UiButton icon="review" to="/reviews">{{ $t("nav.reviews") }}</UiButton>
          <UiSectionHeading :title="$t('review.week')" :level="3" />
          <UiWeekStrip :days="week" />
          <UiSectionHeading :title="$t('review.scheduledBoxes')" :level="3" />
          <UiLeitnerRack :counts="boxes" compact />
        </template>
        <UiSkeletonList v-else />
      </aside>
    </div>
  </div>
</template>
