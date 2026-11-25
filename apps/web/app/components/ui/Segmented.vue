<script setup lang="ts" generic="T extends string">
import { ToggleGroupItem, ToggleGroupRoot } from "reka-ui";
import type { IconName } from "./icons";
/** A small set of exclusive options, such as a view or a theme. One option is always chosen. */
defineProps<{
  options: readonly { id: T; label: string; icon?: IconName }[];
  label: string;
  iconOnly?: boolean;
  size?: "sm" | "md";
}>();
const model = defineModel<T>({ required: true });
</script>
<template>
  <ToggleGroupRoot
    type="single"
    class="s-segmented"
    :class="'s-segmented--' + (size ?? 'md')"
    :model-value="model"
    :aria-label="label"
    @update:model-value="$event && (model = $event as T)"
  >
    <ToggleGroupItem
      v-for="o in options"
      :key="o.id"
      class="s-segmented__option"
      :value="o.id"
      :aria-label="iconOnly ? o.label : undefined"
      :title="iconOnly ? o.label : undefined"
    >
      <UiIcon v-if="o.icon" :name="o.icon" :size="14" /><span v-if="!iconOnly">{{ o.label }}</span>
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
<style>
.s-root .s-segmented {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
}
.s-root .s-segmented__option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-width: 1.75rem;
  min-height: 1.75rem;
  padding: 0 var(--s-3);
  border: 1px solid transparent;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
  font-size: var(--s-text-sm);
  font-weight: 600;
  transition: color var(--s-dur-1) var(--s-ease);
}
.s-root .s-segmented--sm .s-segmented__option {
  min-width: 1.5rem;
  min-height: 1.5rem;
  padding: 0 var(--s-2);
}
.s-root .s-segmented__option:has(> svg:only-child) {
  padding: 0;
}
.s-root .s-segmented__option:hover {
  color: var(--s-ink);
}
.s-root .s-segmented__option[data-state="on"] {
  border-color: var(--s-line-strong);
  background: var(--s-raised);
  color: var(--s-ink);
  box-shadow: var(--s-shadow-1);
}
.s-root .s-segmented__option[data-state="on"] svg {
  color: var(--s-copper);
}
</style>
