<script setup lang="ts">
/**
 * The Next Step: the one thing to do now. It is the only live plate on a page. When the step
 * belongs to the agent, give the prompt and the card shows it ready to copy.
 */
defineProps<{
  title: string;
  kicker?: string;
  /** What kind of step it is, such as "Continue grill" or "Review". */
  kind?: string;
  /** Why this is the next step. */
  why?: string;
  /** A prompt for the learner's agent. */
  prompt?: string;
  /** Names the Tool the agent is expected to call. */
  tool?: string;
}>();
</script>
<template>
  <section class="s-next" :aria-label="$t('next.title')">
    <div class="s-next__main">
      <p class="s-next__kicker">
        <i aria-hidden="true" />{{ kicker ?? $t("next.title")
        }}<span v-if="kind"> · {{ kind }}</span>
      </p>
      <h2 class="s-next__title">{{ title }}</h2>
      <p v-if="why" class="s-next__why">{{ why }}</p>
      <div v-if="$slots.default" class="s-next__body"><slot /></div>
      <div v-if="$slots.actions" class="s-next__actions"><slot name="actions" /></div>
    </div>
    <div v-if="prompt" class="s-next__prompt">
      <UiAgentPrompt :text="prompt" :tool="tool" />
    </div>
  </section>
</template>
<style scoped>
.s-next {
  container: s-next / inline-size;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  border: 1px solid var(--s-copper-fill);
  border-radius: var(--s-radius-lg);
  background: var(--s-raised);
  box-shadow: var(--s-glow);
  overflow: hidden;
}
.s-next__main {
  display: grid;
  align-content: start;
  gap: var(--s-3);
  padding: var(--s-5) var(--s-6) var(--s-6);
}
.s-next__kicker {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font: 600 var(--s-text-2xs) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--s-copper);
}
.s-next__kicker i {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--s-copper-fill);
  animation: s-next-pulse 2.4s var(--s-ease) infinite;
}
@keyframes s-next-pulse {
  50% {
    opacity: 0.35;
  }
}
@media (prefers-reduced-motion: reduce) {
  .s-next__kicker i {
    animation: none;
  }
}
.s-next__title {
  font: 600 clamp(1.375rem, 4.4cqi, 1.875rem) / 1.12 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.035em;
  text-wrap: balance;
}
.s-next__why {
  max-width: 36rem;
  color: var(--s-ink-2);
}
.s-next__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-3);
  margin-top: var(--s-2);
}
.s-next__prompt {
  padding: var(--s-4);
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
}
@container s-next (min-width: 50rem) {
  .s-next:has(.s-next__prompt) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 24rem);
  }
  .s-next__prompt {
    display: grid;
    align-content: center;
    border-top: 0;
    border-left: 1px solid var(--s-line);
  }
}
</style>
