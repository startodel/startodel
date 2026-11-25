<script setup lang="ts">
/** How many Topics sit at each Mastery level, 0 to 4. Each column is drawn in its level's colour. */
const props = defineProps<{ counts: number[]; label?: string }>();
const peak = computed(() => Math.max(1, ...props.counts));
const total = computed(() => props.counts.reduce((sum, n) => sum + n, 0));
const { masteryLabel } = useLearningLabels();
</script>
<template>
  <ol class="s-histogram" :aria-label="label ?? $t('progress.levels')">
    <li v-for="(count, level) in counts.slice(0, 5)" :key="level" class="s-histogram__col">
      <span class="s-histogram__count">{{ count }}</span>
      <span class="s-histogram__well" aria-hidden="true">
        <i :class="'is-l' + level" :style="{ height: (count / peak) * 100 + '%' }" />
      </span>
      <span class="s-histogram__level"><UiMastery :level="level" size="sm" /></span>
      <span class="s-histogram__name">{{ masteryLabel(level) }}</span>
      <span class="s-sr">{{
        $t("progress.share", { percent: total ? Math.round((count / total) * 100) : 0 })
      }}</span>
    </li>
  </ol>
</template>
<style scoped>
.s-histogram {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--s-3);
  list-style: none;
}
.s-histogram__col {
  display: grid;
  align-content: start;
  justify-items: center;
  gap: var(--s-2);
  min-width: 0;
}
.s-histogram__count {
  font: 600 var(--s-text-xl) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.03em;
}
.s-histogram__well {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 6rem;
  border-bottom: 1px solid var(--s-line-strong);
  background: repeating-linear-gradient(
    0deg,
    transparent 0 calc(25% - 1px),
    var(--s-line) calc(25% - 1px) 25%
  );
}
.s-histogram__well i {
  width: 100%;
  min-height: 2px;
  border-radius: 1px 1px 0 0;
}
.s-histogram__well .is-l0 {
  background: var(--s-mastery-0);
}
.s-histogram__well .is-l1 {
  background: var(--s-mastery-1);
}
.s-histogram__well .is-l2 {
  background: var(--s-mastery-2);
}
.s-histogram__well .is-l3 {
  background: var(--s-mastery-3);
}
.s-histogram__well .is-l4 {
  background: var(--s-mastery-4);
}
.s-histogram__name {
  font-size: var(--s-text-xs);
  color: var(--s-ink-3);
  text-align: center;
  overflow-wrap: anywhere;
}
</style>
