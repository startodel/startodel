import type { TopicState } from "../components/ui/board";
import type { VerdictState } from "../components/ui/Verdict.vue";

/** The words for the states the design system draws: a Verdict pad and a Topic on the board. */
export function useStateWords() {
  const { t } = useI18n();
  return {
    verdictWord: (state: VerdictState) =>
      state === "pending"
        ? t("ui.verdictPending")
        : state === "none"
          ? t("ui.verdictNone")
          : t(`verdict.${state}`),
    topicWord: (state: TopicState) => t(`topicState.${state}`),
  };
}
