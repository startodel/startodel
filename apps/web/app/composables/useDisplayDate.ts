type DateStyle = "medium" | "short";

export function createDisplayDate(locale: string, style: DateStyle) {
  if (style === "medium") {
    const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
    return (value: string) => format.format(new Date(value));
  }
  const options: Intl.DateTimeFormatOptions = {
    month: locale === "ru" ? "long" : "short",
    day: "numeric",
    timeZone: "UTC",
  };
  const withinYear = new Intl.DateTimeFormat(locale, options);
  const withYear = new Intl.DateTimeFormat(locale, { ...options, year: "numeric" });
  return (value: string) => {
    const date = new Date(value);
    const format = date.getUTCFullYear() === new Date().getUTCFullYear() ? withinYear : withYear;
    return format.format(date);
  };
}

export function useDisplayDate(style: DateStyle = "medium") {
  const { locale } = useI18n();
  const format = computed(() => createDisplayDate(locale.value, style));
  return (value: string) => format.value(value);
}
