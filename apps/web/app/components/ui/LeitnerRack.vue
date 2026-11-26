<script setup lang="ts">
import { REVIEW_INTERVAL_DAYS } from "@startodel/core";
/**
 * The five Review Boxes as a rack. A Topic moves one box to the right after a strong review
 * and back to box 0 after a weak one. Each box waits longer before the next review.
 */
const props = withDefaults(
  defineProps<{
    /** The number of Topics in each Review Box, from box 0 to box 4. */
    counts: number[];
    /** Days until the next review, per box. */
    intervals?: readonly number[];
    /** Highlights one box, for example the box of the Topic in view. */
    current?: number;
    compact?: boolean;
  }>(),
  { intervals: () => REVIEW_INTERVAL_DAYS },
);
const peak = computed(() => Math.max(1, ...props.counts));
const countArgs = useCountArgs();
</script>
<template>
  <ol class="s-rack" :class="{ 's-rack--compact': compact }" :aria-label="$t('review.boxes')">
    <li
      v-for="(count, box) in counts"
      :key="box"
      class="s-rack__box"
      :class="{ 'is-current': current === box, 'is-empty': !count }"
      :aria-current="current === box ? 'true' : undefined"
    >
      <span class="s-rack__slot" aria-hidden="true">
        <i :style="{ height: Math.max((count / peak) * 100, count ? 8 : 0) + '%' }" />
      </span>
      <span class="s-rack__count" aria-hidden="true">{{ count }}</span>
      <span class="s-rack__interval" aria-hidden="true">{{
        $t("review.days", { n: $n(intervals[box]!) })
      }}</span>
      <span class="s-sr">{{
        $t("review.boxSummary", {
          topics: $t("count.topics", countArgs(count)),
          days: $n(intervals[box]!),
        })
      }}</span>
    </li>
  </ol>
</template>
<style scoped>
.s-rack {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--s-2);
  list-style: none;
}
.s-rack__box {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: var(--s-2) var(--s-1) var(--s-3);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
}
.s-rack__box.is-current {
  border-color: var(--s-ink);
  background: var(--s-raised);
  box-shadow: var(--s-shadow-1);
}
.s-rack__slot {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 3rem;
  padding: 0 var(--s-2);
  border-bottom: 1px solid var(--s-line-strong);
}
.s-rack--compact .s-rack__slot {
  height: 1.5rem;
}
.s-rack__slot i {
  width: 100%;
  border-radius: 1px 1px 0 0;
  background: var(--s-copper-fill);
}
.s-rack__count {
  margin-top: var(--s-1);
  font: 600 var(--s-text-lg) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.02em;
}
.s-rack__box.is-empty .s-rack__count {
  color: var(--s-ink-3);
}
.s-rack__interval {
  font: 500 var(--s-text-2xs) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  white-space: nowrap;
  color: var(--s-ink-2);
}
</style>
