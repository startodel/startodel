<script setup lang="ts">
import { topicStates, type BoardEdge, type BoardTopic } from "./board";
/** The readout under a board: how many Topics are live, ready and blocked, and what the marks mean. */
const props = defineProps<{ topics: BoardTopic[]; edges: BoardEdge[]; keys?: boolean }>();
const count = computed(() => {
  const totals = { complete: 0, ready: 0, blocked: 0 };
  for (const state of topicStates(props.topics, props.edges).values()) totals[state]++;
  return totals;
});
</script>
<template>
  <div class="s-legend">
    <p class="s-legend__readout">
      <strong>{{ count.complete }}</strong> {{ $t("board.liveOf", { total: topics.length }) }}
      <span aria-hidden="true">·</span> <strong>{{ count.ready }}</strong>
      {{ $t("topicState.ready") }} <span aria-hidden="true">·</span>
      <strong>{{ count.blocked }}</strong> {{ $t("topicState.blocked") }}
    </p>
    <ul v-if="keys" class="s-legend__keys" :aria-label="$t('board.legend')">
      <li>
        <svg width="28" height="8" aria-hidden="true">
          <path d="M1 4h26" class="s-trace is-live" /></svg
        >{{ $t("board.signal") }}
      </li>
      <li>
        <svg width="28" height="8" aria-hidden="true"><path d="M1 4h26" class="s-trace" /></svg
        >{{ $t("board.noSignal") }}
      </li>
      <li><i class="s-legend__key is-ready" />{{ $t("topicState.ready") }}</li>
      <li><i class="s-legend__key is-blocked" />{{ $t("topicState.blocked") }}</li>
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
.s-legend__readout strong {
  color: var(--s-ink);
  font-weight: 600;
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
.s-legend__key.is-ready {
  border: 1.5px solid var(--s-copper-fill);
}
.s-legend__key.is-blocked {
  border: 1px dashed var(--s-line-strong);
}
</style>
