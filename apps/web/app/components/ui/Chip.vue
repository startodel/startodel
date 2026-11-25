<script setup lang="ts">
defineProps<{ removable?: boolean; tone?: "neutral" | "copper" }>();
defineEmits<{ remove: [] }>();
</script>
<template>
  <span class="s-chip" :class="'s-chip--' + (tone ?? 'neutral')">
    <slot /><button
      v-if="removable"
      type="button"
      class="s-chip__remove"
      aria-label="Remove"
      @click="$emit('remove')"
    >
      <UiIcon name="x" :size="12" />
    </button>
  </span>
</template>
<style scoped>
.s-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  min-height: 1.5rem;
  padding: 0 var(--s-2);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-xs);
  background: var(--s-surface);
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  line-height: 1.2;
  white-space: nowrap;
}
.s-chip--copper {
  border-color: var(--s-copper-line);
  background: var(--s-copper-soft);
  color: var(--s-copper);
}
.s-chip__remove {
  display: grid;
  place-items: center;
  width: 1rem;
  height: 1rem;
  margin-right: -0.25rem;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-chip__remove:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
</style>
