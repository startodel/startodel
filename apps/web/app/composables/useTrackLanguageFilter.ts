import type { TrackLanguage } from "@startodel/core";

/** Filter a single list. Direct links and the underlying catalog are independent of this choice. */
export function useTrackLanguageFilter<T extends { language: TrackLanguage }>(
  tracks: () => readonly T[] | undefined,
  defaultToLocale = true,
) {
  const { locale, t } = useI18n();
  const choice = ref<string>();
  const tags = computed(() => [...new Set(tracks()?.map((track) => track.language))].sort());
  const options = computed(() => [
    { value: "*", label: t("trackLanguage.all") },
    ...tags.value.map((tag) => ({ value: tag, label: tag.toUpperCase() })),
  ]);
  const language = computed({
    get() {
      const tag = choice.value ?? (defaultToLocale ? locale.value : "*");
      return tags.value.includes(tag) ? tag : "*";
    },
    set(tag: string) {
      choice.value = tag;
    },
  });
  const filtered = computed(() => {
    const rows = tracks() ?? [];
    return language.value === "*" ? rows : rows.filter((row) => row.language === language.value);
  });
  return { language, options, filtered };
}
