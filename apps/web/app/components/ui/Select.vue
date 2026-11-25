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
/** A list of options with typeahead and full keyboard support. A class set on it lands on the trigger. */
defineOptions({ inheritAttrs: false });
const props = defineProps<{
  options: { value: string; label: string; disabled?: boolean }[];
  size?: "sm" | "md" | "lg";
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
const field = useField({ id: () => props.id, invalid: () => props.invalid });
</script>
<template>
  <SelectRoot v-model="model" :disabled="disabled" :name="name">
    <SelectTrigger
      :id="field.id.value"
      class="s-control s-select"
      :class="['s-control--' + (size ?? 'md'), { 'is-invalid': field.invalid.value }]"
      :aria-label="label"
      :aria-invalid="field.invalid.value || undefined"
      :aria-describedby="field.describedBy.value"
      v-bind="$attrs"
    >
      <SelectValue class="s-select__value" :placeholder="placeholder ?? $t('ui.choose')" />
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
  width: 100%;
  padding: 0 var(--s-3);
  font-size: var(--s-text-md);
  line-height: 1.3;
  text-align: left;
}
.s-root .s-select.s-control--sm {
  padding: 0 var(--s-2);
  font-size: var(--s-text-sm);
}
.s-root .s-select.s-control--lg {
  padding: 0 var(--s-4);
}
.s-root .s-select[data-placeholder] .s-select__value {
  color: var(--s-ink-3);
}
.s-root .s-select__value {
  flex: 1;
  min-width: 0;
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
