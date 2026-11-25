<script setup lang="ts">
/** One Grill Question on the bench: its number, its Topic and the prompt in the reading voice. */
defineProps<{
  /** From 1. */
  number: number;
  total: number;
  prompt: string;
  /** The Topic the question tests, when it has one. */
  topic?: { tag?: string; title: string };
}>();
</script>
<template>
  <article class="s-question">
    <header class="s-question__head">
      <p class="s-question__number">
        <span>{{ "Q" + String(number).padStart(2, "0") }}</span
        ><span class="s-question__total">/ {{ total }}</span>
      </p>
      <p v-if="topic" class="s-question__topic">
        <span v-if="topic.tag" class="s-question__tag">{{ topic.tag }}</span>{{ topic.title }}
      </p>
    </header>
    <h2 class="s-question__prompt"><UiInline :text="prompt" /></h2>
    <div class="s-question__body"><slot /></div>
  </article>
</template>
<style scoped>
.s-question {
  display: grid;
  gap: var(--s-5);
  min-width: 0;
}
.s-question__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2) var(--s-4);
  padding-bottom: var(--s-3);
  border-bottom: 1px solid var(--s-line);
}
.s-question__number {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  font: 600 var(--s-text-xl) / 1 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: -0.02em;
  color: var(--s-copper);
}
.s-question__total,
.s-question__topic,
.s-question__tag {
  font: 500 var(--s-text-xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.04em;
  color: var(--s-ink-3);
}
.s-question__topic {
  display: inline-flex;
  align-items: baseline;
  gap: var(--s-2);
  margin-left: auto;
  font-family: var(--s-font-ui);
  font-stretch: normal;
  letter-spacing: 0;
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-question__prompt {
  max-width: 44rem;
  font: 500 clamp(1.25rem, 3.4cqi, 1.625rem) / 1.35 var(--s-font-read);
  letter-spacing: -0.012em;
  text-wrap: pretty;
}
.s-question__body {
  display: grid;
  gap: var(--s-5);
}
</style>
