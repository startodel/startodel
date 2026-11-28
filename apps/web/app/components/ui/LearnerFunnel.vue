<script setup lang="ts">
import { NuxtLinkLocale } from "#components";
import type { FunnelStep } from "./analytics";
import { usePercent } from "./analytics";
/**
 * How far learners get, step by step. Each bar is drawn against the first step, with the share
 * lost since the step before. The largest loss is marked with a shape and words.
 */
const props = withDefaults(defineProps<{ steps: FunnelStep[]; kind?: "topic" | "lesson" }>(), {
  kind: "topic",
});
const { t, n } = useI18n();
const indexTag = useIndexTag();
const percent = usePercent();
const rows = computed(() => {
  const first = props.steps[0]?.learners ?? 0;
  const rows = props.steps.map((step, i) => {
    const before = props.steps[i - 1]?.learners;
    return {
      ...step,
      tag: indexTag(props.kind, i + 1),
      share: first ? Math.min(step.learners / first, 1) : 0,
      before: first && before !== undefined ? Math.min(before / first, 1) : undefined,
      lost: before ? Math.max(1 - step.learners / before, 0) : undefined,
      biggest: false,
    };
  });
  const worst = rows.reduce<(typeof rows)[number] | undefined>(
    (worst, row) => ((row.lost ?? 0) > (worst?.lost ?? 0) ? row : worst),
    undefined,
  );
  if (worst) worst.biggest = true;
  return rows;
});
</script>
<template>
  <div class="s-funnel">
    <p class="s-funnel__head" aria-hidden="true">
      <span>{{ kind === "topic" ? t("analytics.stepTopic") : t("analytics.stepLesson") }}</span>
      <span class="s-funnel__num">{{ t("analytics.reached") }}</span>
      <span class="s-funnel__num">{{ t("analytics.lost") }}</span>
    </p>
    <ol class="s-funnel__rows" :aria-label="t('analytics.funnel')">
      <li
        v-for="row in rows"
        :key="row.id"
        class="s-funnel__row"
        :class="{ 'is-biggest': row.biggest }"
      >
        <span class="s-funnel__tag">{{ row.tag }}</span>
        <component :is="row.to ? NuxtLinkLocale : 'span'" :to="row.to" class="s-funnel__title">{{
          row.title
        }}</component>
        <span class="s-funnel__bar" aria-hidden="true">
          <i class="s-funnel__fill" :style="{ width: row.share * 100 + '%' }" /><i
            v-if="row.before !== undefined && row.before > row.share"
            class="s-funnel__gone"
            :style="{ width: (row.before - row.share) * 100 + '%' }"
          />
        </span>
        <span class="s-funnel__count"
          >{{ n(row.learners) }}{{ " "
          }}<span class="s-funnel__word">{{ t("analytics.reachedWord") }}</span></span
        >
        <span class="s-funnel__lost">
          <template v-if="row.lost !== undefined"
            >{{ t("analytics.minus", { n: percent(row.lost) }) }}{{ " "
            }}<span class="s-funnel__word">{{ t("analytics.lostWord") }}</span></template
          >
        </span>
        <span v-if="row.biggest" class="s-funnel__mark">
          <UiBadge tone="brass" variant="outline" icon="sort-down">{{
            t("analytics.biggestDrop")
          }}</UiBadge>
        </span>
      </li>
    </ol>
  </div>
</template>
<style scoped>
.s-funnel {
  --_cols: 2.25rem minmax(9rem, 1.1fr) minmax(6rem, 1.6fr) 4rem 4rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  container: s-funnel / inline-size;
}
.s-funnel__head {
  display: grid;
  grid-template-columns: var(--_cols);
  gap: var(--s-3);
  padding-bottom: var(--s-2);
  border-bottom: 1px solid var(--s-line-strong);
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-funnel__head > :first-child {
  grid-column: 1 / 4;
}
.s-funnel__num {
  text-align: right;
}
.s-funnel__rows {
  list-style: none;
}
.s-funnel__row {
  display: grid;
  grid-template-columns: var(--_cols);
  align-items: center;
  gap: var(--s-1) var(--s-3);
  padding: var(--s-3) 0;
  border-bottom: 1px solid var(--s-line);
}
.s-funnel__tag {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  color: var(--s-ink-3);
}
.s-funnel__title {
  min-width: 0;
  font-size: var(--s-text-sm);
  font-weight: 600;
  line-height: 1.3;
  color: var(--s-ink);
  text-decoration: none;
  overflow-wrap: anywhere;
}
a.s-funnel__title:hover {
  text-decoration: underline;
  text-decoration-color: var(--s-copper-fill);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.2em;
}
.s-funnel__bar {
  display: flex;
  height: 0.75rem;
  border-radius: 1px;
  background: var(--s-sunken);
}
.s-funnel__fill {
  min-width: 2px;
  border-radius: 1px 0 0 1px;
  background: var(--s-ink-2);
}
/* What the previous step still had: an empty outline, so the loss reads as a shape. */
.s-funnel__gone {
  border: 1px dashed var(--s-line-strong);
  border-left: 0;
}
.s-funnel__row.is-biggest .s-funnel__gone {
  border-style: solid;
  border-color: var(--s-brass);
  background: var(--s-brass-soft);
}
.s-funnel__count,
.s-funnel__lost {
  text-align: right;
  font: 600 var(--s-text-sm) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink);
}
.s-funnel__lost {
  font-weight: 500;
  color: var(--s-ink-2);
}
.s-funnel__row.is-biggest .s-funnel__lost {
  font-weight: 600;
  color: var(--s-brass);
}
/* The words name the numbers where the column heads are gone. */
.s-funnel__word {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.s-funnel__mark {
  grid-column: 2 / -1;
}
@container s-funnel (max-width: 34rem) {
  .s-funnel__head {
    display: none;
  }
  .s-funnel__rows {
    border-top: 1px solid var(--s-line-strong);
  }
  .s-funnel__row {
    grid-template-columns: 2.25rem minmax(0, 1fr) auto;
    grid-template-areas:
      "tag title title"
      ". bar bar"
      ". count lost"
      ". mark mark";
  }
  .s-funnel__tag {
    grid-area: tag;
    align-self: baseline;
  }
  .s-funnel__title {
    grid-area: title;
  }
  .s-funnel__bar {
    grid-area: bar;
    margin: var(--s-1) 0;
  }
  .s-funnel__count {
    grid-area: count;
    text-align: left;
  }
  .s-funnel__lost {
    grid-area: lost;
  }
  .s-funnel__mark {
    grid-area: mark;
  }
  .s-funnel__word {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
    clip-path: none;
    font-family: var(--s-font-ui);
    font-stretch: normal;
    font-weight: 400;
    font-size: var(--s-text-xs);
    color: var(--s-ink-3);
  }
}
</style>
