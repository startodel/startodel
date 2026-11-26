<script setup lang="ts">
definePageMeta({ layout: "app" });
const { t } = useI18n();
const formatInterval = useReviewInterval();
const displayDate = useDisplayDate();
useHead({ title: t("nav.reviews") });
const { data, error, refresh } = await useFetch("/api/reviews");
const { boxes, week, today } = useReviewSchedule(() => data.value);
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
    <div v-else class="s-split" style="--s-aside: 21rem">
      <div class="s-stack" style="--s-gap: var(--s-8)">
        <section class="s-stack" style="--s-gap: var(--s-3)">
          <UiSectionHeading :title="$t('review.due')" :count="data.due.length" />
          <UiEmptyState v-if="!data.due.length" compact icon="check" :title="$t('review.done')" />
          <UiReviewCard
            v-for="item in data.due"
            :key="item.topicId"
            :title="item.title"
            :level="item.level"
            :box="item.box"
            :due="
              $t('review.schedule', {
                date: displayDate(item.dueAt),
                interval: formatInterval(item.box),
              })
            "
            :overdue="item.dueAt.slice(0, 10) < today"
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
        <section class="s-stack" style="--s-gap: var(--s-3)">
          <UiSectionHeading :title="$t('review.upcoming')" :count="data.upcoming.length" />
          <UiEmptyState
            v-if="!data.upcoming.length"
            :title="$t('review.none')"
            compact
            icon="check"
          />
          <UiTable
            v-else
            dense
            :caption="$t('review.upcoming')"
            :rows="data.upcoming"
            :row-key="(row) => row.topicId"
            :columns="[
              { key: 'title', label: $t('progress.topic') },
              { key: 'box', label: $t('review.boxLabel') },
              { key: 'dueAt', label: $t('review.nextDate') },
              { key: 'practice', label: $t('review.practice') },
            ]"
          >
            <template #cell-title="{ row }"
              ><NuxtLinkLocale class="s-link" :to="'/topics/' + row.topicId">{{
                row.title
              }}</NuxtLinkLocale>
              <p v-if="row.practiceCorrect !== null && row.practiceTotal !== null">
                {{
                  $t("review.score", {
                    correct: $n(row.practiceCorrect),
                    total: $n(row.practiceTotal),
                  })
                }}
              </p>
              <p v-else-if="row.reason">{{ row.reason }}</p>
            </template>
            <template #cell-box="{ row }">{{ formatInterval(row.box) }}</template
            ><template #cell-dueAt="{ row }">{{ displayDate(row.dueAt) }}</template>
            <template #cell-practice="{ row }"
              ><UiButton
                v-if="row.hasQuiz"
                size="sm"
                icon="quiz"
                :to="'/reviews/' + row.topicId + '/practice'"
                >{{ $t("review.practice") }}</UiButton
              >
              <UiAgentPrompt
                v-else
                compact
                :label="$t('review.ask')"
                :text="$t('review.prompt', { title: row.title, id: row.topicId })"
                tool="record_review_result"
            /></template>
          </UiTable>
        </section>
      </div>
      <aside class="s-stack">
        <section class="s-stack" style="--s-gap: var(--s-3)">
          <UiSectionHeading :title="$t('review.week')" :level="3" />
          <UiWeekStrip :days="week" />
        </section>
        <section class="s-stack" style="--s-gap: var(--s-3)">
          <UiSectionHeading :title="$t('review.scheduledBoxes')" :level="3" />
          <p class="s-muted" style="font-size: var(--s-text-sm)">
            {{ $t("review.intervalsHint") }}
          </p>
          <UiLeitnerRack :counts="boxes" />
        </section>
      </aside>
    </div>
  </div>
</template>
