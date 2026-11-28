/** The prompt that asks the agent to build the first Track, with the Owner's goals filled in. */
export function useFirstTrackPrompt() {
  const { t } = useI18n();
  const me = useMe();
  const goalLabels = useGoalLabels();
  return computed(() => {
    const profile = me.value?.profile;
    const goals = profile?.goals.map((goal) => goalLabels.value.get(goal) ?? goal).join(", ");
    return t("next.buildPrompt", { goals: goals || profile?.stack.join(", ") || t("next.goals") });
  });
}
