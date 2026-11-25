<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    label: string;
    /** Draw one cell per unit instead of a continuous bar. */
    segmented?: boolean;
    tone?: "copper" | "verdigris" | "neutral";
    size?: "sm" | "md";
    showValue?: boolean;
  }>(),
  { max: 100, tone: "copper", size: "md" },
);
const ratio = computed(() =>
  props.max > 0 ? Math.min(Math.max(props.value / props.max, 0), 1) : 0,
);
const cells = computed(() => (props.segmented ? Math.min(Math.max(props.max, 1), 60) : 0));
</script>
<template>
  <div class="s-progress" :class="['s-progress--' + tone, 's-progress--' + size]">
    <div
      class="s-progress__track"
      role="progressbar"
      :aria-label="label"
      :aria-valuenow="value"
      aria-valuemin="0"
      :aria-valuemax="max"
    >
      <template v-if="segmented">
        <i v-for="n in cells" :key="n" class="s-progress__cell" :class="{ 'is-on': n <= value }" />
      </template>
      <i v-else class="s-progress__fill" :style="{ width: ratio * 100 + '%' }" />
    </div>
    <span v-if="showValue" class="s-progress__value">
      <slot name="value">{{
        segmented ? `${value} / ${max}` : `${Math.round(ratio * 100)}%`
      }}</slot>
    </span>
  </div>
</template>
<style scoped>
.s-progress {
  --_fill: var(--s-copper-fill);
  --_h: 0.375rem;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
}
.s-progress--sm {
  --_h: 0.25rem;
}
.s-progress--verdigris {
  --_fill: var(--s-verdigris);
}
.s-progress--neutral {
  --_fill: var(--s-ink-2);
}
.s-progress__track {
  flex: 1;
  display: flex;
  gap: 2px;
  height: var(--_h);
  min-width: 2rem;
  border-radius: 1px;
  background: var(--s-line);
  overflow: hidden;
}
.s-progress__track:has(.s-progress__cell) {
  background: none;
}
.s-progress__fill {
  display: block;
  height: 100%;
  background: var(--_fill);
  transition: width var(--s-dur-3) var(--s-ease);
}
.s-progress__cell {
  flex: 1;
  min-width: 2px;
  border-radius: 1px;
  background: var(--s-line);
}
.s-progress__cell.is-on {
  background: var(--_fill);
}
.s-progress__value {
  flex: none;
  min-width: 2.5rem;
  text-align: right;
  font: 500 var(--s-text-xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  color: var(--s-ink-2);
}
</style>
