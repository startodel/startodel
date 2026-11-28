<script setup lang="ts">
/**
 * A Lesson Block that frames a diagram. It does not draw one: the drawing arrives in the default
 * slot as inline SVG built from currentColor, the tokens and the s-diagram__* drawing classes
 * below, with board traces (s-trace, s-trace-pad) between the parts.
 */
withDefaults(
  defineProps<{
    title: string;
    /** The text alternative. It is the visible caption and the accessible description. */
    description: string;
    state?: "ready" | "loading" | "failed";
    /** What the diagram was built from, such as Mermaid. A failed diagram shows it instead. */
    source?: string;
    sourceLanguage?: string;
    /** The narrowest the drawing gets before it scrolls sideways, as a CSS length. */
    minWidth?: string;
  }>(),
  { state: "ready", sourceLanguage: "mermaid" },
);
const expanded = ref(false);
const id = useId();
</script>
<template>
  <figure class="s-diagram" :aria-labelledby="id + '-title'">
    <div class="s-diagram__plate">
      <div class="s-diagram__bar">
        <strong :id="id + '-title'" class="s-diagram__title">{{ title }}</strong>
        <button
          v-if="state === 'ready'"
          type="button"
          class="s-diagram__expand"
          @click="expanded = true"
        >
          <UiIcon name="fit" :size="14" />{{ $t("lessonDiagram.expand") }}
        </button>
      </div>
      <div
        v-if="state === 'ready'"
        class="s-diagram__stage s-grid"
        :style="{ '--_min': minWidth }"
        role="img"
        tabindex="0"
        :aria-labelledby="id + '-title'"
        :aria-describedby="id + '-text'"
      >
        <slot />
      </div>
      <div
        v-else-if="state === 'loading'"
        class="s-diagram__stage s-diagram__stage--loading s-grid"
        role="status"
        :aria-label="$t('lessonDiagram.loading')"
      >
        <template v-for="n in 3" :key="n"
          ><i v-if="n > 1" class="s-diagram__wire" /><i class="s-diagram__ghost"
        /></template>
      </div>
      <template v-else>
        <UiNotice class="s-diagram__notice" tone="warning" :title="$t('lessonDiagram.failed')">{{
          source ? $t("lessonDiagram.failedSource") : $t("lessonDiagram.failedPlain")
        }}</UiNotice>
        <UiCodeBlock
          v-if="source"
          class="s-diagram__code"
          :code="source"
          :language="sourceLanguage"
        />
      </template>
    </div>
    <figcaption :id="id + '-text'" class="s-diagram__caption">{{ description }}</figcaption>
    <UiCollapsible
      v-if="source && state === 'ready'"
      :title="$t('lessonDiagram.source')"
      icon="code"
    >
      <UiCodeBlock :code="source" :language="sourceLanguage" />
    </UiCollapsible>
    <UiModal v-model:open="expanded" size="lg" :title="title" :description="description">
      <div
        class="s-diagram__stage s-diagram__stage--expanded s-grid"
        :style="{ '--_min': minWidth }"
        role="img"
        tabindex="0"
        :aria-label="title"
      >
        <slot />
      </div>
    </UiModal>
  </figure>
</template>
<style>
.s-root .s-diagram {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-2);
  min-width: 0;
}
.s-root .s-diagram__plate {
  min-width: 0;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-bg);
  overflow: hidden;
}
.s-root .s-diagram__bar {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-height: 2.25rem;
  padding: 0 var(--s-2) 0 var(--s-3);
  border-bottom: 1px solid var(--s-line);
  background: var(--s-surface);
}
.s-root .s-diagram__title {
  flex: 1;
  min-width: 0;
  padding-block: var(--s-2);
  font-size: var(--s-text-sm);
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-ink);
}
.s-root .s-diagram__expand {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 1.5rem;
  padding: 0 var(--s-2);
  border-radius: var(--s-radius-xs);
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-root .s-diagram__expand:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-root .s-diagram__stage {
  padding: var(--s-5);
  overflow-x: auto;
  color: var(--s-ink);
  scrollbar-width: thin;
  scrollbar-color: var(--s-line-strong) transparent;
}
.s-root .s-diagram__stage:focus-visible {
  outline-offset: -2px;
}
.s-root .s-diagram__stage > svg {
  min-width: var(--_min, 0);
  height: auto;
  margin-inline: auto;
  overflow: visible;
}
/* The larger view fills the dialog. */
.s-root .s-diagram__stage--expanded {
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background-color: var(--s-bg);
}
.s-root .s-diagram__stage--expanded > svg {
  width: 100%;
}
.s-root .s-diagram__stage--loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 11rem;
  overflow: hidden;
}
.s-root .s-diagram__ghost {
  flex: 0 1 7rem;
  min-width: 2.5rem;
  height: 2.75rem;
  border: 1px dashed var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
  animation: s-diagram-wait 1.4s ease-in-out infinite alternate;
}
.s-root .s-diagram__wire {
  flex: 0 1 3rem;
  min-width: 1rem;
  height: 1px;
  background: var(--s-line-strong);
}
@keyframes s-diagram-wait {
  to {
    opacity: 0.45;
  }
}
@media (prefers-reduced-motion: reduce) {
  .s-root .s-diagram__ghost {
    animation: none;
  }
}
/* A failed diagram keeps one plate: the notice and the source sit flush inside it. */
.s-root .s-diagram__plate .s-diagram__notice {
  border-width: 0 0 0 3px;
  border-radius: 0;
}
.s-root .s-diagram__plate .s-diagram__code {
  border: 0;
  border-top: 1px solid var(--s-line);
  border-radius: 0;
}
.s-root .s-diagram__caption {
  font-size: var(--s-text-sm);
  line-height: 1.5;
  color: var(--s-ink-2);
  text-wrap: pretty;
}

/*
 * Drawing classes for the SVG in the slot. A part is a plate, as a Topic is on the Track board.
 * Traces and their pads come from board.css: a solid copper trace is the main path, a dashed
 * tin trace is a side path.
 */
.s-root .s-diagram__part {
  fill: var(--s-raised);
  stroke: var(--s-line-strong);
  stroke-width: 1;
}
.s-root .s-diagram__part.is-live {
  stroke: var(--s-copper-fill);
  stroke-width: 1.5;
}
.s-root .s-diagram__part.is-outside {
  fill: var(--s-surface);
  stroke-dasharray: 3 3;
}
.s-root .s-diagram__label,
.s-root .s-diagram__tag,
.s-root .s-diagram__note {
  font-family: var(--s-font-mono);
  font-stretch: 75%;
  font-variant-ligatures: none;
}
.s-root .s-diagram__label {
  fill: var(--s-ink);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
.s-root .s-diagram__tag {
  fill: var(--s-ink-3);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.s-root .s-diagram__note {
  fill: var(--s-ink-2);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0;
}
.s-root .s-diagram__arrow {
  fill: var(--s-line-strong);
}
.s-root .s-diagram__arrow.is-live {
  fill: var(--s-copper-fill);
}
</style>
