<script setup lang="ts">
import {
  ToastClose,
  ToastDescription,
  ToastPortal,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from "reka-ui";
import type { IconName } from "./icons";
/** Renders the toast queue. It must sit inside UiRoot, which provides the toast context. */
const { toasts, dismiss } = useToast();
const icons: Record<string, IconName> = {
  neutral: "info",
  success: "check",
  warning: "gotcha",
  danger: "alert",
};
const layer = useLayer();
</script>
<template>
  <ToastRoot
    v-for="t in toasts"
    :key="t.id"
    class="s-toast"
    :class="'s-toast--' + t.tone"
    :type="t.tone === 'danger' ? 'foreground' : 'background'"
    :duration="t.timeout > 0 ? t.timeout : Infinity"
    @update:open="$event || dismiss(t.id)"
  >
    <span class="s-toast__icon"><UiIcon :name="icons[t.tone]!" :size="14" /></span>
    <div class="s-toast__body">
      <ToastTitle class="s-toast__title">{{ t.title }}</ToastTitle>
      <ToastDescription v-if="t.text" class="s-toast__text">{{ t.text }}</ToastDescription>
    </div>
    <ToastClose class="s-toast__close" :aria-label="$t('ui.dismiss')"
      ><UiIcon name="x" :size="14"
    /></ToastClose>
  </ToastRoot>
  <ToastPortal :to="layer">
    <ToastViewport class="s-toaster" />
  </ToastPortal>
</template>
<style>
.s-root .s-toaster {
  position: fixed;
  right: var(--s-4);
  bottom: var(--s-4);
  z-index: var(--s-z-toast);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--s-2);
  width: min(22.5rem, calc(100vw - var(--s-8)));
  margin: 0;
  padding: 0;
  list-style: none;
  outline: none;
}
.s-root .s-toast {
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
.s-root .s-toast--success {
  --_ink: var(--s-verdigris);
}
.s-root .s-toast--warning {
  --_ink: var(--s-brass);
}
.s-root .s-toast--danger {
  --_ink: var(--s-oxide);
}
.s-root .s-toast__icon {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid currentColor;
  border-radius: 50%;
  color: var(--_ink);
}
.s-root .s-toast__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 0.125rem;
  padding-top: 0.125rem;
}
.s-root .s-toast__title {
  font-weight: 600;
}
.s-root .s-toast__text {
  color: var(--s-ink-2);
}
.s-root .s-toast__close {
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--s-radius-xs);
  color: var(--s-ink-3);
}
.s-root button.s-toast__close:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-root .s-toast[data-swipe="move"] {
  translate: var(--reka-toast-swipe-move-x) 0;
}
.s-root .s-toast[data-swipe="end"] {
  translate: 110% 0;
  transition: translate var(--s-dur-2) var(--s-ease-in);
}
.s-root .s-toast[data-state="open"] {
  animation: s-toast-in var(--s-dur-2) var(--s-ease);
}
.s-root .s-toast[data-state="closed"] {
  animation: s-toast-out var(--s-dur-1) var(--s-ease-in);
}
@keyframes s-toast-in {
  from {
    opacity: 0;
    translate: 0 var(--s-2);
  }
}
@keyframes s-toast-out {
  to {
    opacity: 0;
  }
}
</style>
