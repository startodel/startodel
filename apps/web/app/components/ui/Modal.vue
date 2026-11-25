<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string;
    size?: "sm" | "md";
    /** Render the panel in the page flow. For documentation only. */
    inline?: boolean;
  }>(),
  { size: "md" },
);
const open = defineModel<boolean>("open", { default: false });
const dialog = ref<HTMLDialogElement>();
const titleId = useId();
function sync() {
  const element = dialog.value;
  if (!element || props.inline) return;
  if (open.value && !element.open) element.showModal();
  if (!open.value && element.open) element.close();
}
onMounted(sync);
watch(open, sync, { flush: "post" });
</script>
<template>
  <component
    :is="inline ? 'div' : 'dialog'"
    ref="dialog"
    class="s-modal"
    :class="['s-modal--' + size, { 's-modal--inline': inline }]"
    :role="inline ? 'group' : undefined"
    :aria-labelledby="titleId"
    @close="open = false"
    @click="$event.target === dialog && (open = false)"
  >
    <div class="s-modal__panel">
      <header class="s-modal__header">
        <h2 :id="titleId" class="s-modal__title">{{ title }}</h2>
        <button type="button" class="s-modal__close" aria-label="Close" @click="open = false">
          <UiIcon name="x" />
        </button>
      </header>
      <div class="s-modal__body"><slot /></div>
      <footer v-if="$slots.footer" class="s-modal__footer"><slot name="footer" /></footer>
    </div>
  </component>
</template>
<style scoped>
.s-modal {
  --_w: 32rem;
  width: min(var(--_w), calc(100vw - var(--s-8)));
  max-width: none;
  max-height: calc(100dvh - var(--s-8));
  padding: 0;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-lg);
  background: var(--s-raised);
  color: var(--s-ink);
  box-shadow: var(--s-shadow-3);
  overflow: hidden;
}
.s-modal--sm {
  --_w: 24rem;
}
.s-modal--inline {
  width: min(var(--_w), 100%);
}
.s-modal::backdrop {
  background: var(--s-scrim);
}
.s-modal[open] {
  animation: s-modal-in var(--s-dur-3) var(--s-ease);
}
@keyframes s-modal-in {
  from {
    opacity: 0;
    translate: 0 var(--s-3);
  }
}
.s-modal__panel {
  display: flex;
  flex-direction: column;
  max-height: inherit;
}
.s-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding: var(--s-4) var(--s-4) var(--s-4) var(--s-5);
  border-bottom: 1px solid var(--s-line);
}
.s-modal__title {
  font-size: var(--s-text-lg);
  font-weight: 600;
}
.s-modal__close {
  display: grid;
  place-items: center;
  width: var(--s-control-sm);
  height: var(--s-control-sm);
  border-radius: var(--s-radius-sm);
  color: var(--s-ink-3);
}
.s-modal__close:hover {
  background: var(--s-sunken);
  color: var(--s-ink);
}
.s-modal__body {
  padding: var(--s-5);
  overflow-y: auto;
  color: var(--s-ink-2);
}
.s-modal__footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-5);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
</style>
