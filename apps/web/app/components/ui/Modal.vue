<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from "reka-ui";
/**
 * A dialog. It traps focus, closes on Escape and returns focus to the control that opened it.
 * Use it only for a decision the learner must make before going on.
 */
withDefaults(
  defineProps<{
    title: string;
    /** One sentence under the title. Screen readers announce it when the dialog opens. */
    description?: string;
    size?: "sm" | "md";
    /** Render the panel in the page flow. For documentation only. */
    inline?: boolean;
  }>(),
  { size: "md" },
);
const open = defineModel<boolean>("open", { default: false });
const layer = useLayer();
</script>
<template>
  <div
    v-if="inline"
    class="s-modal s-modal--inline"
    :class="'s-modal--' + size"
    role="group"
    :aria-label="title"
  >
    <header class="s-modal__header">
      <h2 class="s-modal__title">{{ title }}</h2>
      <span class="s-modal__close" aria-hidden="true"><UiIcon name="x" /></span>
    </header>
    <div class="s-modal__body">
      <p v-if="description" class="s-modal__description">{{ description }}</p>
      <slot />
    </div>
    <footer v-if="$slots.footer" class="s-modal__footer"><slot name="footer" /></footer>
  </div>
  <DialogRoot v-else v-model:open="open">
    <DialogPortal :to="layer">
      <DialogOverlay class="s-modal__scrim" />
      <DialogContent
        class="s-modal"
        :class="'s-modal--' + size"
        :aria-describedby="description ? undefined : ''"
      >
        <header class="s-modal__header">
          <DialogTitle class="s-modal__title">{{ title }}</DialogTitle>
          <DialogClose class="s-modal__close" :aria-label="$t('ui.close')"
            ><UiIcon name="x"
          /></DialogClose>
        </header>
        <div class="s-modal__body">
          <DialogDescription v-if="description" class="s-modal__description">{{
            description
          }}</DialogDescription>
          <slot />
        </div>
        <footer v-if="$slots.footer" class="s-modal__footer"><slot name="footer" /></footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
<style>
.s-root .s-modal__scrim {
  position: fixed;
  inset: 0;
  background: var(--s-scrim);
}
.s-root .s-modal__scrim[data-state="open"] {
  animation: s-fade-in var(--s-dur-2) var(--s-ease);
}
.s-root .s-modal {
  --_w: 32rem;
  position: fixed;
  top: 50%;
  left: 50%;
  display: flex;
  flex-direction: column;
  width: min(var(--_w), calc(100vw - var(--s-8)));
  max-height: calc(100dvh - var(--s-8));
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  background: var(--s-raised);
  color: var(--s-ink);
  box-shadow: var(--s-shadow-3);
  overflow: hidden;
  translate: -50% -50%;
}
.s-root .s-modal[data-state="open"] {
  animation: s-modal-in var(--s-dur-3) var(--s-ease);
}
.s-root .s-modal--sm {
  --_w: 24rem;
}
.s-root .s-modal--inline {
  position: static;
  width: min(var(--_w), 100%);
  translate: none;
}
@keyframes s-modal-in {
  from {
    opacity: 0;
    translate: -50% calc(-50% + var(--s-3));
  }
}
@keyframes s-fade-in {
  from {
    opacity: 0;
  }
}
.s-root .s-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-4) var(--s-4) var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--s-line);
}
.s-root .s-modal__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
}
.s-root .s-modal__close {
  display: grid;
  place-items: center;
  width: var(--s-control-sm);
  height: var(--s-control-sm);
  border-radius: var(--s-radius-sm);
  color: var(--s-ink-3);
}
.s-root button.s-modal__close:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-root .s-modal__body {
  display: grid;
  gap: var(--s-4);
  padding: var(--s-5);
  overflow-y: auto;
  color: var(--s-ink-2);
}
.s-root .s-modal__description {
  color: var(--s-ink-2);
}
.s-root .s-modal__footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-5);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
</style>
