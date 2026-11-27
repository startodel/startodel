<script setup lang="ts">
import type { PublicProfile } from "@startodel/core";

const props = defineProps<{ activity: NonNullable<PublicProfile["heatmap"]> }>();
const { t, n, locale } = useI18n();
const calendar = computed(() => {
  const format = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale.value, { ...options, timeZone: "UTC" });
  const month = format({ month: "short" }),
    weekday = format({ weekday: "short" }),
    fullDate = format({ dateStyle: "long" });
  const counts = new Map(props.activity.days.map((d) => [d.date, d.count]));
  const dayMs = 86400000;
  const start = Date.parse(props.activity.through) - 363 * dayMs;
  const offset = (new Date(start).getUTCDay() + 6) % 7;
  const days = Array.from({ length: 364 }, (_, i) => {
    const day = new Date(start + i * dayMs);
    const date = day.toISOString().slice(0, 10);
    const count = counts.get(date) ?? 0;
    return {
      date,
      count,
      level: count === 0 ? 0 : count === 1 ? 1 : count < 4 ? 2 : count < 8 ? 3 : 4,
      column: 1 + Math.floor((i + offset) / 7),
      row: 2 + ((i + offset) % 7),
      month: day.getUTCDate() <= 7 && day.getUTCDay() === 1 ? month.format(day) : undefined,
      label: t("publicProfile.day", { date: fullDate.format(day), count: n(count) }),
    };
  });
  const weekdays = [0, 2, 4, 6].map((i) => ({
    row: i + 2,
    label: weekday.format(start + (i - offset) * dayMs),
  }));
  return { days, weekdays, weeks: days[363]!.column };
});
const scroll = useTemplateRef("scroll");
const focusDay = ref(363);
const hovered = ref<number>();
const focused = ref<number>();
const active = computed(() => calendar.value.days[hovered.value ?? focused.value ?? -1]);
const tip = useId();
onMounted(() => {
  if (scroll.value) scroll.value.scrollLeft = scroll.value.scrollWidth;
});
function navigate(event: KeyboardEvent, index: number) {
  const moves: Record<string, number> = {
    ArrowLeft: -7,
    ArrowRight: 7,
    ArrowUp: -1,
    ArrowDown: 1,
    Home: -363,
    End: 363,
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  const next = Math.max(0, Math.min(363, index + moves[event.key]!));
  scroll.value?.querySelector<HTMLElement>('[data-day="' + next + '"]')?.focus();
}
</script>
<template>
  <section class="s-heat s-stack">
    <UiSectionHeading :title="$t('publicProfile.activity')" />
    <div class="s-heat__panel">
      <div class="s-heat__summary">
        <strong>{{ $n(activity.total) }}</strong> {{ $t("publicProfile.period", activity.total) }}
      </div>
      <div class="s-heat__chart">
        <div class="s-heat__axis" aria-hidden="true">
          <span v-for="d in calendar.weekdays" :key="d.row" :style="{ gridRow: d.row }">{{
            d.label
          }}</span>
        </div>
        <div class="s-heat__scroll" ref="scroll">
          <div class="s-heat__grid" :style="{ '--weeks': calendar.weeks }">
            <template v-for="(day, i) in calendar.days" :key="day.date">
              <span
                v-if="day.month && day.column < calendar.weeks"
                class="s-heat__month"
                :style="{ gridColumn: day.column, gridRow: 1 }"
                aria-hidden="true"
                >{{ day.month }}</span
              >
              <button
                type="button"
                class="s-heat__cell"
                :data-day="i"
                :tabindex="focusDay === i ? 0 : -1"
                :aria-label="day.label"
                :aria-describedby="active?.date === day.date ? tip : undefined"
                :style="{
                  gridColumn: day.column,
                  gridRow: day.row,
                  '--intensity': 'var(--s-mastery-' + day.level + ')',
                }"
                @mouseenter="hovered = i"
                @mouseleave="hovered = undefined"
                @focus="
                  focusDay = i;
                  focused = i;
                "
                @blur="focused = undefined"
                @click="focused = i"
                @keydown="navigate($event, i)"
              />
            </template>
          </div>
        </div>
      </div>
      <div class="s-heat__foot">
        <span v-if="active" :id="tip" role="tooltip">{{ active.label }}</span>
        <span v-else>{{ $t("publicProfile.utc") }}</span>
        <span class="s-heat__legend"
          >{{ $t("publicProfile.less") }}
          <i
            v-for="i in 5"
            :key="i"
            :style="{ background: 'var(--s-mastery-' + (i - 1) + ')' }"
            aria-hidden="true"
          />
          {{ $t("publicProfile.more") }}
        </span>
      </div>
    </div>
  </section>
</template>
<style scoped>
.s-heat__panel {
  padding: var(--s-5);
  border: 1px solid var(--s-line);
  background: var(--s-surface);
  border-radius: var(--s-radius-md);
  min-width: 0;
}
.s-heat__summary {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--s-2);
  color: var(--s-ink-2);
  font-size: var(--s-text-sm);
}
.s-heat__summary strong {
  font: 600 var(--s-text-xl)/1.3 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink);
}
.s-heat__chart {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--s-2);
  margin-block: var(--s-4) var(--s-3);
}
.s-heat__axis,
.s-heat__grid {
  display: grid;
  grid-template-rows: 1.4rem repeat(7, 0.84rem);
  gap: 3px;
  align-items: center;
  padding-block: 3px;
  font: 400 var(--s-text-2xs)/1 var(--s-font-mono);
  font-stretch: 75%;
  color: var(--s-ink-3);
}
.s-heat__scroll {
  overflow-x: auto;
  min-width: 0;
}
.s-heat__grid {
  grid-template-columns: repeat(var(--weeks), minmax(0.84rem, 1fr));
  padding-inline: 3px;
  width: 100%;
  min-width: calc(var(--weeks) * (0.84rem + 3px) + 3px);
}
.s-heat__month {
  white-space: nowrap;
}
.s-heat__cell {
  display: block;
  width: 100%;
  height: 0.84rem;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 2px;
  background: var(--intensity);
  cursor: pointer;
}
.s-heat__cell:hover,
.s-heat__cell:focus-visible {
  outline: 2px solid var(--s-ink);
  outline-offset: 0;
}
.s-heat__foot,
.s-heat__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
}
.s-heat__legend {
  gap: 3px;
}
.s-heat__legend i {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 2px;
}
</style>
