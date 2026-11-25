<script setup lang="ts">
import type { IconName } from "./icons";
defineOptions({ inheritAttrs: false });
withDefaults(
  defineProps<{ size?: "md" | "lg"; mono?: boolean; invalid?: boolean; icon?: IconName }>(),
  { size: "md" },
);
const model = defineModel<string>();
</script>
<template>
  <span
    class="s-input"
    :class="['s-input--' + size, { 's-input--mono': mono, 'is-invalid': invalid }]"
  >
    <UiIcon v-if="icon" :name="icon" class="s-input__icon" />
    <input
      v-model="model"
      class="s-input__control"
      :aria-invalid="invalid || undefined"
      v-bind="$attrs"
    />
    <slot name="trailing" />
  </span>
</template>
<style scoped>
.s-input {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-height: var(--s-control-md);
  padding: 0 var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-input--lg {
  min-height: var(--s-control-lg);
  padding: 0 var(--s-4);
}
.s-input:hover {
  border-color: var(--s-ink);
}
.s-input:focus-within {
  border-color: var(--s-focus);
  box-shadow: 0 0 0 1px var(--s-focus);
}
.s-input.is-invalid {
  border-color: var(--s-oxide);
}
.s-input.is-invalid:focus-within {
  box-shadow: 0 0 0 1px var(--s-oxide);
}
.s-input:has(:disabled) {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
}
.s-input__icon {
  color: var(--s-ink-3);
}
.s-input__control {
  flex: 1;
  min-width: 0;
  align-self: stretch;
  font-size: var(--s-text-md);
}
.s-input--mono .s-input__control {
  font-family: var(--s-font-mono);
  font-stretch: 87.5%;
  font-size: var(--s-text-sm);
}
.s-input__control:focus-visible {
  outline: none;
}
.s-input__control::placeholder {
  color: var(--s-ink-3);
  opacity: 1;
}
.s-input__control:disabled {
  cursor: not-allowed;
}
</style>
