<script setup lang="ts">
import type { IconName } from "./icons";
const props = withDefaults(
  defineProps<{
    tone?: "neutral" | "info" | "success" | "warning" | "danger";
    title?: string;
    icon?: IconName;
  }>(),
  { tone: "neutral" },
);
const glyph = computed<IconName>(
  () =>
    props.icon ??
    (
      {
        neutral: "info",
        info: "info",
        success: "check",
        warning: "gotcha",
        danger: "alert",
      } as const
    )[props.tone],
);
</script>
<template>
  <div class="s-notice" :class="'s-notice--' + tone" :role="tone === 'danger' ? 'alert' : 'status'">
    <UiIcon :name="glyph" class="s-notice__icon" />
    <div class="s-notice__body">
      <strong v-if="title" class="s-notice__title">{{ title }}</strong>
      <div v-if="$slots.default" class="s-notice__text"><slot /></div>
    </div>
    <div v-if="$slots.actions" class="s-notice__actions"><slot name="actions" /></div>
  </div>
</template>
<style scoped>
.s-notice {
  --_ink: var(--s-ink-2);
  --_soft: var(--s-surface);
  --_line: var(--s-line-strong);
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-4);
  border: 1px solid var(--_line);
  border-left-width: 3px;
  border-radius: var(--s-radius-sm);
  background: var(--_soft);
  font-size: var(--s-text-sm);
}
.s-notice--info {
  --_ink: var(--s-steel);
  --_soft: var(--s-steel-soft);
  --_line: var(--s-steel-line);
}
.s-notice--success {
  --_ink: var(--s-verdigris);
  --_soft: var(--s-verdigris-soft);
  --_line: var(--s-verdigris-line);
}
.s-notice--warning {
  --_ink: var(--s-brass);
  --_soft: var(--s-brass-soft);
  --_line: var(--s-brass-line);
}
.s-notice--danger {
  --_ink: var(--s-oxide);
  --_soft: var(--s-oxide-soft);
  --_line: var(--s-oxide-line);
}
.s-notice__icon {
  margin-top: 0.15rem;
  color: var(--_ink);
}
.s-notice__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.125rem;
}
.s-notice__title {
  font-weight: 600;
  color: var(--_ink);
}
.s-notice__text {
  color: var(--s-ink);
}
.s-notice__actions {
  display: flex;
  gap: var(--s-2);
  align-self: center;
}
</style>
