<script setup lang="ts">
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from "reka-ui";
/** A list of options with typeahead and full keyboard support. */
defineProps<{
  options: { value: string; label: string; disabled?: boolean }[];
  size?: "sm" | "md";
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** The trigger's id, so a UiField label can point at it. */
  id?: string;
  /** Names the control when no visible label points at it. */
  label?: string;
  name?: string;
}>();
const model = defineModel<string>();
const layer = useLayer();
</script>
<template>
  <SelectRoot v-model="model" :disabled="disabled" :name="name">
    <SelectTrigger
      :id="id"
      class="s-select"
      :class="['s-select--' + (size ?? 'md'), { 'is-invalid': invalid }]"
      :aria-label="label"
      :aria-invalid="invalid || undefined"
    >
      <SelectValue class="s-select__value" :placeholder="placeholder ?? 'Choose'" />
      <UiIcon name="chevron-down" :size="14" class="s-select__caret" />
    </SelectTrigger>
    <SelectPortal :to="layer">
      <SelectContent
        class="s-popup s-select__list"
        position="popper"
        :side-offset="4"
        align="start"
      >
        <SelectViewport>
          <SelectItem
            v-for="o in options"
            :key="o.value"
            class="s-option"
            :value="o.value"
            :disabled="o.disabled"
          >
            <SelectItemText>{{ o.label }}</SelectItemText>
            <SelectItemIndicator class="s-option__mark"
              ><UiIcon name="check" :size="14"
            /></SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
<style>
.s-root .s-select {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  min-width: 0;
  width: 100%;
  min-height: var(--s-control-md);
  padding: 0 var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  font-size: var(--s-text-md);
  text-align: left;
  transition: border-color var(--s-dur-1) var(--s-ease);
}
.s-root .s-select--sm {
  min-height: var(--s-control-sm);
  font-size: var(--s-text-sm);
}
.s-root .s-select:hover {
  border-color: var(--s-ink);
}
.s-root .s-select:focus-visible,
.s-root .s-select[data-state="open"] {
  outline: none;
  border-color: var(--s-focus);
  box-shadow: 0 0 0 1px var(--s-focus);
  border-radius: var(--s-radius-sm);
}
.s-root .s-select.is-invalid {
  border-color: var(--s-oxide);
}
.s-root .s-select[data-disabled] {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-root .s-select[data-placeholder] .s-select__value {
  color: var(--s-ink-3);
}
.s-root .s-select__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.s-root .s-select__caret {
  flex: none;
  color: var(--s-ink-3);
}
.s-root .s-select__list {
  min-width: var(--reka-select-trigger-width);
  max-height: min(20rem, var(--reka-select-content-available-height));
}
</style>
