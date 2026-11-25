export function useLearningLabels() {
  const { t } = useI18n();
  return {
    masteryLabel: (level: number) => t(`mastery.level${level}`),
    verdictLabel: (verdict: string) => t(`verdict.${verdict}`),
  };
}
