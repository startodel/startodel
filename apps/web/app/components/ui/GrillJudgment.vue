<script setup lang="ts">
/**
 * A submitted answer with its judgment. Until the external agent judges it, the Verdict is
 * shown as awaited and the default slot holds what the learner can do about it.
 */
defineProps<{
  answer: string;
  /** Where the answer was submitted. */
  source?: "ui" | "mcp";
  answeredAt?: string;
  verdict?: "strong" | "partial" | "weak";
  /** The agent's comment on the answer. */
  feedback?: string;
  judgedAt?: string;
}>();
const { t } = useI18n();
const lines = computed(() => ({
  strong: t("grill.lineStrong"),
  partial: t("grill.linePartial"),
  weak: t("grill.lineWeak"),
}));
</script>
<template>
  <div class="s-judgment" :class="'is-' + (verdict ?? 'pending')">
    <section class="s-judgment__answer" :aria-label="t('grill.answer')">
      <p class="s-judgment__label">
        {{ t("grill.answer") }}
        <span v-if="source" class="s-judgment__meta">{{
          source === "mcp" ? t("grill.viaAgent") : t("grill.viaPage")
        }}</span>
        <span v-if="answeredAt" class="s-judgment__meta">{{ answeredAt }}</span>
      </p>
      <p class="s-judgment__text">{{ answer }}</p>
    </section>
    <section class="s-judgment__verdict" :aria-label="t('grill.verdictTitle')" aria-live="polite">
      <template v-if="verdict">
        <header class="s-judgment__head">
          <UiVerdict :verdict="verdict" size="lg" />
          <p class="s-judgment__line">{{ lines[verdict] }}</p>
          <span v-if="judgedAt" class="s-judgment__meta">{{ judgedAt }}</span>
        </header>
        <p v-if="feedback" class="s-judgment__text s-judgment__text--agent">{{ feedback }}</p>
      </template>
      <template v-else>
        <header class="s-judgment__head">
          <UiVerdict verdict="pending" size="lg" />
          <UiPending :label="t('grill.waiting')" />
        </header>
        <slot />
      </template>
    </section>
  </div>
</template>
<style scoped>
.s-judgment {
  --_tone: var(--s-line-strong);
  display: grid;
  border: 1px solid var(--s-line-strong);
  border-radius: var(--s-radius-md);
  background: var(--s-raised);
  overflow: hidden;
}
.s-judgment.is-strong {
  --_tone: var(--s-verdigris);
}
.s-judgment.is-partial {
  --_tone: var(--s-brass);
}
.s-judgment.is-weak {
  --_tone: var(--s-oxide);
}
.s-judgment__answer,
.s-judgment__verdict {
  display: grid;
  gap: var(--s-3);
  padding: var(--s-5);
}
.s-judgment__verdict {
  border-top: 1px solid var(--s-line);
  background: var(--s-surface);
  box-shadow: inset 3px 0 0 var(--_tone);
}
.s-judgment.is-pending .s-judgment__verdict {
  border-top-style: dashed;
  box-shadow: none;
}
.s-judgment__label,
.s-judgment__meta {
  font: 500 var(--s-text-2xs) / 1.3 var(--s-font-mono);
  font-stretch: 75%;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--s-ink-3);
}
.s-judgment__label {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1) var(--s-3);
}
.s-judgment__meta {
  letter-spacing: 0.04em;
  text-transform: none;
}
.s-judgment__text {
  max-width: 42rem;
  font: 400 var(--s-text-lg) / 1.6 var(--s-font-read);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
.s-judgment__text--agent {
  color: var(--s-ink-2);
}
.s-judgment__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--s-2) var(--s-4);
}
.s-judgment__line {
  font-size: var(--s-text-sm);
  color: var(--s-ink-2);
}
.s-judgment__head .s-judgment__meta {
  margin-left: auto;
}
</style>
