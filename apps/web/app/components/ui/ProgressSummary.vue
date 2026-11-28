<script setup lang="ts">
import { isTopicComplete } from "@startodel/core";
import type { ProgressData } from "../../utils/progress-data";
const props = defineProps<{ data: ProgressData }>();
const countArgs = useCountArgs();
const totals = computed(() =>
  props.data.perTopic.reduce(
    (sum, topic) => ({
      complete: sum.complete + Number(isTopicComplete(topic.level, topic.read < topic.lessons)),
      read: sum.read + topic.read,
      lessons: sum.lessons + topic.lessons,
    }),
    { complete: 0, read: 0, lessons: 0 },
  ),
);
</script>
<template>
  <dl class="s-progress-summary">
    <UiStat
      :label="$t('progress.completedTopics')"
      :value="$n(totals.complete)"
      :unit="'/ ' + $n(data.perTopic.length)"
      live
    >
      <UiTooltip :text="$t('progress.threshold')" side="bottom">
        <button class="s-progress-summary__threshold" type="button">
          {{ $t("progress.levelHint") }} <UiIcon name="info" :size="13" />
        </button>
      </UiTooltip>
    </UiStat>
    <UiStat
      :label="$t('progress.read')"
      :value="$n(totals.read)"
      :unit="'/ ' + $n(totals.lessons)"
    />
    <UiStat
      :label="$t('progress.answers')"
      :value="data.grill.answers ? $n(data.grill.answers) : '—'"
    >
      <template v-if="data.grill.answers">{{
        $t("progress.answerBreakdown", {
          strong: $t("progress.strong", countArgs(data.grill.strong)),
          partial: $t("progress.partial", countArgs(data.grill.partial)),
          weak: $t("progress.weak", countArgs(data.grill.weak)),
        })
      }}</template>
    </UiStat>
    <UiStat
      :label="$t('progress.onTime')"
      :value="
        data.reviews.scheduled
          ? $n(Math.round((100 * data.reviews.onTime) / data.reviews.scheduled))
          : '—'
      "
      :unit="data.reviews.scheduled ? '%' : undefined"
    >
      {{ $t("progress.lastMonth") }}
    </UiStat>
  </dl>
</template>
<style scoped>
.s-progress-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  gap: var(--s-4);
  align-items: start;
}
.s-progress-summary__threshold {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: help;
}
</style>
