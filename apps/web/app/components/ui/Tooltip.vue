<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from "reka-ui";
/**
 * A short label shown on hover and on keyboard focus. Wrap one focusable element.
 * It never holds information the learner cannot get another way.
 */
withDefaults(
  defineProps<{ text: string; kbd?: string; side?: "top" | "right" | "bottom" | "left" }>(),
  { side: "top" },
);
const layer = useLayer();
</script>
<template>
  <TooltipRoot>
    <TooltipTrigger as-child><slot /></TooltipTrigger>
    <TooltipPortal :to="layer">
      <TooltipContent class="s-tooltip" :side="side" :side-offset="6" :collision-padding="8">
        {{ text }}<kbd v-if="kbd">{{ kbd }}</kbd>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>
