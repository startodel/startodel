export type IndexTag = (kind: "topic" | "lesson" | "block", ordinal: number) => string;

export function useIndexTag(): IndexTag {
  const { t } = useI18n();
  return (kind, ordinal) => t(`indexPrefix.${kind}`) + String(ordinal).padStart(2, "0");
}
