<script setup lang="ts">
defineProps<{ label: string; for?: string; hint?: string; error?: string; optional?: boolean }>();
</script>
<template>
  <div class="s-field" :class="{ 'is-invalid': error }">
    <label class="s-field__label" :for="$props.for"
      >{{ label
      }}<span v-if="optional" class="s-field__optional">{{ $t("ui.optional") }}</span></label
    >
    <slot />
    <p v-if="error" class="s-field__note s-field__note--error" role="alert">
      <UiIcon name="alert" :size="14" />{{ error }}
    </p>
    <p v-else-if="hint" class="s-field__note">{{ hint }}</p>
  </div>
</template>
<style scoped>
.s-field {
  display: grid;
  gap: 0.375rem;
  min-width: 0;
}
.s-field__label {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
  font-weight: 600;
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
  align-items: center;
  gap: 0.375rem;
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.s-field__note--error {
  color: var(--s-oxide);
}
</style>
