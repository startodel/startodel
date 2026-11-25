<script setup lang="ts">
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
} from "reka-ui";
/** A text field that filters a list as the learner types. */
const props = defineProps<{
  options: string[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
}>();
const model = defineModel<string>();
const layer = useLayer();
const field = useField({ id: () => props.id, invalid: () => props.invalid });
</script>
<template>
  <ComboboxRoot v-model="model" :disabled="disabled" class="s-combobox">
    <ComboboxAnchor
      class="s-control s-combobox__anchor"
      :class="{ 'is-invalid': field.invalid.value }"
    >
      <UiIcon name="search" :size="14" class="s-combobox__icon" />
      <ComboboxInput
        :id="field.id.value"
        class="s-combobox__input"
        :placeholder="placeholder"
        :aria-label="label"
        :aria-invalid="field.invalid.value || undefined"
        :aria-describedby="field.describedBy.value"
      />
      <ComboboxTrigger class="s-combobox__toggle" :aria-label="$t('ui.showOptions')">
        <UiIcon name="chevron-down" :size="14" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxPortal :to="layer">
      <ComboboxContent
        class="s-popup s-combobox__list"
        position="popper"
        :side-offset="4"
        align="start"
      >
        <ComboboxViewport>
          <ComboboxEmpty class="s-combobox__empty">{{ $t("ui.noMatch") }}</ComboboxEmpty>
          <ComboboxItem v-for="o in options" :key="o" class="s-option" :value="o">
            {{ o }}
            <ComboboxItemIndicator class="s-option__mark"
              ><UiIcon name="check" :size="14"
            /></ComboboxItemIndicator>
          </ComboboxItem>
        </ComboboxViewport>
      </ComboboxContent>
    </ComboboxPortal>
  </ComboboxRoot>
</template>
<style>
.s-root .s-combobox {
  position: relative;
  min-width: 0;
}
.s-root .s-combobox__anchor {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: 0 var(--s-1) 0 var(--s-3);
}
.s-root .s-combobox__icon {
  flex: none;
  color: var(--s-ink-3);
}
.s-root .s-combobox__input {
  flex: 1;
  min-width: 0;
  height: calc(var(--_height, var(--s-field-md)) - 2px);
  font-size: var(--s-field-text);
  line-height: 1.3;
  text-overflow: ellipsis;
}
.s-root .s-combobox__input:focus-visible {
  outline: none;
}
.s-root .s-combobox__input:disabled {
  cursor: not-allowed;
}
.s-root .s-combobox__toggle {
  display: grid;
  place-items: center;
  width: var(--s-control-sm);
  height: var(--s-control-sm);
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-root .s-combobox__list {
  width: var(--reka-combobox-trigger-width);
  max-height: min(16rem, var(--reka-combobox-content-available-height));
}
.s-root .s-combobox__empty {
  padding: var(--s-2);
  color: var(--s-ink-3);
}
</style>
