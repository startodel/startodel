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
  <UiSegmented v-model="theme" :options="options" :label="t('ui.theme')" icon-only size="sm" />
</template>
