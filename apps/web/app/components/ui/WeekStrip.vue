<script setup lang="ts">
/** The next seven days of reviews. Each day shows how many ReviewItems come due. */
const props = defineProps<{
  days: { label: string; date: string; count: number; today?: boolean }[];
}>();
const peak = computed(() => Math.max(1, ...props.days.map((d) => d.count)));
</script>
<template>
  <ol class="s-week" :aria-label="$t('review.week')">
    <li
      v-for="d in days"
      :key="d.date"
      class="s-week__day"
      :class="{ 'is-today': d.today, 'is-empty': !d.count }"
    >
      <span class="s-week__cells" aria-hidden="true">
        <i v-for="n in Math.min(peak, 6)" :key="n" :class="{ 'is-on': n <= d.count }" />
      </span>
      <span class="s-week__count" aria-hidden="true">{{ d.count }}</span>
      <span class="s-week__label" aria-hidden="true">{{ d.today ? $t("ui.today") : d.label }}</span>
      <span class="s-week__date" aria-hidden="true">{{ d.date }}</span>
      <span class="s-sr">{{
        $t("review.dueOn", {
          day: (d.today ? $t("ui.today") : d.label) + " " + d.date,
          count: d.count,
        })
      }}</span>
    </li>
  </ol>
</template>
<style scoped>
.s-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  list-style: none;
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-sm);
  background: var(--s-surface);
}
.s-week__day {
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: var(--s-3) var(--s-1);
}
.s-week__day + .s-week__day {
  border-left: 1px solid var(--s-line);
}
.s-week__day.is-today {
  background: var(--s-raised);
  box-shadow: inset 0 2px 0 var(--s-copper-fill);
}
.s-week__cells {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  min-height: 2.5rem;
  justify-content: flex-start;
}
.s-week__cells i {
  width: 1rem;
  height: 0.3125rem;
  border-radius: 1px;
  background: var(--s-line);
}
.s-week__cells i.is-on {
  background: var(--s-copper-fill);
}
.s-week__count {
  font: 600 var(--s-text-md) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.s-week__day.is-empty .s-week__count {
  color: var(--s-ink-3);
}
.s-week__label,
.s-week__date {
  font: 500 var(--s-text-2xs) / 1.2 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-week__day.is-today .s-week__label {
  color: var(--s-copper);
}
.s-week__date {
  text-transform: none;
}
</style>
