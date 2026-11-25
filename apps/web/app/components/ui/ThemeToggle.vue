<script setup lang="ts">
const theme = useTheme();
const { t } = useI18n();
const options = computed(
  () =>
    [
      { id: "auto", label: t("ui.themeAuto"), icon: "auto" },
      { id: "light", label: t("ui.themeLight"), icon: "sun" },
      { id: "dark", label: t("ui.themeDark"), icon: "moon" },
    ] as const,
);
</script>
<template>
  <div class="s-theme" role="radiogroup" :aria-label="t('ui.theme')">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="s-theme__option"
      role="radio"
      :aria-checked="theme === option.id"
      :aria-label="option.label"
      :title="option.label"
      @click="theme = option.id"
    >
      <UiIcon :name="option.icon" :size="14" />
    </button>
  </div>
</template>
<style scoped>
.s-theme {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
}
.s-theme__option {
  display: grid;
  place-items: center;
  width: 1.625rem;
  height: 1.5rem;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-theme__option:hover {
  color: var(--s-ink);
}
.s-theme__option[aria-checked="true"] {
  background: var(--s-raised);
  color: var(--s-copper);
  box-shadow: 0 0 0 1px var(--s-line-strong);
}
</style>
