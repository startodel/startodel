<script setup lang="ts">
import { topicStates, type BoardEdge, type BoardTopic } from "./board";
/** The readout under a board: how many Topics are live, ready and blocked, and what the marks mean. */
const props = defineProps<{ topics: BoardTopic[]; edges: BoardEdge[]; keys?: boolean }>();
const countArgs = useCountArgs();
const count = computed(() => {
  const totals = { complete: 0, ready: 0, blocked: 0 };
  for (const state of topicStates(props.topics, props.edges).values()) totals[state]++;
  return totals;
});
</script>
<template>
  <div class="s-legend">
    <p class="s-legend__readout">
      <span>{{
        $t("board.masteredOf", { ...countArgs(count.complete), total: $n(topics.length) })
      }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ $t("count.ready", countArgs(count.ready)) }}</span>
      <span aria-hidden="true">·</span>
      <span>{{ $t("count.blocked", countArgs(count.blocked)) }}</span>
    </p>
    <ul v-if="keys" class="s-legend__keys" :aria-label="$t('board.legend')">
      <li><i class="s-legend__key is-complete" />{{ $t("board.mastered") }}</li>
      <li><i class="s-legend__key is-ready" />{{ $t("board.available") }}</li>
      <li><i class="s-legend__key is-blocked" />{{ $t("board.locked") }}</li>
    </ul>
  </div>
</template>
<style scoped>
.s-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2) var(--s-6);
  font: 500 var(--s-text-2xs) / 1.4 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-legend__readout {
  display: flex;
  flex-wrap: wrap;
  column-gap: var(--s-2);
}
.s-legend__keys {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-5);
  list-style: none;
}
.s-legend__keys li {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
}
.s-legend__key {
  width: 0.875rem;
  height: 0.625rem;
  border-radius: 1px;
}
.s-legend__key.is-complete {
  background: var(--s-copper-fill);
}
.s-legend__key.is-ready {
  border: 1.5px solid var(--s-copper-fill);
}
.s-legend__key.is-blocked {
  border: 1px dashed var(--s-line-strong);
}
</style>
