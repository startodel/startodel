<script setup lang="ts">
import type { LinkTarget } from "./nav";
import { NuxtLinkLocale } from "#components";
/**
 * The Fork action with the number of Public Forks beside it. After a Fork exists the button
 * leads to the learner's copy, because a Public Track can be forked only once.
 */
defineProps<{
  count: number;
  busy?: boolean;
  disabled?: boolean;
  /** Where the learner's existing Fork lives. */
  forked?: LinkTarget;
  /** Where the count leads, usually the list of Forks. */
  countTo?: LinkTarget;
}>();
defineEmits<{ fork: [] }>();
const countArgs = useCountArgs();
</script>
<template>
  <span class="s-fork">
    <UiButton v-if="forked" :to="forked" icon="check" class="s-fork__button">{{
      $t("public.openFork")
    }}</UiButton>
    <UiButton
      v-else
      variant="primary"
      icon="fork"
      class="s-fork__button"
      :loading="busy"
      :disabled="disabled"
      @click="$emit('fork')"
    >
      {{ $t("public.fork") }}
    </UiButton>
    <component
      :is="countTo ? NuxtLinkLocale : 'span'"
      :to="countTo"
      class="s-fork__count"
      :aria-label="$t('count.forks', countArgs(count))"
    >
      {{ count }}
    </component>
  </span>
</template>
<style scoped>
.s-fork {
  display: inline-flex;
  align-items: stretch;
}
.s-fork .s-fork__button {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.s-fork__count {
  display: grid;
  place-items: center;
  min-width: 2.5rem;
  padding: 0 var(--s-3);
  border: 1px solid var(--s-line-strong);
  border-left: 0;
  border-radius: 0 var(--s-radius-sm) var(--s-radius-sm) 0;
  background: var(--s-raised);
  color: var(--s-ink);
  font: 600 var(--s-text-sm) / 1 var(--s-font-mono);
  font-stretch: 75%;
  font-variant-numeric: tabular-nums;
  text-decoration: none;
}
a.s-fork__count:hover {
  border-color: var(--s-ink);
  box-shadow: -1px 0 0 var(--s-ink);
}
</style>
