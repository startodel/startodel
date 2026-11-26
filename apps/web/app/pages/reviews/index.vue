<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const displayDate = useDisplayDate();
useHead({ title: t("nav.reviews") });
const { data, error, refresh } = await useFetch("/api/reviews");
const { boxes, week } = useReviewSchedule(() => data.value);
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-8)">
    <UiPageHeader :title="$t('nav.reviews')" />
    <UiNotice v-if="error" tone="danger" :title="$t('review.load')"
      ><template #actions
        ><UiButton @click="refresh()">{{ $t("common.retry") }}</UiButton></template
      ></UiNotice
    >
    <UiSkeletonList v-else-if="!data" variant="cards" />
    <div v-else class="s-split">
      <div class="s-stack">
        <section v-for="group in ['due', 'upcoming'] as const" :key="group" class="s-stack">
          <UiSectionHeading
            :title="group === 'due' ? $t('review.due') : $t('review.upcoming')"
            :count="data[group].length"
          />
          <UiEmptyState
            v-if="!data[group].length"
            compact
            icon="check"
            :title="group === 'due' ? $t('review.done') : $t('review.none')"
          />
          <UiReviewCard
            v-for="item in data[group]"
            :key="item.topicId"
            :title="item.title"
            :level="item.level"
            :box="item.box"
            :due="$t('review.schedule', { date: displayDate(item.dueAt), box: $n(item.box) })"
            :overdue="group === 'due'"
            :last-result="item.lastResult"
          >
            <p v-if="item.practiceCorrect !== null && item.practiceTotal !== null">
              {{
                $t("review.score", {
                  correct: $n(item.practiceCorrect),
                  total: $n(item.practiceTotal),
                })
              }}
            </p>
            <p v-else-if="item.reason">{{ item.reason }}</p>
            <UiAgentPrompt
              v-if="!item.hasQuiz"
              compact
              :label="$t('review.ask')"
              :text="$t('review.prompt', { title: item.title, id: item.topicId })"
              tool="record_review_result"
            />
            <template #actions>
              <UiButton
                v-if="item.hasQuiz"
                variant="primary"
                icon="quiz"
                :to="'/reviews/' + item.topicId + '/practice'"
                >{{ $t("review.practice") }}</UiButton
              >
              <UiButton variant="ghost" :to="'/topics/' + item.topicId">{{
                $t("topic.lessons")
              }}</UiButton>
            </template>
          </UiReviewCard>
        </section>
      </div>
      <aside class="s-stack">
        <UiSectionHeading :title="$t('review.week')" :level="3" />
        <UiWeekStrip :days="week" />
        <UiSectionHeading :title="$t('review.scheduledBoxes')" :level="3" />
        <UiLeitnerRack :counts="boxes" />
      </aside>
    </div>
  </div>
</template>
