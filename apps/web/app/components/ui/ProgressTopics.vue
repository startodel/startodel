<script setup lang="ts">
import type { TableColumn } from "./Table.vue";
import type { ProgressTopic } from "../../utils/progress-data";
defineProps<{ topics: ProgressTopic[] }>();
const { t, locale } = useI18n();
const displayDate = useDisplayDate("short");
const indexTag = useIndexTag();
const sort = ref<{ key: string; dir: "asc" | "desc" } | undefined>({ key: "ordinal", dir: "asc" });
const page = ref(1);
const perPage = 8;
watch(sort, () => {
  page.value = 1;
});
const columns = computed<TableColumn<ProgressTopic>[]>(() => [
  { key: "ordinal", label: t("progress.ref"), sortable: true },
  { key: "title", label: t("progress.topic"), sortable: true },
  { key: "level", label: t("progress.mastery"), sortable: true },
  { key: "read", label: t("progress.lessons"), sortable: true, align: "right" },
  {
    key: "nextReview",
    label: t("review.nextDate"),
    sortable: true,
    align: "right",
    sortValue: (row) => (row.nextReview ? Date.parse(row.nextReview) : null),
  },
]);
</script>
<template>
  <div class="s-stack" style="--s-gap: var(--s-4)">
    <UiTable
      v-model:sort="sort"
      :columns="columns"
      :rows="topics"
      :row-key="(row) => row.id"
      :caption="$t('track.topics')"
      :sort-locale="locale"
      :page="page"
      :per-page="perPage"
    >
      <template #cell-ordinal="{ row }"
        ><span class="s-label">{{ indexTag("topic", row.ordinal) }}</span></template
      >
      <template #cell-title="{ row }"
        ><NuxtLinkLocale class="s-progress-topics__link" :to="row.to">{{
          row.title
        }}</NuxtLinkLocale></template
      >
      <template #cell-level="{ row }"><UiMastery :level="row.level" show="full" /></template>
      <template #cell-read="{ row }"
        ><span class="s-num">{{ $n(row.read) }} / {{ $n(row.lessons) }}</span></template
      >
      <template #cell-nextReview="{ row }"
        ><time v-if="row.nextReview" :datetime="row.nextReview">{{
          displayDate(row.nextReview)
        }}</time
        ><span v-else class="s-muted">—</span></template
      >
    </UiTable>
    <UiPagination
      v-if="topics.length > perPage"
      v-model:page="page"
      :total="topics.length"
      :per-page="perPage"
      :label="$t('track.topics')"
    />
  </div>
</template>
<style scoped>
.s-progress-topics__link {
  color: var(--s-ink);
  font-weight: 600;
}
.s-progress-topics__link:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-underline-offset: 0.2em;
}
</style>
