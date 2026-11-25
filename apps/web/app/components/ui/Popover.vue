<script setup lang="ts">
import { PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from "reka-ui";
/**
 * A small panel anchored to its trigger, for detail that would crowd the page.
 * Put the trigger in the trigger slot: it must be one focusable element.
 */
withDefaults(
  defineProps<{
    title?: string;
    align?: "start" | "center" | "end";
    side?: "top" | "right" | "bottom" | "left";
  }>(),
  { align: "center", side: "bottom" },
);
const open = defineModel<boolean>("open", { default: false });
const layer = useLayer();
</script>
<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child><slot name="trigger" /></PopoverTrigger>
    <PopoverPortal :to="layer">
      <PopoverContent
        class="s-popup s-popover"
        :align="align"
        :side="side"
        :side-offset="8"
        :collision-padding="8"
      >
        <p v-if="title" class="s-popover__title">{{ title }}</p>
        <slot />
        <PopoverArrow class="s-popup__arrow" :width="12" :height="6" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
