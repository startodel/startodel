<script setup lang="ts">
import { ToastProvider, TooltipProvider } from "reka-ui";
import "~/assets/design/index.css";
/**
 * The boundary of the design system. Everything inside uses the tokens and components.
 * It applies the learner's theme, and hosts the layer that menus, dialogs and toasts render in.
 */
const theme = useTheme();
useHead({
  htmlAttrs: { "data-theme": () => (theme.value === "auto" ? undefined : theme.value) },
});
</script>
<template>
  <div class="s-root">
    <TooltipProvider :delay-duration="350" :skip-delay-duration="200">
      <ToastProvider label="Notification" :duration="5000" swipe-direction="right">
        <slot />
        <UiToaster />
      </ToastProvider>
    </TooltipProvider>
    <div id="s-layer" class="s-layer" />
  </div>
</template>
<style>
.s-root .s-layer {
  position: relative;
  z-index: var(--s-z-overlay);
}
</style>
