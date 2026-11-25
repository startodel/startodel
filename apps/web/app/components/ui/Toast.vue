<script setup lang="ts">
import type { IconName } from "./icons";
const props = withDefaults(
  defineProps<{
    tone?: "neutral" | "success" | "warning" | "danger";
    title: string;
    text?: string;
    dismissible?: boolean;
  }>(),
  { tone: "neutral", dismissible: true },
);
defineEmits<{ dismiss: [] }>();
const icon = computed<IconName>(
  () =>
    ({ neutral: "info", success: "check", warning: "gotcha", danger: "alert" } as const)[
      props.tone
    ],
);
</script>
<template>
  <div class="s-toast" :class="'s-toast--' + tone" :role="tone === 'danger' ? 'alert' : 'status'">
    <span class="s-toast__icon"><UiIcon :name="icon" :size="14" /></span>
    <div class="s-toast__body">
      <strong class="s-toast__title">{{ title }}</strong>
      <span v-if="text" class="s-toast__text">{{ text }}</span>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="s-toast__close"
      :aria-label="$t('ui.dismiss')"
      @click="$emit('dismiss')"
    >
      <UiIcon name="x" :size="14" />
    </button>
  </div>
</template>
<style scoped>
.s-toast {
  --_ink: var(--s-ink-2);
  display: flex;
  align-items: flex-start;
  gap: var(--s-3);
  width: min(22.5rem, 100%);
  padding: var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  box-shadow: var(--s-shadow-3);
  font-size: var(--s-text-sm);
}
.s-toast--success {
  --_ink: var(--s-verdigris);
}
.s-toast--warning {
  --_ink: var(--s-brass);
}
.s-toast--danger {
  --_ink: var(--s-oxide);
}
.s-toast__icon {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid currentColor;
  border-radius: 50%;
  color: var(--_ink);
}
.s-toast__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.125rem;
  padding-top: 0.125rem;
}
.s-toast__title {
  font-weight: 600;
}
.s-toast__text {
  color: var(--s-ink-2);
}
.s-toast__close {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-toast__close:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
</style>
