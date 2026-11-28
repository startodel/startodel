/** What a portable Track file holds, as counts. */
export interface TrackContents {
  topics: number;
  lessons: number;
  quizzes: number;
  exercises: number;
  /** Media travels as links. Left out when the file carries none. */
  mediaLinks?: number;
}

/** The counts as words in the active locale, ready to be joined into one summary line. */
export function useTrackContents() {
  const { t } = useI18n();
  const countArgs = useCountArgs();
  return (contents: TrackContents) =>
    [
      t("count.topics", countArgs(contents.topics)),
      t("count.lessons", countArgs(contents.lessons)),
      t("trackContents.quizzes", countArgs(contents.quizzes)),
      t("trackContents.exercises", countArgs(contents.exercises)),
      contents.mediaLinks ? t("trackContents.mediaLinks", countArgs(contents.mediaLinks)) : "",
    ].filter(Boolean);
}
