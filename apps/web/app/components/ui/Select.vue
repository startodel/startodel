<script setup lang="ts">
defineProps<{
  options: { value: string; label: string }[];
  size?: "sm" | "md";
  invalid?: boolean;
}>();
const model = defineModel<string>();
</script>
<template>
  <span class="s-select" :class="['s-select--' + (size ?? 'md'), { 'is-invalid': invalid }]">
    <select v-model="model" class="s-select__control" :aria-invalid="invalid || undefined">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <UiIcon name="chevron-down" :size="14" class="s-select__caret" />
  </span>
</template>
<style scoped>
.s-select {
  position: relative;
  display: inline-flex;
  min-width: 0;
}
.s-select__control {
  appearance: none;
  min-height: var(--s-control-md);
  width: 100%;
  padding: 0 var(--s-8) 0 var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  font-size: var(--s-text-md);
  cursor: pointer;
  transition: border-color var(--s-dur-1) var(--s-ease);
}
.s-select--sm .s-select__control {
  min-height: var(--s-control-sm);
  font-size: var(--s-text-sm);
}
.s-select__control:hover {
  border-color: var(--s-ink);
}
.s-select__control:focus-visible {
  outline: none;
  border-color: var(--s-focus);
  box-shadow: 0 0 0 1px var(--s-focus);
  border-radius: var(--s-radius-sm);
}
.s-select.is-invalid .s-select__control {
  border-color: var(--s-oxide);
}
.s-select__control:disabled {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
  cursor: not-allowed;
  opacity: 1;
}
.s-select__caret {
  position: absolute;
  right: var(--s-3);
  top: 50%;
  translate: 0 -50%;
  color: var(--s-ink-3);
  pointer-events: none;
}
</style>
