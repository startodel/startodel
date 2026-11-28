<script setup lang="ts">
import type { PublicBlock } from "@startodel/core";
import type { IconName } from "./icons";
import { blockIcon } from "./lesson";
const indexTag = useIndexTag();
const props = defineProps<{
  /** The Block's position in the Lesson, from 1. */
  index: number;
  /** Names the kind and picks the icon. Optional when both kind and icon are given. */
  block?: PublicBlock;
  /** The word for a kind that is not a Block type yet. It replaces the one derived from block. */
  kind?: string;
  icon?: IconName;
  anchor?: string;
}>();
const { t } = useI18n();
const designator = computed(() => indexTag("block", props.index));
const word = computed(() => {
  if (props.kind || !props.block) return props.kind ?? "";
  return props.block.type === "callout"
    ? t(`callout.${props.block.variant}`)
    : t(`block.${props.block.type}`);
});
const glyph = computed(() => props.icon ?? (props.block && blockIcon(props.block)));
</script>
<template>
  <section :id="anchor" class="s-block" :aria-label="`${designator}, ${word}`">
    <p class="s-block__margin" aria-hidden="true">
      <span class="s-block__ref">{{ designator }}</span>
      <span class="s-block__kind"><UiIcon v-if="glyph" :name="glyph" :size="12" />{{ word }}</span>
    </p>
    <div class="s-block__body">
      <UiCallout v-if="block?.type === 'callout'" :kind="block.variant" :show-kind="false">
        <slot />
      </UiCallout>
      <slot v-else />
    </div>
  </section>
</template>
<style scoped>
.s-block {
  display: grid;
  grid-template-columns: var(--s-block-margin) minmax(0, 1fr);
  column-gap: var(--s-6);
  scroll-margin-top: 5rem;
}
.s-block__margin {
  position: sticky;
  top: calc(var(--s-sticky-top, 0px) + 4.5rem);
  align-self: start;
  display: grid;
  justify-items: end;
  gap: 0.375rem;
  padding-top: 0.5rem;
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-block__ref {
  color: var(--s-ink-2);
}
.s-block__kind {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  white-space: nowrap;
}
.s-block__body {
  min-width: 0;
  max-width: var(--s-read-measure);
}
@container s-main (max-width: 46rem) {
  .s-block {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--s-2);
  }
  .s-block__margin {
    position: static;
    display: flex;
    justify-content: flex-start;
    gap: var(--s-3);
    padding-top: 0;
  }
}
</style>
