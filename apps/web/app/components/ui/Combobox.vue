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
defineProps<{
  options: string[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  label?: string;
}>();
const model = defineModel<string>();
const layer = useLayer();
</script>
<template>
  <ComboboxRoot v-model="model" :disabled="disabled" class="s-combobox">
    <ComboboxAnchor class="s-combobox__anchor" :class="{ 'is-invalid': invalid }">
      <UiIcon name="search" :size="14" class="s-combobox__icon" />
      <ComboboxInput
        :id="id"
        class="s-combobox__input"
        :placeholder="placeholder"
        :aria-label="label"
        :aria-invalid="invalid || undefined"
      />
      <ComboboxTrigger class="s-combobox__toggle" aria-label="Show options">
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
          <ComboboxEmpty class="s-combobox__empty">No match</ComboboxEmpty>
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
  min-height: var(--s-control-md);
  padding: 0 var(--s-1) 0 var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  transition: border-color var(--s-dur-1) var(--s-ease);
}
.s-root .s-combobox__anchor:hover {
  border-color: var(--s-ink);
}
.s-root .s-combobox__anchor:focus-within {
  border-color: var(--s-focus);
  box-shadow: 0 0 0 1px var(--s-focus);
}
.s-root .s-combobox__anchor.is-invalid {
  border-color: var(--s-oxide);
}
.s-root .s-combobox__icon {
  flex: none;
  color: var(--s-ink-3);
}
.s-root .s-combobox__input {
  flex: 1;
  min-width: 0;
  height: calc(var(--s-control-md) - 2px);
  outline: none;
}
.s-root .s-combobox__input::placeholder {
  color: var(--s-ink-3);
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
