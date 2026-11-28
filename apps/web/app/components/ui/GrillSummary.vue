<script setup lang="ts">
import type { GrillReviewTopic, VerdictState } from "./grill";
import type { LinkTarget } from "./nav";

withDefaults(
  defineProps<{
    tally: Record<VerdictState, number>;
    topics: GrillReviewTopic[];
    reviewsTo?: LinkTarget;
  }>(),
  { reviewsTo: "/reviews" },
);
const displayDate = useDisplayDate();
const heading = useId();
</script>
<template>
  <section class="s-grill-summary" :aria-labelledby="heading">
    <div class="s-grill-summary__main">
      <h2 :id="heading" class="s-title">{{ $t("grill.summary") }}</h2>
      <UiVerdictTally
        :strong="tally.strong"
        :partial="tally.partial"
        :weak="tally.weak"
        :pending="tally.pending"
        :unanswered="tally.none"
      />
    </div>
    <div class="s-grill-summary__side">
      <UiSectionHeading :title="$t('grill.reinforce')" :level="3" />
      <ul v-if="topics.length" class="s-reinforce">
        <li v-for="topic in topics" :key="topic.id">
          <UiIcon name="review" :size="14" /><span class="s-reinforce__main"
            ><NuxtLinkLocale class="s-reinforce__title" :to="topic.to">{{
              $t("grill.lessons", { title: topic.title })
            }}</NuxtLinkLocale>
            <span v-if="topic.dueAt" class="s-reinforce__due">
              · {{ $t("grill.due", { date: displayDate(topic.dueAt) }) }}</span
            >
          </span>
        </li>
      </ul>
      <UiNotice v-else tone="success" :title="$t('grill.allStrong')" />
      <div><UiButton :to="reviewsTo" icon="review">{{ $t("nav.reviews") }}</UiButton></div>
    </div>
  </section>
</template>
<style scoped>
.s-grill-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: var(--s-8);
  padding: var(--s-6);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  background: var(--s-raised);
  box-shadow: var(--s-shadow-2);
}
.s-grill-summary__main,
.s-grill-summary__side {
  display: grid;
  align-content: start;
  gap: var(--s-4);
}
.s-grill-summary__main .s-title {
  font-size: clamp(var(--s-text-xl), 3.4cqi, var(--s-text-2xl));
}
.s-reinforce {
  display: grid;
  list-style: none;
}
.s-reinforce li {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3) 0;
  border-top: 1px solid var(--s-line);
}
.s-reinforce__main {
  display: grid;
  gap: var(--s-1);
}
.s-reinforce__title {
  color: var(--s-ink);
  font-weight: 600;
  text-decoration: none;
}
.s-reinforce__title:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-underline-offset: 0.2em;
}
.s-reinforce__due {
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
</style>
