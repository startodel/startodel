<script setup lang="ts">
/** A Callout Block. The icon and the word name its kind. The edge colour repeats it. */
const props = withDefaults(
  defineProps<{ kind?: "gotcha" | "production" | "tip"; showKind?: boolean }>(),
  {
    kind: "tip",
    showKind: true,
  },
);
const { t } = useI18n();
</script>
<template>
  <aside class="s-callout" :class="'s-callout--' + props.kind">
    <p v-if="showKind" class="s-callout__kind">
      <UiIcon :name="props.kind" :size="14" />{{ t(`callout.${props.kind}`) }}
    </p>
    <div class="s-callout__body"><slot /></div>
  </aside>
</template>
<style scoped>
.s-callout {
  --_tone: var(--s-verdigris);
  --_soft: var(--s-verdigris-soft);
  display: grid;
  gap: var(--s-2);
  padding: var(--s-4) var(--s-5);
  border-left: 3px solid var(--_tone);
  border-radius: 0 var(--s-radius-sm) var(--s-radius-sm) 0;
  background: var(--_soft);
}
.s-callout--gotcha {
  --_tone: var(--s-brass);
  --_soft: var(--s-brass-soft);
}
.s-callout--production {
  --_tone: var(--s-steel);
  --_soft: var(--s-steel-soft);
}
.s-callout__kind {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--_tone);
}
.s-callout__body :deep(.s-prose) {
  font-size: var(--s-text-lg);
  line-height: 1.6;
}
</style>
