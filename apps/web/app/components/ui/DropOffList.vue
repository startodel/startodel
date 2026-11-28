<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { DropOffItem, DropOffSignal } from "./analytics";
import { usePercent } from "./analytics";
import type { IconName } from "./icons";
/**
 * The weak spots of a Track: Lessons or Topics where learners stall. Each one carries the signals
 * that flag it, one plain sentence that reads them, and a link to the Lesson.
 */
defineProps<{ items: DropOffItem[] }>();
const { t } = useI18n();
const countArgs = useCountArgs();
const indexTag = useIndexTag();
const percent = usePercent();
const id = useId();
const icons: Record<DropOffSignal["type"], IconName> = {
  dropoff: "sort-down",
  accuracy: "quiz",
  comments: "comment",
};
const signalText = (signal: DropOffSignal) =>
  signal.type === "dropoff"
    ? t("analytics.signalDropoff", { n: percent(signal.value) })
    : signal.type === "accuracy"
      ? t("analytics.signalAccuracy", { n: percent(signal.value) })
      : t("analytics.signalComments", countArgs(signal.value));
const designator = (ref: DropOffItem["ref"]) =>
  indexTag("topic", ref.topic) + (ref.lesson ? " · " + indexTag("lesson", ref.lesson) : "");
</script>
<template>
  <section class="s-dropoff" :aria-labelledby="id">
    <UiSectionHeading
      :id="id"
      :title="t('analytics.weakSpots')"
      :count="items.length || undefined"
      :level="3"
    />
    <UiEmptyState v-if="!items.length" compact icon="check" :title="t('analytics.nothingStands')">
      {{ t("analytics.nothingStandsHint") }}
    </UiEmptyState>
    <ol v-else class="s-dropoff__rows">
      <li v-for="item in items" :key="item.id" class="s-dropoff__row">
        <span class="s-dropoff__tag">{{ designator(item.ref) }}</span>
        <div class="s-dropoff__main">
          <component :is="item.to ? NuxtLinkLocale : 'span'" :to="item.to" class="s-dropoff__title"
            >{{ item.title
            }}<UiIcon v-if="item.to" name="arrow-right" :size="14" class="s-dropoff__go"
          /></component>
          <p class="s-dropoff__reading">{{ item.reading }}</p>
          <ul class="s-dropoff__signals">
            <li v-for="signal in item.signals" :key="signal.type">
              <UiBadge variant="outline" :icon="icons[signal.type]">{{
                signalText(signal)
              }}</UiBadge>
            </li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>
<style scoped>
.s-dropoff {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  container: s-dropoff / inline-size;
}
.s-dropoff__rows,
.s-dropoff__signals {
  list-style: none;
}
.s-dropoff__rows {
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
}
.s-dropoff__row {
  display: grid;
  grid-template-columns: 5rem minmax(0, 1fr);
  align-items: baseline;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-4);
}
.s-dropoff__row + .s-dropoff__row {
  border-top: 1px solid var(--s-line);
}
.s-dropoff__tag {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--s-ink-3);
}
.s-dropoff__main {
  display: grid;
  justify-items: start;
  gap: var(--s-2);
  min-width: 0;
}
.s-dropoff__title {
  font-size: var(--s-text-md);
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-ink);
  text-decoration: none;
  overflow-wrap: anywhere;
}
a.s-dropoff__title:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.s-dropoff__title .s-dropoff__go {
  margin-left: var(--s-2);
  color: var(--s-ink-3);
}
.s-dropoff__reading {
  font-size: var(--s-text-sm);
  line-height: 1.5;
  color: var(--s-ink-2);
}
.s-dropoff__signals {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
@container s-dropoff (max-width: 30rem) {
  .s-dropoff__row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
