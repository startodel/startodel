<script setup lang="ts">
defineOptions({ inheritAttrs: false });
/**
 * A one-time code as a row of cells. One real input covers the cells, so typing, pasting, autofill
 * from a message and a screen reader all work as in a plain text field. The cells only draw it.
 */
const props = withDefaults(
  defineProps<{ length?: number; invalid?: boolean; disabled?: boolean; id?: string }>(),
  { length: 6 },
);
const emit = defineEmits<{ complete: [code: string] }>();
const model = defineModel<string>({ default: "" });
const field = useField({ id: () => props.id, invalid: () => props.invalid });
const control = useTemplateRef("control");
const focused = ref(false);
const at = computed(() => Math.min(model.value.length, props.length - 1));
function input(event: Event) {
  const target = event.target as HTMLInputElement;
  const digits = target.value.replace(/\D/g, "").slice(0, props.length);
  target.value = digits;
  const complete = digits.length === props.length && digits !== model.value;
  model.value = digits;
  if (complete) emit("complete", digits);
}
/** The caret always sits after the last digit: the cells show no selection. */
function caret() {
  const length = control.value?.value.length ?? 0;
  control.value?.setSelectionRange(length, length);
}
defineExpose({ focus: () => control.value?.focus() });
</script>
<template>
  <span
    class="s-code-input"
    :class="{ 'is-invalid': field.invalid.value, 'is-focused': focused }"
    :style="{ '--_cells': length }"
  >
    <input
      :id="field.id.value"
      ref="control"
      class="s-code-input__control"
      :value="model"
      inputmode="numeric"
      autocomplete="one-time-code"
      autocapitalize="none"
      spellcheck="false"
      :pattern="'[0-9]{' + length + '}'"
      :maxlength="length"
      :disabled="disabled"
      :aria-invalid="field.invalid.value || undefined"
      :aria-describedby="field.describedBy.value"
      v-bind="$attrs"
      @input="input"
      @focus="((focused = true), caret())"
      @blur="focused = false"
      @click="caret"
      @keyup="caret"
    />
    <span class="s-code-input__cells" aria-hidden="true">
      <span
        v-for="i in length"
        :key="i"
        class="s-code-input__cell"
        :class="{ 'is-filled': i <= model.length, 'is-caret': focused && i - 1 === at }"
        >{{ model[i - 1] }}</span
      >
    </span>
  </span>
</template>
<style scoped>
.s-code-input {
  --_size: var(--s-field-lg);
  position: relative;
  display: block;
  width: 100%;
  max-width: calc(var(--_cells) * 4rem);
}
.s-code-input__cells {
  display: grid;
  grid-template-columns: repeat(var(--_cells), minmax(0, 1fr));
  gap: var(--s-2);
}
.s-code-input__cell {
  display: grid;
  place-items: center;
  height: calc(var(--_size) + var(--s-2));
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  font: 600 var(--s-text-2xl) / 1 var(--s-font-mono);
  font-stretch: 87.5%;
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-code-input:hover .s-code-input__cell {
  border-color: var(--s-ink);
}
.s-code-input.is-invalid .s-code-input__cell {
  border-color: var(--s-oxide);
}
.s-code-input .s-code-input__cell.is-caret {
  border-color: var(--s-focus);
  box-shadow: 0 0 0 1px var(--s-focus);
}
.s-code-input.is-invalid .s-code-input__cell.is-caret {
  border-color: var(--s-oxide);
  box-shadow: 0 0 0 1px var(--s-oxide);
}
/* An empty cell under the caret shows where the next digit lands. */
.s-code-input__cell.is-caret:not(.is-filled)::after {
  content: "";
  width: 1px;
  height: 1.25em;
  background: var(--s-ink);
  animation: s-code-caret 1.1s steps(1) infinite;
}
@keyframes s-code-caret {
  50% {
    opacity: 0;
  }
}
.s-code-input__control {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  border-radius: var(--s-radius-sm);
  background: transparent;
  color: transparent;
  caret-color: transparent;
  /* 16px keeps iOS from zooming in on focus. The text itself is never seen. */
  font-size: 1rem;
  letter-spacing: 1em;
  cursor: text;
}
.s-code-input__control::selection {
  background: transparent;
}
.s-code-input__control:focus-visible {
  outline: none;
}
.s-code-input__control:disabled {
  cursor: not-allowed;
}
.s-code-input__control:disabled + .s-code-input__cells .s-code-input__cell {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
}
@media (prefers-reduced-motion: reduce) {
  .s-code-input__cell.is-caret:not(.is-filled)::after {
    animation: none;
  }
}
</style>
