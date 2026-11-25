<script setup lang="ts">
import { VueFlow, MarkerType, Handle, Position } from "@vue-flow/core";
import "@vue-flow/core/dist/style.css";
import "@vue-flow/core/dist/theme-default.css";
import { Graph, layout } from "@dagrejs/dagre";
const props = defineProps<{
  topics: { id: string; title: string; level: number }[];
  edges: { id: string; fromTopicId: string; toTopicId: string }[];
  selected?: string;
}>();
defineEmits<{ select: [id: string] }>();
const positions = computed(() => {
  const g = new Graph()
    .setGraph({ rankdir: "TB", nodesep: 32, ranksep: 54 })
    .setDefaultEdgeLabel(() => ({}));
  for (const t of props.topics) g.setNode(t.id, { width: 190, height: 64 });
  for (const e of props.edges) g.setEdge(e.fromTopicId, e.toTopicId);
  layout(g);
  return props.topics.map((t) => {
    const { x, y } = g.node(t.id);
    return {
      id: t.id,
      label: t.title,
      position: { x: x - 95, y: y - 32 },
      class: "level-" + t.level,
      ariaLabel: t.title + ", Mastery " + t.level,
      style: { width: "190px", height: "64px" },
    };
  });
});
const edges = computed(() =>
  props.edges.map((e) => ({
    id: e.id,
    source: e.fromTopicId,
    target: e.toTopicId,
    markerEnd: MarkerType.ArrowClosed,
  })),
);
</script>
<template>
  <div class="canvas">
    <VueFlow
      :nodes="positions"
      :edges="edges"
      :nodes-draggable="false"
      :nodes-connectable="false"
      fit-view-on-init
      :max-zoom="1.5"
      :min-zoom="0.1"
      @node-click="$emit('select', $event.node.id)"
    >
      <template #node-default="{ id, label }"
        ><button class="node" :aria-pressed="selected === id" @click.stop="$emit('select', id)">
          {{ label }}</button
        ><Handle type="target" :position="Position.Top" /><Handle
          type="source"
          :position="Position.Bottom"
      /></template>
    </VueFlow>
  </div>
</template>
<style scoped>
.canvas {
  height: clamp(350px, 55vh, 640px);
  background-color: #f5f7f2;
  background-image: radial-gradient(#c6d0c6 1px, transparent 1px);
  background-size: 16px 16px;
  border-radius: 8px;
  border: 1px solid var(--line);
}
.canvas :deep(.vue-flow__node-default) {
  border-color: #75887b;
  background: var(--level-color);
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 2px 4px #24372814;
}
.node {
  border: 0;
  background: transparent;
  color: var(--ink);
  width: 100%;
  height: 100%;
  line-height: 1.25;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.node[aria-pressed="true"] {
  outline: 3px solid var(--green);
}
.canvas :deep(.vue-flow__handle) {
  background: #6f8376;
}
</style>
