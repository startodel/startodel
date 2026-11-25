export function practiceFailure(status: unknown, t: (key: string) => string) {
  if (status === 409) return { stale: true, message: t("review.stale") };
  if (status === 400) return { stale: false, message: t("review.invalid") };
  return { stale: false, message: t("review.saveError") };
}
