/** File sizes written in the active locale. Units are decimal: 1 GB is 1000 MB. */
const units = ["kilobyte", "megabyte", "gigabyte", "terabyte"] as const;
export type FileUnit = (typeof units)[number];
export type FileKind = "video" | "image" | "document" | "archive";

/** The largest unit that keeps the number at one or above. Nothing is written in bytes. */
export function fileUnit(bytes: number): FileUnit {
  const power = Math.floor(Math.log10(Math.max(bytes, 1)) / 3);
  return units[Math.min(Math.max(power, 1), units.length) - 1]!;
}

export function createFileSize(locale: string) {
  /** `unit` pins the unit so that two sizes read against each other. `bare` leaves the unit out. */
  return (bytes: number, unit: FileUnit = fileUnit(bytes), bare = false) => {
    const value = bytes / 1000 ** (units.indexOf(unit) + 1);
    return new Intl.NumberFormat(locale, {
      ...(bare ? {} : { style: "unit", unit, unitDisplay: "short" }),
      maximumFractionDigits: value < 100 ? 1 : 0,
    }).format(value);
  };
}

export function useFileSize() {
  const { locale } = useI18n();
  const format = computed(() => createFileSize(locale.value));
  return (bytes: number, unit?: FileUnit, bare?: boolean) => format.value(bytes, unit, bare);
}
