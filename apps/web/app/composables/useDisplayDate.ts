export function useDisplayDate() {
  const { locale } = useI18n();
  const formatter = computed(
    () => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeZone: "UTC" }),
  );
  return (value: string) => formatter.value.format(new Date(value));
}
