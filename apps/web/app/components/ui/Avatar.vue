<script setup lang="ts">
const props = withDefaults(defineProps<{ name: string; src?: string | null; size?: number }>(), {
  size: 28,
});
const initials = computed(() =>
  props.name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join(""),
);
</script>
<template>
  <span class="s-avatar" :style="{ '--_size': size + 'px' }">
    <img v-if="src" :src="src" alt="" :width="size" :height="size" />
    <span v-else aria-hidden="true">{{ initials }}</span>
  </span>
</template>
<style scoped>
.s-avatar {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: var(--_size);
  height: var(--_size);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
  color: var(--s-ink-2);
  font: 600 calc(var(--_size) * 0.38) / 1 var(--s-font-mono);
  font-stretch: 75%;
  overflow: hidden;
}
.s-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
