<script setup lang="ts">
import { languageCookie } from "../../../shared/locale";
/**
 * Switches the interface language. Each option links to the current page in that language, and
 * choosing one stores the preference in the language cookie.
 */
withDefaults(
  defineProps<{
    /** menu fits a top bar or a footer. inline shows every language and fits settings. */
    variant?: "menu" | "inline";
  }>(),
  { variant: "menu" },
);
const { locale, locales } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const preference = useCookie(languageCookie, { sameSite: "lax", maxAge: 31536000, path: "/" });
// A language is named in itself, so the names are not messages.
const names: Record<string, string> = { ru: "Русский", en: "English" };
const options = computed(() =>
  locales.value.map(({ code }) => ({
    code,
    name: names[code] ?? code,
    to: switchLocalePath(code),
  })),
);
</script>
<template>
  <nav v-if="variant === 'inline'" class="s-lang" :aria-label="$t('nav.language')">
    <NuxtLinkLocale
      v-for="o in options"
      :key="o.code"
      :to="o.to"
      :locale="o.code"
      class="s-lang__option"
      :lang="o.code"
      :hreflang="o.code"
      :aria-current="o.code === locale ? 'true' : undefined"
      @click="preference = o.code"
      >{{ o.name }}</NuxtLinkLocale
    >
  </nav>
  <UiMenu
    v-else
    :label="$t('nav.language')"
    :items="
      options.map((o) => ({
        id: o.code,
        label: o.name,
        to: o.to,
        locale: o.code,
        hint: o.code === locale ? $t('nav.current') : o.code,
      }))
    "
    @select="preference = $event"
  >
    <button type="button" class="s-lang__trigger" :aria-label="$t('nav.language') + ': ' + locale">
      <UiIcon name="globe" :size="14" /><span>{{ locale }}</span>
      <UiIcon name="chevron-down" :size="12" />
    </button>
  </UiMenu>
</template>
<style>
.s-root .s-lang {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-sunken);
}
.s-root .s-lang__option {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0 var(--s-2);
  border: 1px solid transparent;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
  font-size: var(--s-text-sm);
  font-weight: 600;
}
.s-root .s-lang__option:hover {
  color: var(--s-ink);
}
.s-root .s-lang__option[aria-current] {
  border-color: var(--s-line-strong);
  background: var(--s-raised);
  color: var(--s-ink);
  box-shadow: var(--s-shadow-1);
}
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
