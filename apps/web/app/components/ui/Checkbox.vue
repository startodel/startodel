<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from "reka-ui";
/** A single yes or no choice. The label is the default slot and is part of the target. */
defineProps<{
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
}>();
const model = defineModel<boolean>({ default: false });
</script>
<template>
  <label class="s-check" :class="{ 'is-disabled': disabled, 'is-invalid': invalid }">
    <CheckboxRoot
      :id="id"
      v-model="model"
      class="s-check__box"
      :name="name"
      :disabled="disabled"
      :required="required"
      :aria-invalid="invalid || undefined"
    >
      <CheckboxIndicator class="s-check__mark"
        ><UiIcon name="check" :size="14"
      /></CheckboxIndicator>
    </CheckboxRoot>
    <span class="s-check__label"><slot /></span>
  </label>
</template>
<style>
.s-root .s-check {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--s-3);
  cursor: pointer;
}
.s-root .s-check.is-disabled {
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-root .s-check__box {
  flex: none;
  display: grid;
  place-items: center;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.125rem;
  border: 1.5px solid var(--s-line-strong);
  border-radius: var(--s-radius-xs);
  background: var(--s-raised);
  transition:
    background var(--s-dur-1) var(--s-ease),
    border-color var(--s-dur-1) var(--s-ease);
}
.s-root .s-check:hover .s-check__box:not([data-disabled]) {
  border-color: var(--s-ink);
}
.s-root .s-check__box[data-state="checked"] {
  border-color: var(--s-inverse);
  background: var(--s-inverse);
  color: var(--s-copper-fill);
}
.s-root .s-check.is-invalid .s-check__box {
  border-color: var(--s-oxide);
}
.s-root .s-check__box[data-disabled] {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-root .s-check__mark {
  display: grid;
}
.s-root .s-check__label {
  min-width: 0;
  line-height: 1.4;
}
</style>
