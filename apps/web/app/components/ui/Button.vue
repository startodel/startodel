<script setup lang="ts">
import type { LinkTarget } from "./nav";
import type { IconName } from "./icons";
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    icon?: IconName;
    iconRight?: IconName;
    /** Accessible name for an icon-only button. */
    label?: string;
    to?: LinkTarget;
    href?: string;
    target?: "_self" | "_blank";
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  { variant: "secondary", size: "md", type: "button" },
);
const slots = useSlots();
const inactive = computed(() => props.disabled || props.loading);
const classes = computed(() => [
  "s-button",
  "s-button--" + props.variant,
  "s-button--" + props.size,
  { "s-button--icon": !slots.default, "s-button--block": props.block, "is-loading": props.loading },
]);
</script>
<template>
  <NuxtLinkLocale
    v-if="(to || href) && !inactive"
    :class="classes"
    :to="to ?? href"
    :external="!!href"
    :target="href ? (target ?? '_blank') : undefined"
    :rel="href ? 'noopener noreferrer' : undefined"
    :aria-label="label"
  >
    <UiIcon v-if="icon" :name="icon" /><span v-if="$slots.default" class="s-button__text"
      ><slot /></span
    ><UiIcon v-if="iconRight" :name="iconRight" />
  </NuxtLinkLocale>
  <button
    v-else
    :class="classes"
    :type="type"
    :disabled="disabled"
    :aria-disabled="loading || undefined"
    :aria-busy="loading || undefined"
    :aria-label="label"
    @click="loading && $event.preventDefault()"
  >
    <UiPending v-if="loading" class="s-button__pending" /><UiIcon
      v-else-if="icon"
      :name="icon"
    /><span v-if="$slots.default" class="s-button__text"><slot /></span
    ><UiIcon v-if="iconRight" :name="iconRight" />
  </button>
</template>
<style scoped>
.s-button {
  --_h: var(--s-control-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-height: var(--_h);
  padding: 0 var(--s-4);
  border: 1px solid var(--_line, transparent);
  border-radius: var(--s-radius-sm);
  background: var(--_bg, transparent);
  color: var(--_ink, var(--s-ink));
  font: 600 var(--s-text-sm) / 1 var(--s-font-ui);
  letter-spacing: 0.005em;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition:
    background var(--s-dur-1) var(--s-ease),
    border-color var(--s-dur-1) var(--s-ease),
    color var(--s-dur-1) var(--s-ease),
    translate var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-button--sm {
  --_h: var(--s-control-sm);
  padding: 0 var(--s-3);
  font-size: var(--s-text-xs);
  gap: 0.375rem;
}
.s-button--lg {
  --_h: var(--s-control-lg);
  padding: 0 var(--s-6);
  font-size: var(--s-text-md);
}
.s-button--icon {
  width: var(--_h);
  padding: 0;
}
.s-button--block {
  display: flex;
  width: 100%;
}
.s-button--primary {
  --_bg: var(--s-copper-fill);
  --_ink: var(--s-on-copper);
  box-shadow: inset 0 -2px 0 rgb(0 0 0 / 0.2);
}
.s-button--primary:hover {
  --_bg: var(--s-copper-fill-hover);
}
.s-button--secondary {
  --_bg: var(--s-raised);
  --_line: var(--s-line-strong);
  box-shadow: inset 0 -2px 0 var(--s-line);
}
.s-button--secondary:hover {
  --_line: var(--s-ink);
}
.s-button--ghost {
  --_ink: var(--s-ink-2);
}
.s-button--ghost:hover {
  --_bg: var(--s-sunken);
  --_ink: var(--s-ink);
}
.s-button--danger {
  --_bg: var(--s-raised);
  --_ink: var(--s-oxide);
  --_line: var(--s-oxide-line);
  box-shadow: inset 0 -2px 0 var(--s-oxide-soft);
}
.s-button--danger:hover {
  --_bg: var(--s-oxide-soft);
  --_line: var(--s-oxide);
}
.s-button:active:not(:disabled, .is-loading) {
  translate: 0 1px;
  box-shadow: none;
}
.s-button:disabled {
  --_bg: var(--s-sunken);
  --_ink: var(--s-ink-3);
  --_line: var(--s-line);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 1;
}
.s-button.is-loading {
  cursor: progress;
}
.s-button__pending {
  margin-inline: 0.125rem;
}
</style>
