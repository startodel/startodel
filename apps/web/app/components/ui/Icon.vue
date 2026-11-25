<script setup lang="ts">
import { icons, type IconName } from "./icons";
withDefaults(defineProps<{ name: IconName; size?: number | string; label?: string }>(), {
  size: 16,
});
</script>
<template>
  <svg
    class="s-icon"
    viewBox="0 0 16 16"
    :width="size"
    :height="size"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : true"
    v-html="icons[name]"
  />
</template>
<style scoped>
.s-icon {
  flex: none;
  display: inline-block;
  vertical-align: -0.15em;
}
</style>
