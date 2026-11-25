<script setup lang="ts">
defineProps<{ invalid?: boolean; rows?: number }>();
const model = defineModel<string>();
</script>
<template>
  <textarea
    v-model="model"
    class="s-textarea"
    :class="{ 'is-invalid': invalid }"
    :rows="rows ?? 5"
    :aria-invalid="invalid || undefined"
  />
</template>
<style scoped>
.s-textarea {
  display: block;
  width: 100%;
  min-height: 6rem;
  padding: var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-sm);
  background: var(--s-raised);
  color: var(--s-ink);
  font: 400 var(--s-text-lg) / 1.6 var(--s-font-read);
  resize: vertical;
  transition:
    border-color var(--s-dur-1) var(--s-ease),
    box-shadow var(--s-dur-1) var(--s-ease);
}
.s-textarea:hover {
  border-color: var(--s-ink);
}
.s-textarea:focus-visible {
  outline: none;
  border-color: var(--s-focus);
  box-shadow: 0 0 0 1px var(--s-focus);
  border-radius: var(--s-radius-sm);
}
.s-textarea.is-invalid {
  border-color: var(--s-oxide);
}
.s-textarea::placeholder {
  color: var(--s-ink-3);
  opacity: 1;
}
.s-textarea:disabled {
  border-color: var(--s-line);
  background: var(--s-sunken);
  color: var(--s-ink-3);
  cursor: not-allowed;
  opacity: 1;
}
</style>
