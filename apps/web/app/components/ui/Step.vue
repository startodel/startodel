<script setup lang="ts">
/** One instruction inside UiSteps. The title says what to do. The slot holds what it needs. */
defineProps<{ title: string; done?: boolean }>();
</script>
<template>
  <li class="s-step" :class="{ 'is-done': done }">
    <span class="s-step__pad" aria-hidden="true"
      ><UiIcon v-if="done" name="check" :size="12"
    /></span>
    <div class="s-step__body">
      <p class="s-step__title">
        {{ title }}<span v-if="done" class="s-sr">, {{ $t("ui.stepDone") }}</span>
      </p>
      <slot />
    </div>
  </li>
</template>
<style scoped>
.s-step {
  --_pad: 1.5rem;
  position: relative;
  display: grid;
  grid-template-columns: var(--_pad) minmax(0, 1fr);
  gap: var(--s-4);
  padding-bottom: var(--s-5);
  counter-increment: s-step;
}
.s-step:last-child {
  padding-bottom: 0;
}
/* The trace to the next step. */
.s-step:not(:last-child)::before {
  content: "";
  position: absolute;
  top: calc(var(--_pad) + var(--s-1));
  bottom: var(--s-1);
  left: calc(var(--_pad) / 2 - 0.75px);
  border-left: 1.5px dashed var(--s-line-strong);
}
.s-step.is-done:not(:last-child)::before {
  border-left: 1.5px solid var(--s-copper-fill);
}
.s-step__pad {
  display: grid;
  place-items: center;
  width: var(--_pad);
  height: var(--_pad);
  border: 1.5px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
  color: var(--s-ink-2);
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.s-step__pad:empty::before {
  content: counter(s-step);
}
.s-step.is-done .s-step__pad {
  border-color: var(--s-copper-fill);
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
}
.s-step__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--s-3);
  min-width: 0;
}
.s-step__title {
  min-height: var(--_pad);
  padding-top: 0.0625rem;
  line-height: 1.45;
  text-wrap: pretty;
}
</style>
