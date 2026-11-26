type Scheduled = { dueAt: string; box: number };

export function useReviewSchedule(
  source: () => { due: Scheduled[]; upcoming: Scheduled[] } | undefined,
) {
  const { locale } = useI18n();
  const today = useState("review-calendar-day", () => new Date().toISOString().slice(0, 10));
  onMounted(() => {
    today.value = new Date().toISOString().slice(0, 10);
  });
  const items = computed(() => {
    const reviews = source();
    return reviews ? [...reviews.due, ...reviews.upcoming] : [];
  });
  const boxes = computed(() => {
    const counts = [0, 0, 0, 0, 0];
    for (const { box } of items.value) counts[box] = counts[box]! + 1;
    return counts;
  });
  const week = computed(() => {
    const weekday = new Intl.DateTimeFormat(locale.value, { weekday: "short", timeZone: "UTC" });
    const start = Date.parse(today.value);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start + i * 86400000);
      const date = day.toISOString().slice(0, 10);
      return {
        label: weekday.format(day),
        date: String(day.getUTCDate()),
        today: i === 0,
        count: items.value.filter((item) => item.dueAt.slice(0, 10) === date).length,
      };
    });
  });
  return { boxes, week };
}
