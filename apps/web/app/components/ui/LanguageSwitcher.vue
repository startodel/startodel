<script setup lang="ts">
/**
 * Switches the interface language. It holds no translation logic: bind the model to the locale
 * of whichever internationalisation layer the app adopts.
 */
withDefaults(
  defineProps<{
    locales?: { code: string; name: string }[];
    /** menu fits a top bar or a footer. inline shows every locale and fits settings. */
    variant?: "menu" | "inline";
  }>(),
  {
    locales: () => [
      { code: "ru", name: "Русский" },
      { code: "en", name: "English" },
    ],
    variant: "menu",
  },
);
const model = defineModel<string>({ default: "en" });
</script>
<template>
  <UiSegmented
    v-if="variant === 'inline'"
    v-model="model"
    class="s-lang"
    :options="locales.map((l) => ({ id: l.code, label: l.name }))"
    label="Language"
    size="sm"
  />
  <UiMenu
    v-else
    label="Language"
    :items="
      locales.map((l) => ({
        id: l.code,
        label: l.name,
        hint: l.code === model ? 'current' : l.code,
      }))
    "
    @select="model = $event"
  >
    <button type="button" class="s-lang__trigger" :aria-label="'Language: ' + model">
      <UiIcon name="globe" :size="14" /><span lang="en">{{ model }}</span>
      <UiIcon name="chevron-down" :size="12" />
    </button>
  </UiMenu>
</template>
<style>
.s-root .s-lang__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  height: var(--s-control-sm);
  padding: 0 var(--s-2);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-2);
}
.s-root .s-lang__trigger:hover,
.s-root .s-lang__trigger[data-state="open"] {
  border-color: var(--s-ink);
  color: var(--s-ink);
}
</style>
