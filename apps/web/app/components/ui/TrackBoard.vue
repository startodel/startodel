<script setup lang="ts">
import { boardModel, type BoardEdge, type BoardTopic } from "./board";
/**
 * The Track Graph as a circuit board. Topics are parts and TopicEdges are traces. A trace
 * carries signal once its source Topic is complete. The learner can pan, zoom and select a
 * Topic, or switch to a list in study order. A narrow container starts on the list.
 */
const props = withDefaults(
  defineProps<{
    topics: BoardTopic[];
    edges: BoardEdge[];
    label: string;
    /** Animate current along live traces. Ignored when the system asks for reduced motion. */
    flow?: boolean;
    minimap?: boolean;
    /** The height of the board surface, as a CSS length. By default it follows the graph. */
    height?: string;
  }>(),
  { flow: true, minimap: true },
);
const selected = defineModel<string | undefined>("selected");
/** Leave unset to pick by container width. */
const view = defineModel<"board" | "list" | undefined>("view");

const board = computed(() => boardModel(props.topics, props.edges, { selected: selected.value }));
// Tall enough to show the whole graph at full size, within what a screen can hold.
const surface = computed(
  () => props.height ?? `clamp(20rem, ${board.value.height + 96}px, max(20rem, 72vh))`,
);
const toggle = (id: string) => (selected.value = selected.value === id ? undefined : id);

const root = ref<HTMLElement>();
const narrow = ref<boolean>();
onMounted(() => {
  const observer = new ResizeObserver(([entry]) => (narrow.value = entry!.contentRect.width < 640));
  observer.observe(root.value!);
  onBeforeUnmount(() => observer.disconnect());
});
// Until the width is known, CSS picks the view with a container query.
const mode = computed(
  () => view.value ?? (narrow.value === undefined ? "auto" : narrow.value ? "list" : "board"),
);
const shown = computed({
  get: () => (mode.value === "auto" ? "board" : mode.value),
  set: (next) => (view.value = next),
});
const { t } = useI18n();
const views = computed(
  () =>
    [
      { id: "board", label: t("board.viewBoard"), icon: "track" },
      { id: "list", label: t("board.viewList"), icon: "list" },
    ] as const,
);
</script>
<template>
  <section ref="root" class="s-board" :class="'s-board--' + mode" :aria-label="label">
    <header class="s-board__bar">
      <div class="s-board__lead">
        <slot name="lead"><span class="s-label">{{ t("track.graph") }}</span></slot>
      </div>
      <UiSegmented
        v-model="shown"
        :options="views"
        :label="t('board.view')"
        size="sm"
        class="s-board__views"
      />
    </header>
    <div v-if="mode !== 'list'" class="s-board__surface" :style="{ height: surface }">
      <ClientOnly>
        <UiTrackCanvas
          :board="board"
          :flow="flow"
          :minimap="minimap"
          :label="label"
          @select="toggle"
        />
        <template #fallback>
          <UiTrackMap
            v-model:selected="selected"
            class="s-board__still s-grid"
            :topics="topics"
            :edges="edges"
            :label="label"
            :flow="flow"
            interactive
          />
        </template>
      </ClientOnly>
    </div>
    <UiTrackList
      v-if="mode !== 'board'"
      v-model:selected="selected"
      class="s-board__list"
      :topics="topics"
      :edges="edges"
      :label="label + '. ' + t('track.order')"
    />
    <footer class="s-board__foot">
      <UiTrackLegend :topics="topics" :edges="edges" :keys="mode !== 'list'" />
    </footer>
  </section>
</template>
<style scoped>
.s-board {
  container: s-board / inline-size;
  display: grid;
  min-width: 0;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-surface);
  overflow: hidden;
}
.s-board__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  min-height: 2.75rem;
  padding: var(--s-2) var(--s-3) var(--s-2) var(--s-4);
  border-bottom: 1px solid var(--s-line);
}
.s-board__lead {
  min-width: 0;
}
.s-board__surface {
  position: relative;
  min-height: 0;
  background: var(--s-sunken);
}
.s-board__still {
  height: 100%;
  display: grid;
  align-items: center;
}
.s-board__foot {
  padding: var(--s-3) var(--s-4);
  border-top: 1px solid var(--s-line);
}
@container s-board (max-width: 40rem) {
  .s-board--auto .s-board__surface {
    display: none;
  }
}
@container s-board (min-width: 40.01rem) {
  .s-board--auto .s-board__list {
    display: none;
  }
}
</style>
