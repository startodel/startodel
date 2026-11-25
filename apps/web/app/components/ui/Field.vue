<script setup lang="ts">
/**
 * A label, one control and a note. The control in the slot takes its id, its description and its
 * error state from here, so a Field needs no wiring beyond its own props.
 */
const props = defineProps<{
  label: string;
  /** The id of the control. Generated when omitted. */
  for?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}>();
const generated = useId();
const id = computed(() => props.for ?? generated);
const noteId = computed(() => id.value + "-note");
provideField({
  id,
  describedBy: computed(() => (props.error || props.hint ? noteId.value : undefined)),
  invalid: computed(() => Boolean(props.error)),
});
</script>
<template>
  <div class="s-field" :class="{ 'is-invalid': error }">
    <label class="s-field__label" :for="id"
      ><span class="s-field__text">{{ label }}</span
      ><span v-if="optional" class="s-field__optional">{{ $t("ui.optional") }}</span></label
    >
    <slot />
    <p v-if="error" :id="noteId" class="s-field__note s-field__note--error" role="alert">
      <UiIcon name="alert" :size="14" class="s-field__mark" /><span>{{ error }}</span>
    </p>
    <p v-else-if="hint" :id="noteId" class="s-field__note">{{ hint }}</p>
  </div>
</template>
<style scoped>
.s-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 0.375rem;
  min-width: 0;
}
.s-field__label {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--s-2);
  font-size: var(--s-text-sm);
  font-weight: 600;
  line-height: 1.35;
  color: var(--s-ink);
}
.s-field__optional {
  font: 500 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-field__note {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  font-size: var(--s-text-sm);
  line-height: 1.4;
  color: var(--s-ink-3);
}
/* The mark stays on the first line when the message wraps. */
.s-field__mark {
  flex: none;
  margin-top: 0.1em;
}
.s-field__note--error {
  color: var(--s-oxide);
}
</style>
