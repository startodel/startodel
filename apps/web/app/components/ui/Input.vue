<script setup lang="ts">
import type { IconName } from "./icons";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    size?: "sm" | "md" | "lg";
    mono?: boolean;
    invalid?: boolean;
    icon?: IconName;
    id?: string;
  }>(),
  { size: "md" },
);
const model = defineModel<string>();
const field = useField({ id: () => props.id, invalid: () => props.invalid });
const control = useTemplateRef("control");
/** The icon and the padding belong to the box, so a click on them lands in the field. */
function focusFromBox(event: MouseEvent) {
  const target = event.target as Element;
  if (target.closest("input, button, a, [tabindex]")) return;
  event.preventDefault();
  control.value?.focus();
}
defineExpose({ focus: () => control.value?.focus() });
</script>
<template>
  <span
    class="s-control s-input"
    :class="['s-control--' + size, { 's-input--mono': mono, 'is-invalid': field.invalid.value }]"
    @mousedown="focusFromBox"
  >
    <UiIcon v-if="icon" :name="icon" :size="size === 'sm' ? 14 : 16" class="s-input__icon" />
    <input
      :id="field.id.value"
      ref="control"
      v-model="model"
      class="s-input__control"
      :aria-invalid="field.invalid.value || undefined"
      :aria-describedby="field.describedBy.value"
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
  padding: 0 var(--s-3);
  cursor: text;
}
.s-input.s-control--sm {
  padding: 0 var(--s-2);
}
.s-input.s-control--lg {
  padding: 0 var(--s-4);
}
/* A trailing action sits closer to the edge than text does. */
.s-input:has(> .s-input__control ~ *) {
  padding-right: var(--s-1);
}
.s-input__icon {
  flex: none;
  color: var(--s-ink-3);
}
.s-input__control {
  flex: 1;
  min-width: 0;
  /* The box draws the outline, so the control fills it edge to edge. */
  height: calc(var(--_height, var(--s-field-md)) - 2px);
  font-size: var(--s-field-text);
  line-height: 1.3;
  text-overflow: ellipsis;
}
.s-control--sm .s-input__control {
  font-size: var(--s-field-text-sm);
}
.s-input--mono .s-input__control {
  font-family: var(--s-font-mono);
  font-stretch: 87.5%;
  font-size: var(--s-field-text-sm);
}
.s-input__control:focus-visible {
  outline: none;
}
.s-input__control:disabled {
  cursor: not-allowed;
}
.s-input__control[type="search"]::-webkit-search-decoration {
  appearance: none;
}
</style>
