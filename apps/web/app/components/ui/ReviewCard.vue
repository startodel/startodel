<script setup lang="ts">
/**
 * A ReviewItem: a Topic that is due or coming due. It shows the Review Box, the Mastery and
 * the latest result. Put the actions in the actions slot.
 */
const formatInterval = useReviewInterval();
const props = defineProps<{
  title: string;
  tag?: string;
  /** The Track the Topic belongs to, when the list spans several. */
  track?: string;
  level: number;
  /** The Review Box, 0 to 4. */
  box: number;
  /** When it is due, in words. */
  due: string;
  overdue?: boolean;
  lastResult?: "strong" | "partial" | "weak" | null;
  /** Why the Topic is scheduled, when the agent gave a reason. */
  reason?: string | null;
}>();
const interval = computed(() => formatInterval(props.box));
</script>
<template>
  <article class="s-review" :class="{ 'is-overdue': overdue }">
    <div class="s-review__box">
      <span class="s-review__pips" aria-hidden="true"
        ><i v-for="n in 5" :key="n" :class="{ 'is-on': n - 1 <= box }"
      /></span>
      <span class="s-review__box-name" aria-hidden="true">{{ interval }}</span>
      <span class="s-sr">{{ $t("review.boxFull", { interval }) }}</span>
    </div>
    <div class="s-review__main">
      <p class="s-review__meta">
        <span v-if="tag">{{ tag }}</span>
        <span class="s-review__due"><UiIcon name="clock" :size="11" />{{ due }}</span>
        <span v-if="track" class="s-review__track">{{ track }}</span>
      </p>
      <h3 class="s-review__title">{{ title }}</h3>
      <p class="s-review__state">
        <UiMastery :level="level" show="full" />
        <i18n-t
          v-if="lastResult"
          keypath="review.last"
          tag="span"
          class="s-review__last"
          scope="global"
        >
          <template #result><UiVerdict :verdict="lastResult" size="sm" /></template>
        </i18n-t>
      </p>
      <p v-if="reason" class="s-review__reason">{{ reason }}</p>
      <div v-if="$slots.default" class="s-review__extra"><slot /></div>
    </div>
    <div v-if="$slots.actions" class="s-review__actions"><slot name="actions" /></div>
  </article>
</template>
<style scoped>
.s-review {
  container: s-review / inline-size;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--s-4) var(--s-5);
  padding: var(--s-4) var(--s-5);
  border: 1px solid var(--s-line);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
}
.s-review.is-overdue {
  border-color: var(--s-line-strong);
  box-shadow: inset 3px 0 0 var(--s-brass);
}
.s-review__box {
  display: grid;
  justify-items: center;
  gap: var(--s-2);
  padding-top: 0.125rem;
}
.s-review__pips {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
}
.s-review__pips i {
  width: 1.5rem;
  height: 0.3125rem;
  border-radius: 1px;
  background: var(--s-line);
}
.s-review__pips i.is-on {
  background: var(--s-copper-fill);
}
.s-review__box-name,
.s-review__meta {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-review__box-name {
  text-transform: none;
  white-space: nowrap;
}
.s-review__main {
  display: grid;
  gap: var(--s-2);
  min-width: 0;
}
.s-review__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-1) var(--s-3);
}
.s-review__due {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--s-ink-2);
}
.is-overdue .s-review__due {
  color: var(--s-brass);
  font-weight: 600;
}
.s-review__track {
  text-transform: none;
  letter-spacing: 0.02em;
}
.s-review__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}
.s-review__state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-5);
}
.s-review__last {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--s-text-sm);
  color: var(--s-ink-3);
}
.s-review__reason {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-review__extra {
  margin-top: var(--s-2);
}
.s-review__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  justify-content: flex-end;
}
@container s-review (max-width: 34rem) {
  .s-review__actions {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
