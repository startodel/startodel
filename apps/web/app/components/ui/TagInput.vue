<script setup lang="ts">
/**
 * Adds free-text entries to a list, such as a technology that is not among the presets.
 * Enter or a comma adds what was typed. Several entries can be pasted, separated by commas.
 */
const props = withDefaults(
  defineProps<{ id?: string; placeholder?: string; invalid?: boolean; maxLength?: number }>(),
  { maxLength: 60 },
);
const emit = defineEmits<{ add: [values: string[]] }>();
const draft = ref("");
function add() {
  const values = draft.value
    .split(",")
    .map((value) => value.trim().slice(0, props.maxLength))
    .filter(Boolean);
  if (values.length) emit("add", values);
  draft.value = "";
}
function onKey(event: KeyboardEvent) {
  if (event.isComposing || ![",", "Enter"].includes(event.key)) return;
  event.preventDefault();
  add();
}
</script>
<template>
  <UiInput
    :id="id"
    v-model="draft"
    icon="plus"
    :placeholder="placeholder ?? $t('onboarding.custom')"
    :invalid="invalid"
    @keydown="onKey"
    @blur="add"
  >
    <template #trailing>
      <UiButton size="sm" variant="ghost" :disabled="!draft.trim()" @click="add">{{
        $t("ui.add")
      }}</UiButton>
    </template>
  </UiInput>
</template>
