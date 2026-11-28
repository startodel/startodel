<script setup lang="ts">
import { usePlannedSample } from "./sample-content";
const sample = usePlannedSample();
const diff = computed(() => sample.value.diff);
const diagram = computed(() => sample.value.diagram);
const refactorView = ref<"split" | "unified">("split");
const listenerView = ref<"split" | "unified">("split");
const queryView = ref<"split" | "unified">("unified");
const proseView = ref<"split" | "unified">("split");
const narrowSplit = ref<"split" | "unified">("split");
const narrowUnified = ref<"split" | "unified">("unified");
</script>
<template>
  <ShowcaseSpecimen
    id="planned-diff-split"
    label="Diff · before and after"
    note="Each side shows its version whole. Changed lines carry an edge and a sign"
    layout="stack"
  >
    <UiLessonDiff v-model:view="refactorView" language="typescript" v-bind="diff.refactor" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-diff-verdict"
    label="Diff · bad and good"
    note="A cross and a check name the sides"
    layout="stack"
  >
    <UiLessonDiff
      v-model:view="listenerView"
      mode="bad-good"
      language="typescript"
      v-bind="diff.listener"
    />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-diff-unified"
    label="Diff · unified, in the Block frame"
    note="Removed lines first, then added ones"
    layout="stack"
    style="container: s-main / inline-size"
  >
    <UiLessonBlock :index="4" :kind="$t('lessonDiff.kind')" icon="diff">
      <UiLessonDiff v-model:view="queryView" language="sql" v-bind="diff.query" />
    </UiLessonBlock>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-diff-prose"
    label="Diff · prose"
    note="A language of text compares lines in the reading voice"
    layout="stack"
  >
    <UiLessonDiff v-model:view="proseView" v-bind="diff.prose" />
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-diff-narrow"
    label="Diff · narrow container"
    note="The split view stacks its sides"
    layout="row"
  >
    <div style="flex: 1 1 18rem; align-self: flex-start; min-width: 0; max-width: 23rem">
      <UiLessonDiff
        v-model:view="narrowSplit"
        language="typescript"
        :before="diff.refactor.before"
        :after="diff.refactor.after"
      />
    </div>
    <div style="flex: 1 1 18rem; align-self: flex-start; min-width: 0; max-width: 23rem">
      <UiLessonDiff
        v-model:view="narrowUnified"
        mode="bad-good"
        language="typescript"
        :before="diff.listener.before"
        :after="diff.listener.after"
      />
    </div>
  </ShowcaseSpecimen>

  <ShowcaseSpecimen
    id="planned-diagram-lifecycle"
    label="Diagram · lifecycle, in the Block frame"
    note="The drawing is inline SVG in the slot. The frame adds the caption, the source and a larger view"
    layout="stack"
    style="container: s-main / inline-size"
  >
    <UiLessonBlock :index="2" :kind="$t('lessonDiagram.kind')" icon="diagram">
      <UiLessonDiagram
        :title="diagram.lifecycle.title"
        :description="diagram.lifecycle.description"
        :source="diagram.lifecycle.source"
        min-width="36rem"
      >
        <svg viewBox="0 0 680 220" width="680" height="220">
          <path class="s-trace is-live" d="M144 44H272" />
          <path class="s-trace is-live" d="M408 44H536" />
          <path class="s-trace" d="M304 72V160l16 16H360" />
          <path class="s-trace" d="M424 148V120l-32-32V72" />
          <path class="s-diagram__arrow is-live" d="M214 44l-9-5v10z" />
          <path class="s-diagram__arrow is-live" d="M478 44l-9-5v10z" />
          <path class="s-diagram__arrow" d="M304 134l-5-9h10z" />
          <path class="s-diagram__arrow" d="M424 124l-5 9h10z" />
          <rect class="s-diagram__part" x="8" y="16" width="136" height="56" rx="4" />
          <rect class="s-diagram__part" x="272" y="16" width="136" height="56" rx="4" />
          <rect class="s-diagram__part" x="536" y="16" width="136" height="56" rx="4" />
          <rect class="s-diagram__part" x="360" y="148" width="136" height="56" rx="4" />
          <circle class="s-trace-pad is-live" cx="144" cy="44" r="3.5" />
          <circle class="s-trace-pad is-live" cx="272" cy="44" r="3.5" />
          <circle class="s-trace-pad is-live" cx="408" cy="44" r="3.5" />
          <circle class="s-trace-pad is-live" cx="536" cy="44" r="3.5" />
          <circle class="s-trace-pad" cx="304" cy="72" r="3.5" />
          <circle class="s-trace-pad" cx="360" cy="176" r="3.5" />
          <circle class="s-trace-pad" cx="424" cy="148" r="3.5" />
          <circle class="s-trace-pad" cx="392" cy="72" r="3.5" />
          <text class="s-diagram__tag" x="22" y="37">{{ diagram.lifecycle.parts.setup }}</text>
          <text class="s-diagram__label" x="22" y="58">setup()</text>
          <text class="s-diagram__tag" x="286" y="37">{{ diagram.lifecycle.parts.mounted }}</text>
          <text class="s-diagram__label" x="286" y="58">onMounted()</text>
          <text class="s-diagram__tag" x="550" y="37">{{ diagram.lifecycle.parts.unmounted }}</text>
          <text class="s-diagram__label" x="550" y="58">onUnmounted()</text>
          <text class="s-diagram__tag" x="374" y="169">{{ diagram.lifecycle.parts.updated }}</text>
          <text class="s-diagram__label" x="374" y="190">onUpdated()</text>
          <text class="s-diagram__note" x="208" y="31" text-anchor="middle">
            {{ diagram.lifecycle.traces.mount }}
          </text>
          <text class="s-diagram__note" x="472" y="31" text-anchor="middle">
            {{ diagram.lifecycle.traces.unmount }}
          </text>
          <text class="s-diagram__note" x="292" y="124" text-anchor="end">
            {{ diagram.lifecycle.traces.change }}
          </text>
          <text class="s-diagram__note" x="436" y="124">
            {{ diagram.lifecycle.traces.patch }}
          </text>
        </svg>
      </UiLessonDiagram>
    </UiLessonBlock>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-diagram-flow"
    label="Diagram · architecture flow"
    note="A solid trace is the path the Lesson follows. A dashed trace is a side path"
    layout="stack"
  >
    <UiLessonDiagram
      :title="diagram.flow.title"
      :description="diagram.flow.description"
      :source="diagram.flow.source"
      min-width="36rem"
    >
      <svg viewBox="0 0 688 184" width="688" height="184">
        <path class="s-trace is-live" d="M136 44H184" />
        <path class="s-trace is-live" d="M320 44H332l36 36H376" />
        <path class="s-trace is-live" d="M512 92H560" />
        <path class="s-trace" d="M136 140H184" />
        <path class="s-trace" d="M320 140H332l36-36H376" />
        <rect class="s-diagram__part is-outside" x="8" y="16" width="128" height="56" rx="4" />
        <rect class="s-diagram__part" x="184" y="16" width="136" height="56" rx="4" />
        <rect class="s-diagram__part is-outside" x="8" y="112" width="128" height="56" rx="4" />
        <rect class="s-diagram__part" x="184" y="112" width="136" height="56" rx="4" />
        <rect class="s-diagram__part" x="376" y="64" width="136" height="56" rx="4" />
        <rect class="s-diagram__part" x="560" y="64" width="120" height="56" rx="4" />
        <circle class="s-trace-pad is-live" cx="136" cy="44" r="3.5" />
        <circle class="s-trace-pad is-live" cx="184" cy="44" r="3.5" />
        <circle class="s-trace-pad is-live" cx="320" cy="44" r="3.5" />
        <circle class="s-trace-pad is-live" cx="376" cy="80" r="3.5" />
        <circle class="s-trace-pad is-live" cx="512" cy="92" r="3.5" />
        <circle class="s-trace-pad is-live" cx="560" cy="92" r="3.5" />
        <circle class="s-trace-pad" cx="136" cy="140" r="3.5" />
        <circle class="s-trace-pad" cx="184" cy="140" r="3.5" />
        <circle class="s-trace-pad" cx="320" cy="140" r="3.5" />
        <circle class="s-trace-pad" cx="376" cy="104" r="3.5" />
        <template
          v-for="part in [
            { x: 22, y: 16, text: diagram.flow.parts.agent },
            { x: 198, y: 16, text: diagram.flow.parts.mcp },
            { x: 22, y: 112, text: diagram.flow.parts.browser },
            { x: 198, y: 112, text: diagram.flow.parts.session },
            { x: 390, y: 64, text: diagram.flow.parts.scope },
            { x: 574, y: 64, text: diagram.flow.parts.pg },
          ]"
          :key="part.x + '-' + part.y"
        >
          <text class="s-diagram__tag" :x="part.x" :y="part.y + 21">{{ part.text[0] }}</text>
          <text class="s-diagram__label" :x="part.x" :y="part.y + 42">{{ part.text[1] }}</text>
        </template>
      </svg>
    </UiLessonDiagram>
  </ShowcaseSpecimen>
  <ShowcaseSpecimen
    id="planned-diagram-states"
    label="Diagram · loading and failed"
    note="A failed diagram still gives the learner its source and its description"
    layout="grid"
  >
    <UiLessonDiagram
      state="loading"
      :title="diagram.loading.title"
      :description="diagram.loading.description"
    />
    <UiLessonDiagram
      state="failed"
      :title="diagram.failed.title"
      :description="diagram.failed.description"
      :source="diagram.failed.source"
    />
  </ShowcaseSpecimen>
</template>
