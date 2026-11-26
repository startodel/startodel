export function useLearningLabels() {
  const { t } = useI18n();
  const activities = computed(() => ({
    "Lesson read": t("activity.lesson"),
    "Quiz attempt": t("activity.quiz"),
    "Grill answer": t("activity.answer"),
    "Grill verdict": t("activity.verdict"),
    "Review result": t("activity.review"),
    Mastery: t("activity.mastery"),
  }));
  return {
    activityLabel: (kind: keyof typeof activities.value) => activities.value[kind],
    masteryLabel: (level: number) => t(`mastery.level${level}`),
    verdictLabel: (verdict: string) => t(`verdict.${verdict}`),
  };
}
