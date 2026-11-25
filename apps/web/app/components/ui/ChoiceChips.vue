<script setup lang="ts" generic="T extends string">
const props = defineProps<{
  legend: string;
  options: readonly (T | { value: T; label: string; hint?: string })[];
  name: string;
  multiple?: boolean;
  disabled?: boolean;
  hideLegend?: boolean;
}>();
const model = defineModel<T | T[] | null>({ required: true });
const items = computed(() =>
  props.options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)),
);
const isOn = (value: T) =>
  Array.isArray(model.value) ? model.value.includes(value) : model.value === value;
function toggle(value: T) {
  if (!props.multiple) {
    model.value = value;
    return;
  }
  const current = Array.isArray(model.value) ? model.value : [];
  model.value = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
}
</script>
<template>
  <fieldset class="s-choices" :disabled="disabled">
    <legend class="s-choices__legend" :class="{ 's-sr': hideLegend }">{{ legend }}</legend>
    <div class="s-choices__list">
      <label v-for="o in items" :key="o.value" class="s-choice">
        <input
          class="s-choice__input s-sr"
          :type="multiple ? 'checkbox' : 'radio'"
          :name="name"
          :value="o.value"
          :checked="isOn(o.value)"
          @change="toggle(o.value)"
        />
        <span class="s-choice__pad" aria-hidden="true" />
        <span class="s-choice__label">{{ o.label }}</span>
        <span v-if="'hint' in o && o.hint" class="s-choice__hint">{{ o.hint }}</span>
      </label>
    </div>
  </fieldset>
</template>
<style scoped>
.s-choices__legend {
  margin-bottom: var(--s-3);
  font-size: var(--s-text-sm);
  font-weight: 600;
}
.s-choices__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}
.s-choice {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-height: 2rem;
  padding: 0 var(--s-3) 0 0.625rem;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition:
    background var(--s-dur-1) var(--s-ease),
    border-color var(--s-dur-1) var(--s-ease),
    color var(--s-dur-1) var(--s-ease);
}
.s-choice:hover {
  border-color: var(--s-ink);
  color: var(--s-ink);
}
.s-choice__pad {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--s-line-strong);
  transition:
    background var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-choice:has(:checked) {
  border-color: var(--s-inverse);
  background: var(--s-inverse);
  color: var(--s-on-inverse);
}
.s-choice:has(:checked) .s-choice__pad {
  background: var(--s-copper-fill);
  box-shadow: none;
}
.s-choice:has(:focus-visible) {
  outline: 2px solid var(--s-focus);
  outline-offset: 2px;
}
.s-choice__hint {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  opacity: 0.7;
}
.s-choices:disabled .s-choice {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-choices:disabled .s-choice:has(:checked) .s-choice__pad {
  background: var(--s-ink-3);
}
</style>
