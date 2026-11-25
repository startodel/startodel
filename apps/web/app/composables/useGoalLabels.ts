export function useGoalLabels() {
  const { t } = useI18n();
  return computed(
    () =>
      new Map([
        ["Prepare for interviews", t("onboarding.interviews")],
        ["Get better at my current job", t("onboarding.job")],
        ["Learn a new technology", t("onboarding.technology")],
        ["Understand internals", t("onboarding.internals")],
      ]),
  );
}
