<script setup lang="ts">
import { SwitchRoot, SwitchThumb } from "reka-ui";
/** A setting that takes effect at once. The label is the default slot. */
defineProps<{ id?: string; disabled?: boolean }>();
const model = defineModel<boolean>({ default: false });
</script>
<template>
  <label class="s-switch" :class="{ 'is-disabled': disabled }">
    <SwitchRoot :id="id" v-model="model" class="s-switch__track" :disabled="disabled">
      <SwitchThumb class="s-switch__thumb" />
    </SwitchRoot>
    <span class="s-switch__label"><slot /></span>
    <span class="s-switch__state" aria-hidden="true">{{ model ? $t("ui.on") : $t("ui.off") }}</span>
  </label>
</template>
<style>
.s-root .s-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  cursor: pointer;
}
.s-root .s-switch.is-disabled {
  color: var(--s-ink-3);
  cursor: not-allowed;
}
.s-root .s-switch__track {
  flex: none;
  width: 2.25rem;
  height: 1.25rem;
  padding: 2px;
  border: 1.5px solid var(--s-line-strong);
  border-radius: 0.625rem;
  background: var(--s-sunken);
  transition:
    background var(--s-dur-2) var(--s-ease),
    border-color var(--s-dur-2) var(--s-ease);
}
.s-root .s-switch__track[data-state="checked"] {
  border-color: var(--s-inverse);
  background: var(--s-inverse);
}
.s-root .s-switch__thumb {
  display: block;
  width: 0.8125rem;
  height: 0.8125rem;
  border-radius: 50%;
  background: var(--s-line-strong);
  transition:
    translate var(--s-dur-2) var(--s-ease),
    background var(--s-dur-2) var(--s-ease);
}
.s-root .s-switch__thumb[data-state="checked"] {
  background: var(--s-copper-fill);
  translate: 1rem 0;
}
.s-root .s-switch__track[data-disabled] {
  border-color: var(--s-line);
  background: var(--s-sunken);
  cursor: not-allowed;
}
.s-root .s-switch__track[data-disabled] .s-switch__thumb {
  background: var(--s-ink-3);
}
.s-root .s-switch__state {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
</style>
