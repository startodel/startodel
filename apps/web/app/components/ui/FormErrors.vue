<script setup lang="ts">
/**
 * The summary shown above a form that failed validation. Each entry links to its field.
 * Move focus to it after a failed submit, so the learner hears what to fix.
 */
defineProps<{ errors: { field: string; message: string }[]; title?: string }>();
const root = ref<HTMLElement>();
defineExpose({ focus: () => root.value?.focus() });
</script>
<template>
  <div v-if="errors.length" ref="root" class="s-form-errors" role="alert" tabindex="-1">
    <p class="s-form-errors__title">
      <UiIcon name="alert" :size="14" />
      {{
        title ??
        (errors.length === 1
          ? "Fix 1 field to continue"
          : `Fix ${errors.length} fields to continue`)
      }}
    </p>
    <ul class="s-form-errors__list">
      <li v-for="e in errors" :key="e.field">
        <a :href="'#' + e.field">{{ e.message }}</a>
      </li>
    </ul>
  </div>
</template>
<style scoped>
.s-form-errors {
  display: grid;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--s-oxide);
  border-left-width: 3px;
  border-radius: var(--s-radius-sm);
  background: var(--s-oxide-soft);
  font-size: var(--s-text-sm);
}
.s-form-errors__title {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-weight: 600;
  color: var(--s-oxide);
}
.s-form-errors__list {
  display: grid;
  gap: var(--s-1);
  padding-left: calc(14px + var(--s-2));
}
.s-form-errors__list a {
  color: var(--s-ink);
  text-decoration: underline;
  text-decoration-color: var(--s-oxide);
  text-underline-offset: 0.2em;
}
</style>
