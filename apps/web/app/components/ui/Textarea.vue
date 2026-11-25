<script setup lang="ts">
const props = defineProps<{ invalid?: boolean; rows?: number; id?: string }>();
const model = defineModel<string>();
const field = useField({ id: () => props.id, invalid: () => props.invalid });
</script>
<template>
  <textarea
    :id="field.id.value"
    v-model="model"
    class="s-control s-textarea"
    :class="{ 'is-invalid': field.invalid.value }"
    :rows="rows ?? 5"
    :aria-invalid="field.invalid.value || undefined"
    :aria-describedby="field.describedBy.value"
  />
</template>
<style scoped>
.s-textarea {
  display: block;
  --_height: 6rem;
  width: 100%;
  padding: var(--s-3);
  font: 400 var(--s-text-lg) / 1.6 var(--s-font-read);
  resize: vertical;
}
</style>
