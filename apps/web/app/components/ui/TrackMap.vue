<script setup lang="ts">
import { boardModel, type BoardEdge, type BoardTopic } from "./board";
/**
 * A Track Graph drawn as a still board, rendered on the server. Use it where the board is an
 * illustration or a preview: a landing page, a Public Track, the fallback of UiTrackBoard.
 * It scrolls sideways when it is wider than its container, or scales down with `fit`.
 */
const props = withDefaults(
  defineProps<{
    topics: BoardTopic[];
    edges: BoardEdge[];
    label: string;
    /** Animate current along live traces. Ignored when the system asks for reduced motion. */
    flow?: boolean;
    /** Parts can be pressed to select a Topic. */
    interactive?: boolean;
    compact?: boolean;
    /** Scale the whole board to the container width instead of scrolling. */
    fit?: boolean;
    /** Draw the graph alone, with no Mastery and no locks. A Public Track has neither. */
    outline?: boolean;
  }>(),
  { flow: true },
);
const selected = defineModel<string | undefined>("selected");
const board = computed(() =>
  boardModel(props.topics, props.edges, {
    compact: props.compact,
    selected: selected.value,
    outline: props.outline,
  }),
);
</script>
<template>
  <div
    class="s-map"
    :class="{ 's-map--fit': fit }"
    :role="interactive ? 'group' : 'img'"
    :aria-label="label"
    :style="{ '--_w': board.width, '--_h': board.height }"
  >
    <div class="s-map__view">
      <div class="s-map__plane" :style="{ width: board.width + 'px', height: board.height + 'px' }">
        <svg
          class="s-map__traces"
          :viewBox="`0 0 ${board.width} ${board.height}`"
          :width="board.width"
          :height="board.height"
          aria-hidden="true"
        >
          <path
            v-for="t in board.traces"
            :key="t.id"
            :d="t.d"
            class="s-trace"
            :class="{ 'is-live': t.live, 'is-lit': t.lit, 'is-faded': t.faded }"
          />
          <template v-if="flow">
            <path
              v-for="t in board.traces.filter((t) => t.live && !t.faded)"
              :key="'flow' + t.id"
              :d="t.d"
              class="s-trace-current"
            />
          </template>
          <template v-for="t in board.traces" :key="'pad' + t.id">
            <circle
              :cx="t.start.x"
              :cy="t.start.y"
              r="3.5"
              class="s-trace-pad"
              :class="{ 'is-live': t.live }"
            />
            <circle
              :cx="t.end.x"
              :cy="t.end.y"
              r="3.5"
              class="s-trace-pad"
              :class="{ 'is-live': t.live }"
            />
          </template>
        </svg>
        <div
          v-for="p in board.parts"
          :key="p.id"
          class="s-map__slot"
          :style="{
            left: p.x + 'px',
            top: p.y + 'px',
            width: board.size.nodeWidth + 'px',
            height: board.size.nodeHeight + 'px',
          }"
          :aria-hidden="interactive ? undefined : true"
        >
          <UiTopicPart
            :topic="p.topic"
            :state="p.state"
            :selected="p.selected"
            :faded="p.faded"
            :compact="compact"
            :readonly="!interactive"
            @select="selected = selected === $event ? undefined : $event"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.s-map {
  container: s-map / inline-size;
  min-width: 0;
}
.s-map__view {
  overflow: auto hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--s-line-strong) transparent;
}
.s-map__plane {
  position: relative;
  margin: 0 auto;
}
.s-map__traces {
  position: absolute;
  inset: 0;
  overflow: visible;
}
.s-map__slot {
  position: absolute;
}
/* The plane keeps its pixel size and is scaled to the container. atan2 turns two lengths into a ratio. */
.s-map--fit .s-map__view {
  --_k: min(1, tan(atan2(100cqi, var(--_w) * 1px)));
  overflow: hidden;
  height: calc(var(--_h) * 1px * var(--_k));
}
.s-map--fit .s-map__plane {
  transform-origin: 0 0;
  margin: 0 auto;
  scale: var(--_k);
}
</style>
