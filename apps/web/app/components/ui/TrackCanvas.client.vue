<script setup lang="ts">
import { Handle, Panel, Position, VueFlow, type VueFlowStore } from "@vue-flow/core";
import { MiniMap } from "@vue-flow/minimap";
import "@vue-flow/core/dist/style.css";
import type { BoardModel } from "./board";
/**
 * The interactive surface of UiTrackBoard: pan, zoom, select and a minimap. It draws the parts
 * and traces that boardModel() laid out, so it matches the static UiTrackMap exactly.
 */
const props = defineProps<{
  board: BoardModel;
  flow?: boolean;
  minimap?: boolean;
  label: string;
}>();
const emit = defineEmits<{ select: [id: string] }>();

const nodes = computed(() =>
  props.board.parts.map((p) => ({
    id: p.id,
    type: "part",
    position: { x: p.x, y: p.y },
    data: p,
    class: "is-" + p.state,
    style: { width: props.board.size.nodeWidth + "px", height: props.board.size.nodeHeight + "px" },
  })),
);
const edges = computed(() =>
  props.board.traces.map((t) => ({
    id: t.id,
    source: t.from,
    target: t.to,
    type: "trace",
    data: t,
  })),
);
const extent = computed<[[number, number], [number, number]]>(() => [
  [-160, -120],
  [props.board.width + 160, props.board.height + 120],
]);

const instance = shallowRef<VueFlowStore>();
const fit = () => instance.value?.fitView({ padding: 0.04, maxZoom: 1, duration: 200 });
function ready(store: VueFlowStore) {
  instance.value = store;
  store.fitView({ padding: 0.04, maxZoom: 1 });
}
const zoom = computed(() => Math.round((instance.value?.viewport.value.zoom ?? 1) * 100));
</script>
<template>
  <VueFlow
    class="s-canvas s-grid"
    :nodes="nodes"
    :edges="edges"
    :nodes-draggable="false"
    :nodes-connectable="false"
    :nodes-focusable="false"
    :edges-focusable="false"
    :elements-selectable="false"
    :zoom-on-scroll="false"
    :zoom-on-double-click="false"
    :prevent-scrolling="false"
    :min-zoom="0.35"
    :max-zoom="1.5"
    :translate-extent="extent"
    :aria-label="label"
    @pane-ready="ready"
  >
    <template #node-part="{ data }">
      <Handle type="target" :position="Position.Left" class="s-canvas__handle" />
      <UiTopicPart
        :topic="data.topic"
        :state="data.state"
        :selected="data.selected"
        :faded="data.faded"
        @select="emit('select', $event)"
      />
      <Handle type="source" :position="Position.Right" class="s-canvas__handle" />
    </template>
    <template #edge-trace="{ data }">
      <path
        :d="data.d"
        class="s-trace"
        :class="{ 'is-live': data.live, 'is-lit': data.lit, 'is-faded': data.faded }"
      />
      <path v-if="flow && data.live && !data.faded" :d="data.d" class="s-trace-current" />
      <circle
        :cx="data.start.x"
        :cy="data.start.y"
        r="3.5"
        class="s-trace-pad"
        :class="{ 'is-live': data.live }"
      />
      <circle
        :cx="data.end.x"
        :cy="data.end.y"
        r="3.5"
        class="s-trace-pad"
        :class="{ 'is-live': data.live }"
      />
    </template>
    <Panel position="bottom-left" class="s-canvas__controls">
      <UiTooltip :text="$t('board.zoomOut')" side="top">
        <button
          type="button"
          :aria-label="$t('board.zoomOut')"
          @click="instance?.zoomOut({ duration: 120 })"
        >
          <UiIcon name="zoom-out" :size="14" />
        </button>
      </UiTooltip>
      <output class="s-canvas__zoom" :aria-label="$t('board.zoom')">{{ zoom }}%</output>
      <UiTooltip :text="$t('board.zoomIn')" side="top">
        <button
          type="button"
          :aria-label="$t('board.zoomIn')"
          @click="instance?.zoomIn({ duration: 120 })"
        >
          <UiIcon name="zoom-in" :size="14" />
        </button>
      </UiTooltip>
      <UiTooltip :text="$t('board.fit')" side="top">
        <button type="button" :aria-label="$t('board.fit')" @click="fit">
          <UiIcon name="fit" :size="14" />
        </button>
      </UiTooltip>
    </Panel>
    <MiniMap
      v-if="minimap"
      class="s-canvas__minimap"
      position="bottom-right"
      pannable
      zoomable
      :width="168"
      :height="104"
      :node-border-radius="6"
      :node-class-name="
        (node) => 'is-' + node.data.state + (node.data.selected ? ' is-selected' : '')
      "
      :aria-label="$t('board.overview')"
    />
  </VueFlow>
</template>
<style>
.s-root .s-canvas {
  width: 100%;
  height: 100%;
  background-color: var(--s-sunken);
}
.s-root .s-canvas .vue-flow__pane {
  cursor: grab;
}
.s-root .s-canvas .vue-flow__pane.dragging {
  cursor: grabbing;
}
.s-root .s-canvas .vue-flow__node {
  cursor: default;
}
.s-root .s-canvas__handle {
  visibility: hidden;
  pointer-events: none;
}
.s-root .s-canvas__controls {
  display: flex;
  align-items: center;
  margin: var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  box-shadow: var(--s-shadow-1);
}
.s-root .s-canvas__controls button {
  display: grid;
  place-items: center;
  width: var(--s-control-sm);
  height: var(--s-control-sm);
  color: var(--s-ink-2);
}
.s-root .s-canvas__controls button:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-root .s-canvas__zoom {
  min-width: 2.75rem;
  text-align: center;
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-3);
}
.s-root .s-canvas__minimap {
  margin: var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background-color: var(--s-raised);
  box-shadow: var(--s-shadow-1);
  overflow: hidden;
}
.s-root .s-canvas__minimap .vue-flow__minimap-node {
  fill: var(--s-line-strong);
  stroke: none;
}
.s-root .s-canvas__minimap .vue-flow__minimap-node.is-complete {
  fill: var(--s-copper-fill);
}
.s-root .s-canvas__minimap .vue-flow__minimap-node.is-ready {
  fill: var(--s-raised);
  stroke: var(--s-copper-fill);
  stroke-width: 8;
}
.s-root .s-canvas__minimap .vue-flow__minimap-node.is-blocked {
  fill: var(--s-line);
}
.s-root .s-canvas__minimap .vue-flow__minimap-node.is-selected {
  stroke: var(--s-ink);
  stroke-width: 12;
}
.s-root .s-canvas__minimap .vue-flow__minimap-mask {
  fill: var(--s-sunken);
  fill-opacity: 0.75;
  stroke: var(--s-ink-3);
  stroke-width: 4;
}
</style>
