<script setup lang="ts" generic="T extends string">
import { RadioGroupIndicator, RadioGroupItem, RadioGroupRoot } from "reka-ui";
/** One choice from a short list, with room for a hint under each option. */
defineProps<{
  options: readonly { value: T; label: string; hint?: string; disabled?: boolean }[];
  label: string;
  name?: string;
  disabled?: boolean;
  /** cards draws each option as a plate. Use it when the options need a hint. */
  variant?: "plain" | "cards";
}>();
const model = defineModel<T | undefined>({ required: true });
</script>
<template>
  <RadioGroupRoot
    v-model="model"
    class="s-radio"
    :class="'s-radio--' + (variant ?? 'plain')"
    :aria-label="label"
    :name="name"
    :disabled="disabled"
  >
    <label
      v-for="o in options"
      :key="o.value"
      class="s-radio__option"
      :class="{ 'is-on': model === o.value, 'is-disabled': disabled || o.disabled }"
    >
      <RadioGroupItem class="s-radio__pad" :value="o.value" :disabled="o.disabled">
        <RadioGroupIndicator class="s-radio__dot" />
      </RadioGroupItem>
      <span class="s-radio__text">
        <span class="s-radio__label">{{ o.label }}</span>
        <span v-if="o.hint" class="s-radio__hint">{{ o.hint }}</span>
      </span>
    </label>
  </RadioGroupRoot>
</template>
<style>
.s-root .s-radio {
  display: grid;
  gap: var(--s-3);
}
.s-root .s-radio--cards {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 11rem), 1fr));
}
.s-root .s-radio__option {
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  cursor: pointer;
}
.s-root .s-radio--cards .s-radio__option {
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  transition: border-color var(--s-dur-1) var(--s-ease);
}
.s-root .s-radio--cards .s-radio__option:hover {
  border-color: var(--s-ink);
}
.s-root .s-radio--cards .s-radio__option.is-on {
  border-color: var(--s-ink);
  box-shadow: inset 0 0 0 1px var(--s-ink);
}
.s-root .s-radio__pad {
  flex: none;
  display: grid;
  place-items: center;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.125rem;
  border: 1.5px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-raised);
}
.s-root .s-radio__pad[data-state="checked"] {
  border-color: var(--s-ink);
}
.s-root .s-radio__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--s-copper-fill);
}
.s-root .s-radio__option.is-disabled {
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-root .s-radio--cards .s-radio__option.is-disabled {
  border-color: var(--s-line);
  background: var(--s-sunken);
  box-shadow: none;
}
.s-root .s-radio__pad[data-disabled] {
  border-color: var(--s-line);
  background: var(--s-sunken);
  cursor: not-allowed;
}
.s-root .s-radio__pad[data-disabled] .s-radio__dot {
  background: var(--s-ink-3);
}
.s-root .s-radio__text {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
}
.s-root .s-radio__label {
  line-height: 1.4;
}
.s-root .s-radio--cards .s-radio__label {
  font-weight: 600;
}
.s-root .s-radio__option.is-disabled .s-radio__hint {
  color: inherit;
}
.s-root .s-radio__hint {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
</style>
