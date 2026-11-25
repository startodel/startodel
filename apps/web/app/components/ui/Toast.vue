<script setup lang="ts">
import type { IconName } from "./icons";
/** The look of one toast, for documentation. To show a toast, call useToast().push(). */
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
