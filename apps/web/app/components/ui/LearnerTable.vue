<script setup lang="ts">
import type { CohortLearner, CohortSummary } from "./analytics";
import { useNarrow } from "./narrow";
import type { TableColumn } from "./Table.vue";
/**
 * The learners of a Track for its author. A gated Track lists them, because each one asked for
 * access. A Public Track shows totals only and says why: its learners never agreed to be listed.
 */
const props = withDefaults(
  defineProps<{
    access: "gated" | "public";
    learners?: CohortLearner[];
    /** The totals a Public Track shows in place of the list. */
    summary?: CohortSummary;
    perPage?: number;
  }>(),
  { learners: () => [], perPage: 10 },
);
const sort = defineModel<{ key: string; dir: "asc" | "desc" } | undefined>("sort");
const page = defineModel<number>("page", { default: 1 });
const { t, n, locale } = useI18n();
const countArgs = useCountArgs();
const displayDate = useDisplayDate("short");
const root = useTemplateRef<HTMLElement>("root");
const narrow = useNarrow(root, 560);
const columns = computed<TableColumn<CohortLearner>[]>(() => [
  { key: "handle", label: t("analytics.learner"), sortable: true },
  {
    key: "progress",
    label: t("analytics.progress"),
    sortable: true,
    sortValue: (row) => (row.lessons ? row.read / row.lessons : 0),
    width: narrow.value ? "46%" : "30%",
  },
  ...(narrow.value
    ? []
    : [
        { key: "mastery", label: t("analytics.medianMastery"), sortable: true },
        { key: "lastActiveAt", label: t("analytics.lastActive"), sortable: true },
      ]),
]);
watch(sort, () => (page.value = 1));
</script>
<template>
  <div ref="root" class="s-learner-table">
    <template v-if="access === 'public'">
      <UiNotice icon="eye-off" :title="t('analytics.hiddenTitle')">{{
        t("analytics.hiddenText")
      }}</UiNotice>
      <dl v-if="summary" class="s-learner-table__totals">
        <UiStat :label="t('analytics.learners')" :value="n(summary.learners)" />
        <UiStat
          :label="t('analytics.averageProgress')"
          :value="n(Math.round(summary.progress * 100))"
          unit="%"
        />
        <div class="s-learner-table__median">
          <dt>{{ t("analytics.medianMastery") }}</dt>
          <dd><UiMastery :level="summary.mastery" size="lg" show="full" /></dd>
        </div>
      </dl>
    </template>
    <template v-else>
      <UiTable
        v-model:sort="sort"
        :columns="columns"
        :rows="learners"
        :row-key="(row) => row.id"
        :caption="t('analytics.cohort')"
        :sort-locale="locale"
        :page="page"
        :per-page="perPage"
      >
        <template #cell-handle="{ row }">
          <span class="s-learner-table__learner">
            <UiAvatar v-if="!narrow" :name="row.handle" :src="row.avatarUrl" :size="24" />
            <span class="s-learner-table__name">
              <bdi class="s-learner-table__handle">@{{ row.handle }}</bdi>
              <time v-if="narrow" :datetime="row.lastActiveAt" class="s-learner-table__when">{{
                displayDate(row.lastActiveAt)
              }}</time>
            </span>
          </span>
        </template>
        <template #cell-progress="{ row }">
          <span class="s-learner-table__progress">
            <UiProgress
              :value="row.read"
              :max="row.lessons"
              size="sm"
              tone="neutral"
              :label="t('analytics.lessonsRead', { read: n(row.read), total: n(row.lessons) })"
            />
            <span class="s-learner-table__read" aria-hidden="true">{{
              t("analytics.readOf", { read: n(row.read), total: n(row.lessons) })
            }}</span>
            <UiMastery v-if="narrow" :level="row.mastery" size="sm" />
          </span>
        </template>
        <template #cell-mastery="{ row }">
          <UiMastery :level="row.mastery" size="sm" show="full" />
        </template>
        <template #cell-lastActiveAt="{ row }">
          <time :datetime="row.lastActiveAt">{{ displayDate(row.lastActiveAt) }}</time>
        </template>
        <template #empty>{{ t("analytics.noLearners") }}</template>
      </UiTable>
      <div v-if="learners.length" class="s-learner-table__foot">
        <p class="s-learner-table__count">
          {{ t("analytics.learnerCount", countArgs(learners.length)) }}
        </p>
        <UiPagination
          v-if="learners.length > perPage"
          v-model:page="page"
          :total="learners.length"
          :per-page="perPage"
        />
      </div>
    </template>
  </div>
</template>
<style scoped>
.s-learner-table {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-4);
  container: s-learner-table / inline-size;
}
.s-learner-table__learner {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
}
.s-learner-table__name {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
}
.s-learner-table__handle {
  font: 600 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
}
.s-learner-table__when {
  font-size: var(--s-text-xs);
  font-weight: 400;
  color: var(--s-ink-3);
}
.s-learner-table__progress {
  display: grid;
  grid-template-columns: minmax(3rem, 1fr) auto;
  align-items: center;
  gap: var(--s-1) var(--s-3);
}
.s-learner-table__read {
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  min-width: 4.25rem;
  text-align: right;
  color: var(--s-ink-2);
}
.s-learner-table__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
}
.s-learner-table__count {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-learner-table__totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 9.5rem), 1fr));
  gap: var(--s-5) var(--s-4);
  margin: 0;
}
.s-learner-table__median {
  display: grid;
  align-content: start;
  gap: var(--s-2);
  min-width: 0;
  padding-left: var(--s-3);
  border-left: 1px solid var(--s-line-strong);
}
.s-learner-table__median dt {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-learner-table__median dd {
  margin: 0;
}
</style>
