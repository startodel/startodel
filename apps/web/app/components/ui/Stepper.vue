<script setup lang="ts">
/**
 * The steps of a short flow, such as onboarding. Completed steps can be revisited. Steps ahead
 * are shown but cannot be pressed.
 */
const props = defineProps<{
  steps: { id: string; label: string; hint?: string }[];
  label?: string;
}>();
const current = defineModel<string>({ required: true });
const at = computed(() => props.steps.findIndex((s) => s.id === current.value));
</script>
<template>
  <nav class="s-stepper" :aria-label="label ?? $t('ui.steps')">
    <ol class="s-stepper__list">
      <li
        v-for="(step, i) in steps"
        :key="step.id"
        class="s-stepper__step"
        :class="{ 'is-done': i < at, 'is-current': i === at }"
      >
        <button
          type="button"
          class="s-stepper__button"
          :disabled="i > at"
          :aria-current="i === at ? 'step' : undefined"
          @click="current = step.id"
        >
          <span class="s-stepper__pad" aria-hidden="true">
            <UiIcon v-if="i < at" name="check" :size="12" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span class="s-stepper__text">
            <span class="s-stepper__label">{{ step.label }}</span>
            <span v-if="step.hint" class="s-stepper__hint">{{ step.hint }}</span>
          </span>
          <span class="s-sr">{{
            i < at ? ", " + $t("ui.stepDone") : i === at ? ", " + $t("ui.stepCurrent") : ""
          }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>
<style scoped>
.s-stepper {
  container: s-stepper / inline-size;
}
.s-stepper__list {
  display: flex;
  list-style: none;
}
.s-stepper__step {
  position: relative;
  flex: 1;
  min-width: 0;
}
/* The trace between two steps. It turns to copper once the step before it is done. */
.s-stepper__step + .s-stepper__step::before {
  content: "";
  position: absolute;
  top: 0.75rem;
  right: calc(100% - 0.25rem);
  width: calc(100% - 2.25rem);
  border-top: 1.5px dashed var(--s-line-strong);
}
.s-stepper__step.is-done + .s-stepper__step::before {
  border-top: 2px solid var(--s-copper-fill);
}
.s-stepper__button {
  display: grid;
  justify-items: start;
  gap: var(--s-2);
  width: 100%;
  padding-right: var(--s-3);
  text-align: left;
  color: var(--s-ink-3);
}
.s-stepper__button:disabled {
  cursor: default;
}
.s-stepper__pad {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1.5px solid var(--s-line-strong);
  border-radius: 50%;
  background: var(--s-bg);
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
}
.is-done .s-stepper__pad {
  border-color: var(--s-copper-fill);
  background: var(--s-copper-fill);
  color: var(--s-on-copper);
}
.is-current .s-stepper__pad {
  border-color: var(--s-ink);
  color: var(--s-ink);
  box-shadow:
    0 0 0 3px var(--s-bg),
    0 0 0 4px var(--s-copper-fill);
}
.s-stepper__text {
  display: grid;
  gap: 0.125rem;
  min-width: 0;
}
.s-stepper__label {
  font-size: var(--s-text-sm);
  font-weight: 600;
}
.is-done .s-stepper__label {
  color: var(--s-ink-2);
}
.is-current .s-stepper__label {
  color: var(--s-ink);
}
.s-stepper__hint {
  font-size: var(--s-text-xs);
}
@container s-stepper (max-width: 30rem) {
  .s-stepper__hint {
    display: none;
  }
  .s-stepper__label {
    font-size: var(--s-text-xs);
  }
}
</style>
