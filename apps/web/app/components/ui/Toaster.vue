<script setup lang="ts">
const { toasts, dismiss } = useToast();
</script>
<template>
  <TransitionGroup tag="div" name="s-toaster" class="s-toaster" aria-live="polite">
    <UiToast
      v-for="t in toasts"
      :key="t.id"
      :tone="t.tone"
      :title="t.title"
      :text="t.text"
      @dismiss="dismiss(t.id)"
    />
  </TransitionGroup>
</template>
<style scoped>
.s-toaster {
  position: fixed;
  right: var(--s-4);
  bottom: var(--s-4);
  z-index: var(--s-z-toast);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--s-2);
  max-width: calc(100vw - var(--s-8));
  pointer-events: none;
}
.s-toaster > * {
  pointer-events: auto;
}
.s-toaster-enter-active,
.s-toaster-leave-active,
.s-toaster-move {
  transition:
    opacity var(--s-dur-2) var(--s-ease),
    translate var(--s-dur-2) var(--s-ease);
}
.s-toaster-enter-from,
.s-toaster-leave-to {
  opacity: 0;
  translate: 0 var(--s-2);
}
</style>
